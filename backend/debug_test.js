const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function debugAuth() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    display_name: 'Test User'
  };

  console.log('Test user email:', testUser.email);

  try {
    console.log('Registering user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✓ Registration successful:', registerResponse.data);
  } catch (error) {
    console.error('✗ Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

debugAuth();
