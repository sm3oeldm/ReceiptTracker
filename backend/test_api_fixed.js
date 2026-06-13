const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Use a fixed email to avoid rate limits
const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  display_name: 'Test User'
};

let authToken = null;

async function testAuth() {
  console.log('\n=== Testing Auth ===');

  try {
    // First try registration
    console.log('Registering user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✓ Registration successful:', registerResponse.data.message);

    // Then try login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    authToken = loginResponse.data.access_token;
    console.log('✓ Login successful, got token');

  } catch (error) {
    console.error('✗ Auth test failed:', error.response?.data || error.message);

    // If it's a rate limit error, suggest waiting
    if (error.response?.data?.error?.includes('rate limit')) {
      console.log('💡 Tip: Supabase has email rate limits. Try again in a few minutes or use a different email.');
    }
  }
}

async function testHealth() {
  console.log('\n=== Testing Health ===');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting Receipt Tracker API Tests...');

  const healthOk = await testHealth();
  if (healthOk) {
    await testAuth();
  }
}

runTests();