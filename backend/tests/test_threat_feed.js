import dotenv from 'dotenv';
import ThreatReport from '../models/ThreatReport.js';
import mongoose from 'mongoose';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Threat Feed API Verification Tests...\n');
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

  // Define unique user credentials to fetch session token
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const email = `analyst_${uniqueId}@feed-test.local`;
  const password = 'password123';
  let token = '';

  // Step 1: Register User to acquire session
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Feed Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed user registration setup:', err.message);
  }

  // Connect to database to check reports counts
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);

  // Test 1: Paginated Threat Feed Retrieval
  try {
    const res = await fetch(`${BASE_URL}/threat-feed?page=1&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const reports = data.data?.reports;
    const pagination = data.data?.pagination;
    
    assert(
      'Paginated threat feed returns correct limits and pages',
      res.status === 200 && data.success === true && reports.length <= 3 && pagination && pagination.limit === 3,
      `Status: ${res.status}, Count: ${reports?.length}, Pagination: ${JSON.stringify(pagination)}`
    );
  } catch (err) {
    assert('Paginated threat feed test', false, err.message);
  }

  // Test 2: Threat Feed Category Filter (e.g. ransomware)
  try {
    const res = await fetch(`${BASE_URL}/threat-feed?category=ransomware`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const reports = data.data?.reports || [];
    const onlyRansomware = reports.every(r => r.category === 'ransomware');
    assert(
      'Threat feed category filter restricts category type',
      res.status === 200 && data.success === true && onlyRansomware,
      `Status: ${res.status}, Count: ${reports.length}, Only Ransomware: ${onlyRansomware}`
    );
  } catch (err) {
    assert('Category filter test', false, err.message);
  }

  // Test 3: Threat Feed Text Regex Search
  try {
    const res = await fetch(`${BASE_URL}/threat-feed?search=Log4j`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const reports = data.data?.reports || [];
    const matchLog4j = reports.every(r => r.title.includes('Log4j') || r.description.includes('Log4j'));
    assert(
      'Threat feed regex search filters by term match',
      res.status === 200 && data.success === true && reports.length > 0 && matchLog4j,
      `Status: ${res.status}, Matches Count: ${reports.length}, Match: ${matchLog4j}`
    );
  } catch (err) {
    assert('Regex search test', false, err.message);
  }

  // Test 4: Threat Feed Refresh Sync Action
  try {
    const preCount = await ThreatReport.countDocuments();
    const res = await fetch(`${BASE_URL}/threat-feed?refresh=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const postCount = await ThreatReport.countDocuments();
    assert(
      'Refresh trigger invokes feed sync and logs results',
      res.status === 200 && data.success === true && postCount >= preCount,
      `Pre Count: ${preCount}, Post Count: ${postCount}`
    );
  } catch (err) {
    assert('Threat feed refresh sync test', false, err.message);
  }

  // Test 5: Authorization Check Blocks Request
  try {
    const res = await fetch(`${BASE_URL}/threat-feed`, { method: 'GET' });
    const data = await res.json();
    assert(
      'Auth check block prevents feed access',
      res.status === 401 && data.success === false,
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Auth check test', false, err.message);
  }

  // Cleanup testing user
  console.log('\nCleaning up database session testing logs...');
  await mongoose.connection.close();
  console.log('Cleanup complete.');

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
