import Investigation from '../models/Investigation.js';
import Alert from '../models/Alert.js';
import { broadcastAlert } from '../socket.js';
import { checkIPReputation } from '../services/abuseIpService.js';
import { scanFileHash, scanDomain, scanIPAddress, scanURL } from '../services/vtService.js';
import { getOTXReputation } from '../services/otxService.js';
import { getIPGeolocation } from '../services/geoService.js';
import PDFDocument from 'pdfkit';
import ErrorResponse from '../utils/errorResponse.js';

// Helper to extract values from settled promise results
const getValueOrError = (settledPromise, fallbackMsg) => {
  return settledPromise.status === 'fulfilled' 
    ? settledPromise.value 
    : { success: false, error: settledPromise.reason?.message || fallbackMsg };
};

// Helper to trigger and broadcast IDS Alerts for malicious indicators
const triggerIDSAlert = async (type, query, severity, details) => {
  try {
    const alert = await Alert.create({
      title: `Intrusion Alert: Suspicious ${type.toUpperCase()}`,
      description: `ThreatScope CTI scanner parsed high confidence match for: ${query}. Details: ${details}`,
      severity,
      status: 'active',
      source: 'ThreatScope IDS Parser'
    });
    broadcastAlert(alert);
  } catch (err) {
    console.error('[IDS Parser Error] Failed to generate/broadcast alert:', err.message);
  }
};

