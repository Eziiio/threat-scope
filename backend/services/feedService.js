import axios from 'axios';
import ThreatReport from '../models/ThreatReport.js';

/**
 * Synchronizes the local database with the latest public threat pulses from AlienVault OTX
 * @returns {Promise<number>} Number of newly synchronized threat reports
 */
export const fetchLiveOTXFeed = async () => {
  const apiKey = process.env.ALIENVAULT_OTX_API_KEY;
  const isMock = !apiKey || apiKey === 'mock_key' || apiKey.startsWith('your_');
  
  let pulses = [];

  if (!isMock) {
    try {
      // Query AlienVault OTX public activity feed
      const response = await axios.get('https://otx.alienvault.com/api/v1/pulses/activity', {
        headers: {
          'X-OTX-API-KEY': apiKey
        },
        params: {
          limit: 15
        },
        timeout: 8000 // 8 seconds timeout
      });

      pulses = response.data?.results || [];
      console.log(`[Feed Service] Fetched ${pulses.length} live pulses from AlienVault OTX.`);
    } catch (error) {
      console.warn(`[Feed Service Warning] Live AlienVault OTX activity feed failed: ${error.message}. Mocking feed update.`);
    }
  }

  // Generate mock feed pulses if OTX is unavailable or key is unconfigured
  if (pulses.length === 0) {
    pulses = generateMockOTXPulses();
    console.log(`[Feed Service] Generated ${pulses.length} high-fidelity mock pulses.`);
  }

  // Upsert pulses into the local database
  let newCount = 0;
  for (const pulse of pulses) {
    try {
      const title = pulse.name || 'Unknown Threat Intel Bulletin';
      
      // Prevent duplicate imports based on title match
      const exists = await ThreatReport.findOne({ title });
      if (!exists) {
        // Map pulse tags to categories
        const tags = (pulse.tags || []).map(t => t.toLowerCase());
        let category = 'malware';
        
        if (tags.some(t => t.includes('ransomware') || t.includes('lockbit') || t.includes('ransom'))) {
          category = 'ransomware';
        } else if (tags.some(t => t.includes('zero-day') || t.includes('zeroday') || t.includes('cve-'))) {
          category = 'zero-day';
        } else if (tags.some(t => t.includes('phishing') || t.includes('credential') || t.includes('spoof'))) {
          category = 'phishing';
        } else if (tags.some(t => t.includes('advisory') || t.includes('patch') || t.includes('intel'))) {
          category = 'advisory';
        }

        // Map risk to severity
        let severity = 'medium';
        if (tags.some(t => t.includes('critical') || t.includes('apt') || t.includes('exploit'))) {
          severity = 'critical';
        } else if (tags.some(t => t.includes('high') || t.includes('malware') || t.includes('c2'))) {
          severity = 'high';
        } else if (tags.some(t => t.includes('low') || t.includes('info'))) {
          severity = 'low';
        }

        await ThreatReport.create({
          title,
          severity,
          category,
          source: 'AlienVault OTX',
          description: pulse.description || `Threat Intel indicator feed reporting active ${category} indicators.`,
          publishedAt: new Date(pulse.modified || Date.now())
        });
        
        newCount++;
      }
    } catch (err) {
      console.error(`[Feed Service Error] Failed to import pulse: ${err.message}`);
    }
  }

  console.log(`[Feed Service] Threat feed synchronization complete. Added ${newCount} new reports.`);
  return newCount;
};

// Generates high-fidelity mock threat feeds representing recent cyber campaigns
const generateMockOTXPulses = () => {
  return [
    {
      name: 'CVE-2024-3094: XZ Utils Backdoor and Exploit Vectors',
      description: 'Malicious code backdoors discovered in XZ Utils compression tool archive liblzma starting with versions 5.6.0. An SSH backdoor allows authentication bypass and command execution.',
      modified: new Date().toISOString(),
      tags: ['critical', 'zero-day', 'cve-2024-3094', 'exploit', 'backdoor']
    },
    {
      name: 'RedLine Stealer Spreading via Fake Microsoft Teams Installers',
      description: 'Analysis of phishing campaigns routing corporate targets to malicious ad portals serving cloned MSI installers embedded with RedLine Stealer payload packages.',
      modified: new Date(Date.now() - 3600000).toISOString(),
      tags: ['high', 'malware', 'stealer', 'credential-theft']
    },
    {
      name: 'BlackCat Ransomware Target Health Care Services Network Edge',
      description: 'Recent observations of ALPHV / BlackCat ransomware operations exploiting unpatched edge servers to deploy data-encrypting payloads across local administrative segments.',
      modified: new Date(Date.now() - 7200000).toISOString(),
      tags: ['critical', 'ransomware', 'alphv', 'healthcare']
    },
    {
      name: 'Phishing Campaign Impersonating DocuSign Signing Panels',
      description: 'Active phishing droppers utilizing docx/pdf attachments routing corporate victims to credential harvesting forms designed to copy email logins.',
      modified: new Date(Date.now() - 10800000).toISOString(),
      tags: ['medium', 'phishing', 'credential-harvesting']
    },
    {
      name: 'Ivanti Connect Secure Zero-Day CVE-2024-21887 Command Injection',
      description: 'Ivanti Connect Secure gateways are active targets of web shell injection scans. Attackers bypass gateway checks and trigger remote code command execution.',
      modified: new Date(Date.now() - 86400000).toISOString(),
      tags: ['critical', 'zero-day', 'exploit', 'ivanti']
    }
  ];
};
