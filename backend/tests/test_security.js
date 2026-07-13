import dotenv from 'dotenv';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Security Middleware Verification Tests...\n');
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

  // Test 1: JWT Signature Error Normalization
  try {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_signature_token_here' }
    });
    const data = await res.json();
    assert(
      'JWT invalid token signature caught and normalized',
      res.status === 401 && data.success === false && data.message.includes('JSON Web Token is invalid'),
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('JWT signature error test', false, err.message);
  }

  // Test 2: Validation Error Format (Mongoose/Express-Validator)
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail' }) // missing name and password
    });
    const data = await res.json();
    const hasFieldErrors = data.errors && data.errors.some(e => e.field === 'name') && data.errors.some(e => e.field === 'password');
    assert(
      'Unified Validation failure formatting',
      res.status === 400 && data.success === false && data.message === 'Validation Failed' && hasFieldErrors,
      `Status: ${res.status}, Errors: ${JSON.stringify(data.errors)}`
    );
  } catch (err) {
    assert('Validation error format test', false, err.message);
  }

  // Test 3: CastError Mock Endpoint Verification (Or hitting a 404 bad path)
  try {
    const res = await fetch(`${BASE_URL}/nonexistent-path-abc`);
    const data = await res.json();
    assert(
      'Custom 404 error normalization',
      res.status === 404 && data.success === false && data.message.includes('Cannot find'),
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Custom 404 test', false, err.message);
  }

  // Test 4: Rate Limiter on Auth Endpoint (Stricter: 15 request max)
  try {
    console.log('Testing rate limit thresholds (Sending 18 rapid authentication requests)...');
    let hitRateLimit = false;
    let rateLimitMessage = '';
    
    // We send 18 requests to trigger the 15 limit
    for (let i = 0; i < 18; i++) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rate_test@threatscope.local', password: 'password123' })
      });
      
      if (res.status === 429) {
        hitRateLimit = true;
        const data = await res.json();
        rateLimitMessage = data.message;
        break;
      }
    }
    
    assert(
      'Authentication rate limiter triggers at threshold',
      hitRateLimit && rateLimitMessage.includes('Too many authentication attempts'),
      `Rate limit hit: ${hitRateLimit}, Message: ${rateLimitMessage}`
    );
  } catch (err) {
    assert('Rate limiter test', false, err.message);
  }

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
