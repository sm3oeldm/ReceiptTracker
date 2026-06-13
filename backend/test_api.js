const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  display_name: 'Test User'
};

let authToken = null;
let testGroup = null;
let testCategory = null;
let testReceipt = null;

async function testAuth() {
  console.log('\n=== Testing Auth ===');

  try {
    // Register
    console.log('Registering user...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✓ Registration successful:', registerResponse.data.message);

    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.access_token;
    console.log('✓ Login successful, got token');

  } catch (error) {
    console.error('✗ Auth test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testGroups() {
  console.log('\n=== Testing Groups ===');

  try {
    // Create group
    console.log('Creating group...');
    const createResponse = await axios.post(`${API_URL}/groups/create`, {
      name: 'Test Family'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testGroup = createResponse.data.group;
    console.log('✓ Group created:', testGroup.name, 'Invite code:', createResponse.data.inviteCode);

    // Get group info
    console.log('Getting group info...');
    const groupResponse = await axios.get(`${API_URL}/groups/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Group info retrieved:', groupResponse.data.group.name);

  } catch (error) {
    console.error('✗ Groups test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testCategories() {
  console.log('\n=== Testing Categories ===');

  try {
    // Get all categories
    console.log('Getting all categories...');
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Got', categoriesResponse.data.length, 'categories');

    // Create custom category
    console.log('Creating custom category...');
    const createResponse = await axios.post(`${API_URL}/categories`, {
      name: 'Test Category',
      icon: '🧪'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testCategory = createResponse.data;
    console.log('✓ Custom category created:', testCategory.name);

  } catch (error) {
    console.error('✗ Categories test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testReceipts() {
  console.log('\n=== Testing Receipts ===');

  try {
    // Create a receipt
    console.log('Creating receipt...');
    const receiptData = {
      merchant: 'Test Store',
      total: 100.50,
      currency: 'AED',
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'Test Item 1', price: 50.00 },
        { name: 'Test Item 2', price: 50.50 }
      ],
      category_id: testCategory.id,
      notes: 'Test receipt'
    };

    const createResponse = await axios.post(`${API_URL}/receipts`, receiptData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testReceipt = createResponse.data;
    console.log('✓ Receipt created:', testReceipt.merchant, testReceipt.total);

    // Get all receipts
    console.log('Getting all receipts...');
    const receiptsResponse = await axios.get(`${API_URL}/receipts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Got', receiptsResponse.data.length, 'receipts');

    // Get single receipt
    console.log('Getting single receipt...');
    const singleResponse = await axios.get(`${API_URL}/receipts/${testReceipt.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Single receipt retrieved:', singleResponse.data.merchant);

  } catch (error) {
    console.error('✗ Receipts test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testReports() {
  console.log('\n=== Testing Reports ===');

  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Get monthly report
    console.log(`Getting report for ${year}-${month.toString().padStart(2, '0')}...`);
    const reportResponse = await axios.get(`${API_URL}/reports/${year}/${month}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const report = reportResponse.data;
    console.log('✓ Report generated:');
    console.log(`  - Total spent: ${report.summary.total_spent}`);
    console.log(`  - Receipt count: ${report.summary.receipt_count}`);
    console.log(`  - Categories: ${report.by_category.length}`);
    console.log(`  - Members: ${report.by_member.length}`);

  } catch (error) {
    console.error('✗ Reports test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function runTests() {
  console.log('Starting Receipt Tracker API Tests...');

  try {
    await testAuth();
    await testGroups();
    await testCategories();
    await testReceipts();
    await testReports();

    console.log('\n🎉 All tests passed!');
    console.log('\nTest data created:');
    console.log(`- User: ${testUser.email}`);
    console.log(`- Group: ${testGroup?.name || 'N/A'}`);
    console.log(`- Category: ${testCategory?.name || 'N/A'}`);
    console.log(`- Receipt: ${testReceipt?.merchant || 'N/A'} (${testReceipt?.total || 'N/A'})`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();