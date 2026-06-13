const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testHealth() {
  console.log('Testing health endpoint...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testRegister() {
  console.log('\nTesting registration...');
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      display_name: 'Test User'
    });
    console.log('✅ Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('Starting simple backend tests...\n');

  const healthOk = await testHealth();
  if (healthOk) {
    await testRegister();
  }
}

runTests();