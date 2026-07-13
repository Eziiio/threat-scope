import dotenv from 'dotenv';
import { checkIPReputation } from '../services/abuseIpService.js';
import { scanFileHash, scanDomain, scanIPAddress, scanURL } from '../services/vtService.js';
import { getOTXReputation } from '../services/otxService.js';
import { getCVEDetails } from '../services/cveService.js';
import { checkEmailBreaches } from '../services/hibpService.js';
import { getIPGeolocation } from '../services/geoService.js';

// Load variables
dotenv.config();

async function runTests() {
  console.log('Starting Threat Intelligence Service Verification Tests...\n');
  let testCount = 0;
  let passCount = 0;

  function assert(name, condition, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`[PASS] Test #${testCount}: ${name}`);
    } else {
      console.error(`[FAIL] Test #${testCount}: ${name}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  // 1. AbuseIPDB Service Test
  try {
    const report = await checkIPReputation('8.8.8.8');
    assert(
      'AbuseIPDB service returns structured reputation',
      report && report.ipAddress === '8.8.8.8' && typeof report.abuseConfidenceScore === 'number',
      `Score: ${report?.abuseConfidenceScore}, ISP: ${report?.isp}`
    );
  } catch (err) {
    assert('AbuseIPDB service test', false, err.message);
  }

  // 2. VirusTotal File Hash Test
  try {
    const hash = 'd41d8cd98f00b204e9800998ecf8427e'; // Empty file MD5
    const report = await scanFileHash(hash);
    assert(
      'VirusTotal File Hash reputation parsing',
      report && report.success === true && report.reputation && typeof report.reputation.malicious === 'number',
      `Malicious: ${report?.reputation?.malicious}, Magic: ${report?.magic}`
    );
  } catch (err) {
    assert('VirusTotal Hash test', false, err.message);
  }

  // 3. VirusTotal Domain Test
  try {
    const domain = 'malicious-c2-channel.net';
    const report = await scanDomain(domain);
    assert(
      'VirusTotal Domain reputation parsing',
      report && report.success === true && report.reputation && typeof report.reputation.malicious === 'number',
      `Malicious: ${report?.reputation?.malicious}, Registrar: ${report?.registrar}`
    );
  } catch (err) {
    assert('VirusTotal Domain test', false, err.message);
  }

  // 4. VirusTotal IP Test
  try {
    const ip = '45.89.230.12';
    const report = await scanIPAddress(ip);
    assert(
      'VirusTotal IP reputation parsing',
      report && report.success === true && report.reputation && typeof report.reputation.malicious === 'number',
      `Malicious: ${report?.reputation?.malicious}, AS Owner: ${report?.asOwner}`
    );
  } catch (err) {
    assert('VirusTotal IP test', false, err.message);
  }

  // 5. VirusTotal URL Test
  try {
    const url = 'http://bank-login-update.com/signin';
    const report = await scanURL(url);
    assert(
      'VirusTotal URL reputation parsing',
      report && report.success === true && report.reputation && typeof report.reputation.malicious === 'number',
      `Malicious: ${report?.reputation?.malicious}, Title: ${report?.title}`
    );
  } catch (err) {
    assert('VirusTotal URL test', false, err.message);
  }

  // 6. AlienVault OTX Test (Domain)
  try {
    const report = await getOTXReputation('domain', 'cyber-intel.com');
    assert(
      'AlienVault OTX pulses and threat data extraction',
      report && report.success === true && typeof report.pulseCount === 'number' && Array.isArray(report.pulses),
      `Pulse Count: ${report?.pulseCount}, Malware Families: ${report?.malwareFamilies?.join(', ')}`
    );
  } catch (err) {
    assert('AlienVault OTX test', false, err.message);
  }

  // 7. NVD CVE Test (Known CVE-2021-44228)
  try {
    const report = await getCVEDetails('CVE-2021-44228');
    assert(
      'NVD CVE CVSS score and description extraction',
      report && report.success === true && report.cveId === 'CVE-2021-44228' && report.cvssScore === 10,
      `Severity: ${report?.severity}, CVSS: ${report?.cvssScore}, Vector: ${report?.vectorString}`
    );
  } catch (err) {
    assert('NVD CVE test', false, err.message);
  }

  // 8. HIBP Leak Test
  try {
    const report = await checkEmailBreaches('leak_test@threatscope.local');
    assert(
      'Have I Been Pwned breach counts and details',
      report && report.success === true && typeof report.breachCount === 'number' && Array.isArray(report.breaches),
      `Breach Count: ${report?.breachCount}, Pwned: ${report?.pwned}`
    );
  } catch (err) {
    assert('Have I Been Pwned test', false, err.message);
  }

  // 9. IP Geolocation Test (Standard Public IP)
  try {
    const report = await getIPGeolocation('8.8.8.8');
    assert(
      'IP Geolocation coordinates and ISP parsing',
      report && report.success === true && typeof report.latitude === 'number' && typeof report.longitude === 'number',
      `Country: ${report?.country}, City: ${report?.city}, LAT: ${report?.latitude}, LON: ${report?.longitude}, ISP: ${report?.isp}`
    );
  } catch (err) {
    assert('IP Geolocation test', false, err.message);
  }

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
