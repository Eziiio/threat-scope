import dotenv from 'dotenv';
import Investigation from '../models/Investigation.js';
import mongoose from 'mongoose';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Investigation API Verification Tests...\n');
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
  const email = `analyst_${uniqueId}@investigation-test.local`;
  const password = 'password123';
  let token = '';

  // Step 1: Register User to acquire session
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Investigate Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed user registration setup:', err.message);
  }

  // Connect to database to verify DB counts
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);
  const initialCount = await Investigation.countDocuments();

  // Test 1: IP Investigation (Valid IP)
  try {
    const res = await fetch(`${BASE_URL}/ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ip: '8.8.8.8' })
    });
    const data = await res.json();
    const hasCTISources = data.data && data.data.abuse && data.data.virustotal && data.data.otx && data.data.geolocation;
    assert(
      'Multi-source IP lookup returns aggregated stats',
      res.status === 200 && data.success === true && hasCTISources && data.data.query === '8.8.8.8',
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('IP investigation test', false, err.message);
  }

  // Test 2: Domain Investigation (Valid Domain)
  try {
    const res = await fetch(`${BASE_URL}/domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ domain: 'google.com' })
    });
    const data = await res.json();
    const hasCTISources = data.data && data.data.virustotal && data.data.otx;
    assert(
      'Domain lookup returns VT and OTX aggregates',
      res.status === 200 && data.success === true && hasCTISources && data.data.query === 'google.com',
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Domain investigation test', false, err.message);
  }

  // Test 3: URL Investigation (Valid URL)
  try {
    const res = await fetch(`${BASE_URL}/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url: 'https://github.com/Eziiio/threat-scope' })
    });
    const data = await res.json();
    assert(
      'URL lookup returns VT scanner details',
      res.status === 200 && data.success === true && data.data.virustotal && data.data.query.includes('github.com'),
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('URL investigation test', false, err.message);
  }

  // Test 4: Hash Investigation (Valid Hash)
  try {
    const mimikatzHash = 'd41d8cd98f00b204e9800998ecf8427e';
    const res = await fetch(`${BASE_URL}/hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hash: mimikatzHash })
    });
    const data = await res.json();
    const hasCTISources = data.data && data.data.virustotal && data.data.otx;
    assert(
      'File Hash lookup returns VT and OTX details',
      res.status === 200 && data.success === true && hasCTISources && data.data.query === mimikatzHash,
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Hash investigation test', false, err.message);
  }

  // Test 5: Validation Check Rejects Bad Inputs (e.g. malformed IP)
  try {
    const res = await fetch(`${BASE_URL}/ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ip: '999.999.999.999' })
    });
    const data = await res.json();
    const isValidationErr = data.success === false && data.message === 'Validation Failed' && data.errors.some(e => e.field === 'ip');
    assert(
      'Express validation rejects invalid IP addresses',
      res.status === 400 && isValidationErr,
      `Status: ${res.status}, Message: ${data.message}, Errors: ${JSON.stringify(data.errors)}`
    );
  } catch (err) {
    assert('Validation check IP test', false, err.message);
  }

  // Test 6: Database Logging Verification
  try {
    const finalCount = await Investigation.countDocuments();
    // We ran 4 successful lookups in tests 1-4, so count should increase by 4
    const diff = finalCount - initialCount;
    assert(
      'Database increments logged investigations history',
      diff === 4,
      `Initial: ${initialCount}, Final: ${finalCount}, Difference: ${diff}`
    );
  } catch (err) {
    assert('DB logging test', false, err.message);
  }

  // Test 7: Authorization Check Blocks Request
  try {
    const res = await fetch(`${BASE_URL}/ip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: '1.1.1.1' })
    });
    const data = await res.json();
    assert(
      'Auth check block intercepts request',
      res.status === 401 && data.success === false,
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Auth check test', false, err.message);
  }

  // Cleanup testing user and database logs
  console.log('\nCleaning up testing database entries...');
  await Investigation.deleteMany({ createdBy: new mongoose.Types.ObjectId(jwtDecodeUserId(token)) });
  await mongoose.connection.close();
  console.log('Cleanup complete.');

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

// Simple client-side JWT decoder to find userId for cleanup
function jwtDecodeUserId(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.id;
  } catch (e) {
    return null;
  }
}

runTests();