// @desc    Investigate an IP Address across multiple CTI sources
// @route   POST /api/ip
// @access  Private (Analyst/Admin)
export const investigateIP = async (req, res, next) => {
  const { ip } = req.body;

  try {
    // Run CTI lookups in parallel
    const [abuseRes, vtRes, otxRes, geoRes] = await Promise.allSettled([
      checkIPReputation(ip),
      scanIPAddress(ip),
      getOTXReputation('ip', ip),
      getIPGeolocation(ip)
    ]);

    const abuse = getValueOrError(abuseRes, 'AbuseIPDB service unavailable');
    const virustotal = getValueOrError(vtRes, 'VirusTotal service unavailable');
    const otx = getValueOrError(otxRes, 'AlienVault OTX service unavailable');
    const geolocation = getValueOrError(geoRes, 'Geolocation service unavailable');

    const result = { abuse, virustotal, otx, geolocation };

    // Record lookup in database
    const investigation = await Investigation.create({
      query: ip,
      queryType: 'ip',
      source: 'Multi-Source (AbuseIPDB, VT, OTX, Geo)',
      result,
      createdBy: req.user ? req.user._id : null
    });

    // Check threat markers to trigger real-time IDS alert
    const abuseScore = abuse.abuseConfidenceScore || 0;
    const vtMalicious = virustotal.reputation?.malicious || 0;
    if (abuseScore > 20 || vtMalicious > 3) {
      const severity = (abuseScore > 50 || vtMalicious > 10) ? 'critical' : 'high';
      const details = `Abuse confidence score is ${abuseScore}%. VirusTotal flagged by ${vtMalicious} scanning engines.`;
      await triggerIDSAlert('ip', ip, severity, details);
    }

    res.status(200).json({
      success: true,
      message: 'IP investigation completed successfully',
      data: {
        id: investigation._id,
        query: ip,
        queryType: 'ip',
        timestamp: investigation.timestamp,
        abuse,
        virustotal,
        otx,
        geolocation
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Investigate a Domain name across multiple CTI sources
// @route   POST /api/domain
// @access  Private (Analyst/Admin)
export const investigateDomain = async (req, res, next) => {
  const { domain } = req.body;

  try {
    const [vtRes, otxRes] = await Promise.allSettled([
      scanDomain(domain),
      getOTXReputation('domain', domain)
    ]);

    const virustotal = getValueOrError(vtRes, 'VirusTotal service unavailable');
    const otx = getValueOrError(otxRes, 'AlienVault OTX service unavailable');

    const result = { virustotal, otx };

    // Record lookup
    const investigation = await Investigation.create({
      query: domain,
      queryType: 'domain',
      source: 'Multi-Source (VT, OTX)',
      result,
      createdBy: req.user ? req.user._id : null
    });

    // Check threat markers
    const vtMalicious = virustotal.reputation?.malicious || 0;
    if (vtMalicious > 3) {
      const severity = vtMalicious > 10 ? 'critical' : 'high';
      const details = `VirusTotal flagged by ${vtMalicious} scanning engines.`;
      await triggerIDSAlert('domain', domain, severity, details);
    }

    res.status(200).json({
      success: true,
      message: 'Domain investigation completed successfully',
      data: {
        id: investigation._id,
        query: domain,
        queryType: 'domain',
        timestamp: investigation.timestamp,
        virustotal,
        otx
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan a URL using VirusTotal reputation
// @route   POST /api/url
// @access  Private (Analyst/Admin)
export const investigateURL = async (req, res, next) => {
  const { url } = req.body;

  try {
    const vtReport = await scanURL(url);

    // Record lookup
    const investigation = await Investigation.create({
      query: url,
      queryType: 'url',
      source: 'VirusTotal URL Scan',
      result: { virustotal: vtReport },
      createdBy: req.user ? req.user._id : null
    });

    // Check threat markers
    const vtMalicious = vtReport.reputation?.malicious || 0;
    if (vtMalicious > 3) {
      const severity = vtMalicious > 10 ? 'critical' : 'high';
      const details = `VirusTotal flagged by ${vtMalicious} scanning engines.`;
      await triggerIDSAlert('url', url, severity, details);
    }

    res.status(200).json({
      success: true,
      message: 'URL investigation completed successfully',
      data: {
        id: investigation._id,
        query: url,
        queryType: 'url',
        timestamp: investigation.timestamp,
        virustotal: vtReport
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lookup file hash details across CTI sources
// @route   POST /api/hash
// @access  Private (Analyst/Admin)
export const investigateHash = async (req, res, next) => {
  const { hash } = req.body;

  try {
    const [vtRes, otxRes] = await Promise.allSettled([
      scanFileHash(hash),
      getOTXReputation('hash', hash)
    ]);

    const virustotal = getValueOrError(vtRes, 'VirusTotal service unavailable');
    const otx = getValueOrError(otxRes, 'AlienVault OTX service unavailable');

    const result = { virustotal, otx };

    // Record lookup
    const investigation = await Investigation.create({
      query: hash,
      queryType: 'hash',
      source: 'Multi-Source (VT, OTX)',
      result,
      createdBy: req.user ? req.user._id : null
    });

    // Check threat markers
    const vtMalicious = virustotal.reputation?.malicious || 0;
    if (vtMalicious > 3) {
      const severity = vtMalicious > 10 ? 'critical' : 'high';
      const details = `VirusTotal flagged by ${vtMalicious} scanning engines.`;
      await triggerIDSAlert('hash', hash, severity, details);
    }

    res.status(200).json({
      success: true,
      message: 'Hash investigation completed successfully',
      data: {
        id: investigation._id,
        query: hash,
        queryType: 'hash',
        timestamp: investigation.timestamp,
        virustotal,
        otx
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export investigation details to PDF report
// @route   GET /api/:id/pdf
// @access  Private (Analyst/Admin)
export const exportInvestigationPDF = async (req, res, next) => {
  const { id } = req.params;

  try {
    const doc = await Investigation.findById(id).populate('createdBy', 'name email');
    if (!doc) {
      return next(new ErrorResponse('Investigation report not found', 404));
    }

    // Create PDF Kit document
    const pdf = new PDFDocument({ margin: 50 });

    // Stream PDF back to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ThreatReport-${doc.queryType}-${doc.query}.pdf`);
    pdf.pipe(res);

    // 1. Header background and titles
    pdf.fillColor('#0b0f19').rect(0, 0, 612, 100).fill();
    pdf.fillColor('#38bdf8').fontSize(24).font('Helvetica-Bold').text('THREATSCOPE CYBER THREAT REPORT', 50, 35);
    pdf.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('CONFIDENTIAL // SECURITY OPERATIONS CENTRE (SOC) THREAT LOG', 50, 65);

    pdf.y = 120;

    // 2. Metadata Section
    pdf.fillColor('#0b0f19').fontSize(14).font('Helvetica-Bold').text('Report Metadata', 50);
    pdf.strokeColor('#e2e8f0').moveTo(50, pdf.y + 5).lineTo(562, pdf.y + 5).stroke();
    pdf.y += 15;

    pdf.fontSize(10).font('Helvetica').fillColor('#475569');
    pdf.text('Indicator Value: ', 50, pdf.y, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(doc.query);
    pdf.font('Helvetica').fillColor('#475569').text('Indicator Class: ', 50, pdf.y + 15, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(doc.queryType.toUpperCase());
    pdf.font('Helvetica').fillColor('#475569').text('Scan Source: ', 50, pdf.y + 30, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(doc.source);
    pdf.font('Helvetica').fillColor('#475569').text('Generated Date: ', 50, pdf.y + 45, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(new Date(doc.timestamp).toLocaleString());
    pdf.font('Helvetica').fillColor('#475569').text('Assigned Analyst: ', 50, pdf.y + 60, { continued: true }).font('Helvetica-Bold').fillColor('#0f172a').text(doc.createdBy ? `${doc.createdBy.name} (${doc.createdBy.email})` : 'ThreatScope Automation Engine');

    pdf.y += 90;

    // 3. Telemetry Threat Conclusion
    let isSuspicious = false;
    let details = 'Clean indicator or unreported telemetry.';
    
    const vt = doc.result?.virustotal;
    const abuse = doc.result?.abuse;
    
    const vtMalicious = vt?.reputation?.malicious || vt?.malicious || 0;
    const abuseScore = abuse?.reputation?.score || abuse?.abuseConfidenceScore || 0;

    if (vtMalicious > 3 || abuseScore > 20) {
      isSuspicious = true;
      details = `CTI matching engines flagged threat signatures. VirusTotal detections: ${vtMalicious}, AbuseIPDB confidence: ${abuseScore}%.`;
    }

    pdf.fillColor(isSuspicious ? '#fef2f2' : '#f0fdf4').rect(50, pdf.y, 512, 50).fill();
    pdf.strokeColor(isSuspicious ? '#f87171' : '#4ade80').rect(50, pdf.y, 512, 50).stroke();
    
    pdf.fillColor(isSuspicious ? '#991b1b' : '#166534').fontSize(11).font('Helvetica-Bold').text(
      isSuspicious ? 'CONCLUSION: POTENTIALLY SUSPICIOUS SIGNATURES FOUND' : 'CONCLUSION: CLEAN INDICATOR / SAFE TELEMETRY',
      65, pdf.y + 12
    );
    pdf.fontSize(9).font('Helvetica').text(details, 65, pdf.y + 28);

    pdf.y += 75;

    // 4. Source Specific Telemetry Detail blocks
    pdf.fillColor('#0b0f19').fontSize(14).font('Helvetica-Bold').text('Threat Intelligence Telemetry Details', 50);
    pdf.strokeColor('#e2e8f0').moveTo(50, pdf.y + 5).lineTo(562, pdf.y + 5).stroke();
    pdf.y += 15;

    // VT Details
    if (vt) {
      pdf.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('VirusTotal Engine Metrics', 50);
      pdf.fontSize(10).font('Helvetica').fillColor('#475569');
      pdf.text(`Malicious flags: ${vtMalicious}`);
      pdf.text(`Harmless scans: ${vt?.reputation?.harmless || vt?.harmless || 0}`);
      pdf.text(`Suspicious scans: ${vt?.reputation?.suspicious || vt?.suspicious || 0}`);
      pdf.text(`Undetected scans: ${vt?.reputation?.undetected || vt?.undetected || 0}`);
      pdf.y += 15;
    }

    // AbuseIPDB details
    if (abuse) {
      pdf.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('AbuseIPDB Threat Metrics', 50);
      pdf.fontSize(10).font('Helvetica').fillColor('#475569');
      pdf.text(`Abuse Confidence Score: ${abuseScore}%`);
      pdf.text(`Total user incident reports: ${abuse?.totalReports || 0}`);
      pdf.text(`ISP carrier: ${abuse?.isp || 'N/A'}`);
      pdf.y += 15;
    }

    // Geo Details
    const geo = doc.result?.geolocation;
    if (geo) {
      pdf.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('IP Geolocation Details', 50);
      pdf.fontSize(10).font('Helvetica').fillColor('#475569');
      pdf.text(`Coordinates: Lat: ${geo.latitude}, Lon: ${geo.longitude}`);
      pdf.text(`Country: ${geo.countryName} (${geo.countryCode})`);
      pdf.text(`City / Region: ${geo.city || 'N/A'}, ${geo.regionName || 'N/A'}`);
      pdf.y += 15;
    }

    // OTX Pulses count
    const otx = doc.result?.otx;
    if (otx) {
      pdf.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('AlienVault OTX Pulse Matches', 50);
      pdf.fontSize(10).font('Helvetica').fillColor('#475569');
      pdf.text(`Matched OTX Pulses count: ${otx.pulseCount || 0}`);
      pdf.y += 15;
    }

    // Finalize PDF kit
    pdf.end();
  } catch (error) {
    next(error);
  }
};
