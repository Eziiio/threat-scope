import dotenv from 'dotenv';
import { io } from 'socket.io-client';
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('Starting Real-Time Socket.io Integration Tests...\n');
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

  // 1. Establish Socket Client Connection
  let clientSocket;
  try {
    clientSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true
    });
  } catch (err) {
    console.error('Failed to initialize socket client:', err.message);
  }

  // Test 1: Socket connection handshake
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!clientSocket.connected) {
        assert('Socket client handshake test', false, 'Handshake connection timed out.');
        resolve();
      }
    }, 4000);

    clientSocket.on('connect', () => {
      clearTimeout(timer);
      assert('Socket client establishes handshake with server stream', true);
      resolve();
    });
  });

  // 2. Fetch authenticated JWT session
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const email = `analyst_${uniqueId}@socket-test.local`;
  const password = 'password123';
  let token = '';

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Socket Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed user registration setup:', err.message);
  }

  // Setup database connection to cleanup triggered alerts
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threatscope';
  await mongoose.connect(MONGO_URI);

  // Test 2: Trigger Alert and Listen on Socket Event
  await new Promise(async (resolve) => {
    // Register socket listener for the target alert broadcast
    clientSocket.on('new-alert', (alert) => {
      assert(
        'Server broadcasts new-alert events containing correct incident metadata',
        alert && alert.title.includes('IP'),
        `Received payload: ${JSON.stringify(alert)}`
      );
      resolve();
    });

    // Submitting a query for "8.8.8.8" (AbuseScore is 62% in mock fallback, which triggers alert!)
    try {
      console.log('Issuing scan request for malicious indicator IP 8.8.8.8...');
      const res = await fetch(`${BASE_URL}/ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: '8.8.8.8' })
      });
      const data = await res.json();
      if (!data.success) {
        console.warn('IP lookup request returned error status:', data.message);
      }
    } catch (err) {
      console.error('Failed to post CTI IP lookup:', err.message);
    }

    // Set 6s timeout trigger
    setTimeout(() => {
      resolve();
    }, 6000);
  });

  // Cleanup database entries
  console.log('\nCleaning up socket test databases...');
  await Alert.deleteMany({ title: /Intrusion Alert/ });
  await mongoose.connection.close();
  
  // Close socket client connection
  if (clientSocket) {
    clientSocket.disconnect();
  }
  console.log('Cleanup complete.');

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
