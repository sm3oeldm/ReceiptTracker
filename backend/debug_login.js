const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugLogin() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Test User'
  };

  console.log('=== Debugging Login ===');

  try {
    // Register
    console.log('\n1. Registering user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✓ Registration successful');

    // Login
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('✓ Login response received');
    console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));

  } catch (error) {
    console.error('✗ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

debugLogin();
