import User from '../models/User.js';
import Alert from '../models/Alert.js';
import ThreatReport from '../models/ThreatReport.js';
import SavedIOC from '../models/SavedIOC.js';
import Investigation from '../models/Investigation.js';

export const seedMockData = async () => {
  try {
    console.log('[Seeder] Checking database contents...');

    // 1. Ensure at least one User (Default Admin/Analyst) exists
    let defaultUser = await User.findOne({ email: 'admin@threatscope.local' });
    if (!defaultUser) {
      console.log('[Seeder] Creating default administrator user...');
      defaultUser = await User.create({
        name: 'SOC Administrator',
        email: 'admin@threatscope.local',
        password: 'adminpassword123', // Will be hashed by User model pre-save hook
        role: 'admin'
      });
    }

    // 2. Seed Threat Reports if empty
    const reportCount = await ThreatReport.countDocuments();
    if (reportCount === 0) {
      console.log('[Seeder] Seeding initial Threat Reports...');
      await ThreatReport.insertMany([
        {
          title: 'CVE-2021-44228: Log4Shell Remote Code Execution',
          severity: 'critical',
          category: 'zero-day',
          source: 'NVD',
          description: 'Apache Log4j2 JNDI parsing vulnerability allows remote unauthenticated attackers to execute arbitrary system code loaded from external directory lookup servers.',
          publishedAt: new Date('2021-12-10T00:00:00Z')
        },
        {
          title: 'Ransomware Campaign Target Financial Infrastructure via LockBit 3.0',
          severity: 'critical',
          category: 'ransomware',
          source: 'CISA',
          description: 'CISA releases advisory detailing tactics, techniques, and procedures (TTPs) of LockBit 3.0 operators compromising corporate networks through vulnerable VPN endpoints.',
          publishedAt: new Date(Date.now() - 5 * 24 * 3600000) // 5 days ago
        },
        {
          title: 'New Stealer Variant: RedLine Droppers Disguised as VPN Utilities',
          severity: 'high',
          category: 'malware',
          source: 'AlienVault',
          description: 'RedLine Stealer campaigns spreading via malicious Google Search Ads pointing to cloned software portals, harvesting cookies, wallets, and credentials.',
          publishedAt: new Date(Date.now() - 10 * 24 * 3600000) // 10 days ago
        },
        {
          title: 'Phishing Campaign Impersonating Adobe DocuSign Portal',
          severity: 'medium',
          category: 'phishing',
          source: 'AlienVault',
          description: 'Credential harvesting campaign routing targets to external malicious portals mimicking digital signature panels, collecting corporate logins.',
          publishedAt: new Date(Date.now() - 15 * 24 * 3600000) // 15 days ago
        },
        {
          title: 'CVE-2024-21626: runc Container Escapes Vulnerability',
          severity: 'high',
          category: 'advisory',
          source: 'NVD',
          description: 'A file descriptor leak vulnerability in runc allows container breakout, granting hosts files access to guest processes.',
          publishedAt: new Date('2024-01-31T00:00:00Z')
        }
      ]);
    }

    // 3. Seed Alerts if empty
    const alertCount = await Alert.countDocuments();
    if (alertCount === 0) {
      console.log('[Seeder] Seeding initial Security Alerts...');
      await Alert.insertMany([
        {
          title: 'Malicious C2 Callback (LockBit Beacon)',
          severity: 'critical',
          status: 'active',
          createdAt: new Date(Date.now() - 10 * 60000) // 10 mins ago
        },
        {
          title: 'Multiple SSH Brute Force Attempts',
          severity: 'high',
          status: 'active',
          createdAt: new Date(Date.now() - 45 * 60000) // 45 mins ago
        },
        {
          title: 'Local Privilege Escalation Attempt (runc)',
          severity: 'critical',
          status: 'active',
          createdAt: new Date(Date.now() - 2 * 3600000) // 2 hours ago
        },
        {
          title: 'Network Port Scan Sweeps (Nmap)',
          severity: 'medium',
          status: 'resolved',
          createdAt: new Date(Date.now() - 24 * 3600000) // 1 day ago
        },
        {
          title: 'Outbound Traffic to Tor Exit Node',
          severity: 'high',
          status: 'suppressed',
          createdAt: new Date(Date.now() - 48 * 3600000) // 2 days ago
        },
        {
          title: 'SQL Injection Scan Inbound',
          severity: 'medium',
          status: 'resolved',
          createdAt: new Date(Date.now() - 72 * 3600000) // 3 days ago
        }
      ]);
    }

    // 4. Seed Saved IOCs if empty
    const iocCount = await SavedIOC.countDocuments();
    if (iocCount === 0) {
      console.log('[Seeder] Seeding initial Saved IOCs...');
      await SavedIOC.insertMany([
        {
          indicator: '185.220.101.5',
          type: 'ip',
          notes: 'Tor Exit node identified scanning local edge devices.',
          tags: ['Scanning', 'Tor'],
          createdBy: defaultUser._id
        },
        {
          indicator: 'd41d8cd98f00b204e9800998ecf8427e',
          type: 'hash',
          notes: 'Malicious payload matching Mimikatz installer binary.',
          tags: ['Mimikatz', 'Credential Theft'],
          createdBy: defaultUser._id
        },
        {
          indicator: 'phishing-docusign-update.ru',
          type: 'domain',
          notes: 'C2 beacon domain for spearfishing campaign.',
          tags: ['Phishing', 'C2'],
          createdBy: defaultUser._id
        },
        {
          indicator: 'http://malicious-payload-dropper.com/payload.bin',
          type: 'url',
          notes: 'Active payload download dropper link.',
          tags: ['Dropper', 'Payload'],
          createdBy: defaultUser._id
        }
      ]);
    }

    // 5. Seed Investigations (staggered for trend charts) if empty
    const invCount = await Investigation.countDocuments();
    if (invCount === 0) {
      console.log('[Seeder] Seeding historical Investigations...');
      
      const investigationsList = [];
      const sources = ['VirusTotal', 'AbuseIPDB', 'AlienVault OTX', 'NVD CVE'];
      const queryTypes = ['ip', 'domain', 'hash', 'url'];
      
      // Seed 25 historical investigations over the past 5 months
      for (let i = 25; i >= 0; i--) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - i * 6); // staggered dates

        const src = sources[i % sources.length];
        const type = queryTypes[i % queryTypes.length];
        let queryVal = '192.168.1.1';
        
        if (type === 'domain') queryVal = `malicious-site-${i}.ru`;
        else if (type === 'hash') queryVal = `d41d8cd98f00b204e9800998ecf8427${i}`;
        else if (type === 'url') queryVal = `http://banking-update-verify-${i}.net/login`;
        else queryVal = `185.190.140.${10 + i}`;

        investigationsList.push({
          query: queryVal,
          queryType: type,
          source: src,
          result: { detectionCount: i % 2 === 0 ? i : 0, message: 'Scan Complete' },
          createdBy: defaultUser._id,
          timestamp
        });
      }
      
      await Investigation.insertMany(investigationsList);
    }

    console.log('[Seeder] Seeding logic check complete.');
  } catch (error) {
    console.error(`[Seeder Error] Seeding database failed: ${error.message}`);
  }
};
