const axios = require('axios');

async function testDirectRegister() {
  try {
    console.log('Testing direct registration...');

    const response = await axios.post('http://localhost:3000/api/auth/register', {
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      password: 'password123',
      display_name: 'Test User'
    });

    console.log('✅ Registration successful!');
    console.log('Response:', response.data);

    // Try login
    console.log('\nTesting login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: response.data.email || `user${Math.floor(Math.random() * 1000)}@example.com`,
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('Token:', loginResponse.data.access_token ? 'PRESENT' : 'MISSING');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDirectRegister();