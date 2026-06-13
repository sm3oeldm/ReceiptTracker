const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugProtected() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Test User'
  };

  console.log('=== Debugging Protected Route ===');

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

    const authToken = loginResponse.data.accessToken;
    console.log('✓ Login successful, token:', authToken.substring(0, 30) + '...');

    // Test token on /groups/me
    console.log('\n3. Testing token on /groups/me...');
    try {
      const groupsResponse = await axios.get(`${API_URL}/groups/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✓ Token works!');
      console.log('Response:', JSON.stringify(groupsResponse.data, null, 2));
    } catch (error) {
      console.error('✗ Token test failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);

      // Let's check the auth middleware logs
      console.log('\n4. Checking server logs...');
    }

  } catch (error) {
    console.error('✗ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

debugProtected();
