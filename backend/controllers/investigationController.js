import Investigation from '../models/Investigation.js';
import { checkIPReputation } from '../services/abuseIpService.js';
import { scanFileHash, scanDomain, scanIPAddress, scanURL } from '../services/vtService.js';
import { getOTXReputation } from '../services/otxService.js';
import { getIPGeolocation } from '../services/geoService.js';

// Helper to extract values from settled promise results
const getValueOrError = (settledPromise, fallbackMsg) => {
  return settledPromise.status === 'fulfilled' 
    ? settledPromise.value 
    : { success: false, error: settledPromise.reason?.message || fallbackMsg };
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
