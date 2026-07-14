import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Investigation from '../models/Investigation.js';
import Alert from '../models/Alert.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting AI Threat Explainer Integration Tests...\n');
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

  // 1. Register analyst session token
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const email = `analyst_${uniqueId}@ai-test.local`;
  const password = 'password123';
  let token = '';

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'AI Explainer Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed registration setup:', err.message);
  }

  // 2. Log threat lookup
  let investigationId = '';
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
    investigationId = data.data?.id;
  } catch (err) {
    console.error('Failed to post CTI IP lookup:', err.message);
  }

  // Test 1: Verify the investigation document has been created
  assert('Logged CTI lookup recorded in MongoDB', !!investigationId, `Received ID: ${investigationId}`);

  // 3. Request AI threat explanation
  let explainRes;
  let explainData;
  try {
    explainRes = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ investigationId })
    });
    explainData = await explainRes.json();
  } catch (err) {
    console.error('Failed to request threat explanation:', err.message);
  }

  // Test 2: Check Response Status
  assert('Threat explanation request returns HTTP 200 OK', explainRes && explainRes.status === 200, `HTTP status: ${explainRes?.status}`);

  // Test 3: Check Explanation Structure
  assert('Response contains success flag', explainData && explainData.success === true, `Response success: ${explainData?.success}`);
  
  const hasMarkdownHeadings = explainData?.explanation?.includes('### AI Analyst Summary') && explainData?.explanation?.includes('### Threat Analysis');
  assert('AI threat explainer returns formatted Markdown report', hasMarkdownHeadings, `Received text: ${explainData?.explanation}`);

  // Database Cleanup
  console.log('\nCleaning up AI test databases...');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);
  await Investigation.deleteMany({ createdBy: new mongoose.Types.ObjectId(jwtDecodeUserId(token)) });
  await Alert.deleteMany({ title: /Intrusion Alert/ });
  await mongoose.connection.close();
  console.log('Cleanup complete.');

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

// Simple base64 token payload decoder to fetch userId for cleanup
function jwtDecodeUserId(jwt) {
  try {
    const payload = jwt.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded.id;
  } catch (err) {
    return null;
  }
}

runTests();
