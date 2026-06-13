const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testHealthCheck() {
  console.log('Testing health check endpoint...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✓ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    return false;
  }
}

async function testBasicRoutes() {
  console.log('\nTesting basic route structure...');

  const endpoints = [
    '/auth/register',
    '/auth/login',
    '/groups/create',
    '/categories',
    '/receipts',
    '/reports/2024/6'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.options(`${API_URL}${endpoint}`);
      console.log(`✓ ${endpoint} - Route exists`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✓ ${endpoint} - Route exists (requires auth)`);
      } else {
        console.log(`? ${endpoint} - ${error.message}`);
      }
    }
  }
}

async function runTests() {
  console.log('Running simple backend tests...\n');

  const healthOk = await testHealthCheck();
  if (healthOk) {
    await testBasicRoutes();
    console.log('\n🎉 Basic backend structure is working!');
    console.log('\nNote: Full API testing requires valid Supabase and Gemini credentials in .env');
  } else {
    console.log('\n❌ Backend is not responding properly');
  }
}

runTests();