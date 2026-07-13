import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Investigation from '../models/Investigation.js';
import ThreatReport from '../models/ThreatReport.js';
import SavedIOC from '../models/SavedIOC.js';
import Alert from '../models/Alert.js';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected successfully.\n');

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

  // Define unique identifiers for test
  const uniqueSuffix = Math.random().toString(36).substring(2, 10);
  const testEmail = `analyst_${uniqueSuffix}@models-test.local`;

  let testUser = null;
  let testInvestigation = null;
  let testThreatReport = null;
  let testSavedIOC = null;
  let testAlert = null;

  try {
    // 1. Create a User document
    testUser = await User.create({
      name: 'Model Analyst',
      email: testEmail,
      password: 'password123',
      role: 'analyst'
    });
    assert('User schema save', !!testUser._id, `User ID: ${testUser?._id}`);

    // 2. Create an Investigation document referencing User
    testInvestigation = await Investigation.create({
      query: '192.168.1.100',
      queryType: 'ip',
      source: 'AbuseIPDB',
      result: { abuseConfidenceScore: 95, countryCode: 'US' },
      createdBy: testUser._id
    });
    assert(
      'Investigation schema save & queryType enum constraint',
      testInvestigation.query === '192.168.1.100' && testInvestigation.queryType === 'ip',
      `Query: ${testInvestigation?.query}, Type: ${testInvestigation?.queryType}`
    );

    // 3. Create a ThreatReport document
    testThreatReport = await ThreatReport.create({
      title: 'Active Ransomware Campaign: LockBit 4.0',
      severity: 'critical',
      category: 'ransomware',
      source: 'CISA',
      description: 'CISA alerts organization of LockBit 4.0 variants targeting financial platforms.'
    });
    assert(
      'ThreatReport schema save & severity enum constraint',
      testThreatReport.severity === 'critical' && testThreatReport.category === 'ransomware',
      `Severity: ${testThreatReport?.severity}, Category: ${testThreatReport?.category}`
    );

    // 4. Create a SavedIOC document referencing User
    testSavedIOC = await SavedIOC.create({
      indicator: 'bad-actor-domain.com',
      type: 'domain',
      notes: 'Observed in spear-phishing payloads.',
      tags: ['APT28', 'Phishing'],
      createdBy: testUser._id
    });
    assert(
      'SavedIOC schema save & relation configuration',
      testSavedIOC.indicator === 'bad-actor-domain.com' && testSavedIOC.createdBy.equals(testUser._id),
      `Indicator: ${testSavedIOC?.indicator}, tags: ${testSavedIOC?.tags.join(', ')}`
    );

    // 5. SavedIOC Compound Index constraint (Unique domain per user check)
    try {
      await SavedIOC.create({
        indicator: 'bad-actor-domain.com',
        type: 'domain',
        createdBy: testUser._id
      });
      assert('SavedIOC compound unique index enforces constraint', false, 'Successfully saved duplicate IOC indicator for same user (Should fail)');
    } catch (error) {
      assert('SavedIOC compound unique index enforces constraint', error.code === 11000, `Thrown error code: ${error.code} (Expected 11000 duplicate key error)`);
    }

    // 6. Alert document Creation
    testAlert = await Alert.create({
      title: 'High CPU on Core Firewall',
      severity: 'high',
      status: 'active'
    });
    assert(
      'Alert schema save & default status',
      testAlert.status === 'active' && testAlert.severity === 'high',
      `Alert Title: ${testAlert?.title}, Status: ${testAlert?.status}`
    );

    // 7. Test Mongoose Reference Population
    const populatedIOC = await SavedIOC.findById(testSavedIOC._id).populate('createdBy');
    assert(
      'Mongoose reference population (.populate())',
      populatedIOC.createdBy.name === 'Model Analyst',
      `Populated user name: ${populatedIOC?.createdBy?.name}`
    );

    // 8. Test Schema Enums check
    try {
      await Alert.create({
        title: 'Malformed Alert',
        severity: 'extreme', // Invalid severity
        status: 'active'
      });
      assert('Mongoose enum validator rejects invalid values', false, 'Allowed invalid severity level: extreme');
    } catch (error) {
      assert(
        'Mongoose enum validator rejects invalid values',
        error.errors && error.errors.severity,
        `Error: ${error.message}`
      );
    }

  } catch (err) {
    console.error('Critical failure in testing execution: ', err);
  } finally {
    // Cleanup database test records
    console.log('\nCleaning up database test documents...');
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testInvestigation) await Investigation.deleteOne({ _id: testInvestigation._id });
    if (testThreatReport) await ThreatReport.deleteOne({ _id: testThreatReport._id });
    if (testSavedIOC) await SavedIOC.deleteMany({ createdBy: testUser._id });
    if (testAlert) await Alert.deleteOne({ _id: testAlert._id });
    console.log('Cleanup complete.');

    console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

runTests();
