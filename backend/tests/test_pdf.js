import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Investigation from '../models/Investigation.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting PDF Exporter API Integration Tests...\n');
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

  // 1. Fetch authenticated analyst token
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const email = `analyst_${uniqueId}@pdf-test.local`;
  const password = 'password123';
  let token = '';

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'PDF Exporter Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed registration setup:', err.message);
  }

  // 2. Trigger an investigation to create a document in MongoDB
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

  // 3. Request PDF generation download
  let pdfRes;
  let pdfBuffer;
  try {
    pdfRes = await fetch(`${BASE_URL}/${investigationId}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    pdfBuffer = await pdfRes.arrayBuffer();
  } catch (err) {
    console.error('Failed to request PDF download stream:', err.message);
  }

  // Test 2: Check Response Status
  assert('PDF download request returns HTTP 200 OK', pdfRes && pdfRes.status === 200, `HTTP status: ${pdfRes?.status}`);

  // Test 3: Check Headers
  const contentType = pdfRes?.headers.get('content-type');
  const contentDisposition = pdfRes?.headers.get('content-disposition');
  assert('Response returns Content-Type application/pdf', contentType === 'application/pdf', `Content-Type: ${contentType}`);
  assert('Response returns Content-Disposition attachment', contentDisposition && contentDisposition.includes('attachment'), `Content-Disposition: ${contentDisposition}`);

  // Test 4: Check PDF Magic Header
  const bytes = new Uint8Array(pdfBuffer);
  const magicString = String.fromCharCode(...bytes.slice(0, 4));
  assert('Exported buffer starts with standard %PDF magic header signature', magicString === '%PDF', `Magic string: ${magicString}`);

  // Database Cleanup
  console.log('\nCleaning up PDF test databases...');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);
  await Investigation.deleteMany({ createdBy: new mongoose.Types.ObjectId(jwtDecodeUserId(token)) });
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
