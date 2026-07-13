import dotenv from 'dotenv';

// Load variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting Dashboard API Verification Tests...\n');
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
  const email = `analyst_${uniqueId}@dashboard-test.local`;
  const password = 'password123';
  let token = '';

  // Step 1: Register User to acquire session
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dash Analyst', email, password, role: 'analyst' })
    });
    const data = await res.json();
    token = data.data?.token;
  } catch (err) {
    console.error('Failed user registration setup:', err.message);
  }

  // Test 1: Access dashboard without Token (Should fail)
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { method: 'GET' });
    const data = await res.json();
    assert(
      'Dashboard endpoint blocks unauthenticated users',
      res.status === 401 && data.success === false,
      `Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assert('Dashboard unauthenticated block test', false, err.message);
  }

  // Test 2: Access dashboard with Valid Token
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    const stats = data.data?.stats;
    const charts = data.data?.charts;
    const activeAlerts = data.data?.activeAlerts;
    const recentReports = data.data?.recentReports;

    const hasCorrectStats = stats && 
      typeof stats.totalInvestigations === 'number' && 
      typeof stats.highSeverityAlerts === 'number' && 
      typeof stats.criticalCVEs === 'number' && 
      typeof stats.savedIOCsCount === 'number';

    const hasCharts = charts &&
      Array.isArray(charts.severityDistribution) &&
      Array.isArray(charts.categoryDistribution) &&
      Array.isArray(charts.iocDistribution) &&
      Array.isArray(charts.topSources) &&
      Array.isArray(charts.monthlyTrend);

    const hasFeeds = Array.isArray(activeAlerts) && Array.isArray(recentReports);

    assert(
      'Dashboard statistics and aggregations parsing',
      res.status === 200 && data.success === true && hasCorrectStats && hasCharts && hasFeeds,
      `Status: ${res.status}, Stats: ${JSON.stringify(stats)}, Charts OK: ${!!hasCharts}`
    );

    // Let's assert values were seeded (since database had 0 elements before this run or already seeded)
    assert(
      'Database self-seeding on empty reads',
      stats && stats.totalInvestigations > 0 && stats.highSeverityAlerts > 0,
      `Total Investigations: ${stats?.totalInvestigations}, High Severity Alerts: ${stats?.highSeverityAlerts}`
    );
    
  } catch (err) {
    assert('Dashboard authenticated fetch test', false, err.message);
  }

  console.log(`\nTests Completed: ${passCount}/${testCount} passed.`);
}

runTests();
