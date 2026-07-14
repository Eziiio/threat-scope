import dotenv from 'dotenv';
import SavedIOC from '../models/SavedIOC.js';
import mongoose from 'mongoose';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Saved IOC API Verification Tests...\n');
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
  const email = `analyst_${uniqueId}@iocs-test.local`;
  const password = 'password123';
  let token = '';

  // Step 1: Register User to acquire session
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'IOC Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed user registration setup:', err.message);
  }

  // Connect to database to check reports counts
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);

  let tempIocId = '';
  const testIocVal = '198.51.100.42';

  // Test 1: Add new Saved IOC bookmark
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ioc: testIocVal,
        type: 'ip',
        description: 'Test beacon beacon indicator',
        tags: ['malicious', 'test']
      })
    });
    const data = await res.json();
    tempIocId = data.data?._id;
    assert(
      'Registering a new IOC bookmark creates watchlists record',
      res.status === 201 && data.success === true && tempIocId && data.data.ioc === testIocVal,
      `Status: ${res.status}, Message: ${data.message}, Data: ${JSON.stringify(data.data)}`
    );
  } catch (err) {
    assert('Add saved IOC test', false, err.message);
  }

  // Test 2: Add Duplicate Saved IOC bookmark (Should fail)
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ioc: testIocVal,
        type: 'ip',
        description: 'Test duplicates description',
        tags: ['malicious', 'test']
      })
    });
    const data = await res.json();
    assert(
      'Duplicate bookmark check blocks overlapping entries',
      res.status === 400 && data.success === false && data.message.includes('already bookmarked'),
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Duplicate block test', false, err.message);
  }

  // Test 3: List Saved IOCs
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs?page=1&limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const list = data.data?.iocs;
    const pagination = data.data?.pagination;
    assert(
      'List watchlists returns paginated array data',
      res.status === 200 && data.success === true && Array.isArray(list) && list.length > 0 && pagination,
      `Status: ${res.status}, List Count: ${list?.length}, Pagination: ${JSON.stringify(pagination)}`
    );
  } catch (err) {
    assert('List saved IOCs test', false, err.message);
  }

  // Test 4: List Saved IOCs with Type Filter
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs?type=ip`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    const list = data.data?.iocs || [];
    const onlyIPs = list.every(item => item.type === 'ip');
    assert(
      'Watchlist type query parameter filters indicator types',
      res.status === 200 && data.success === true && onlyIPs,
      `Status: ${res.status}, Count: ${list.length}, Only IPs: ${onlyIPs}`
    );
  } catch (err) {
    assert('Type filter test', false, err.message);
  }

  // Test 5: Delete Saved IOC bookmark
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs/${tempIocId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    
    // Verify deletion in database
    const dbCheck = await SavedIOC.findById(tempIocId);
    assert(
      'Watchlist deletions remove items from database',
      res.status === 200 && data.success === true && dbCheck === null,
      `Status: ${res.status}, Message: ${data.message}, DB Exists: ${!!dbCheck}`
    );
  } catch (err) {
    assert('Delete saved IOC test', false, err.message);
  }

  // Test 6: Authorization check blocks access
  try {
    const res = await fetch(`${BASE_URL}/saved-iocs`, { method: 'GET' });
    const data = await res.json();
    assert(
      'Auth check block prevents unauthorized watchlist reads',
      res.status === 401 && data.success === false,
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Auth check test', false, err.message);
  }

  // Cleanup
  console.log('\nCleaning up databases...');
  await mongoose.connection.close();
  console.log('Cleanup complete.');

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
