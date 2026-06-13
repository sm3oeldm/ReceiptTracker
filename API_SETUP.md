# 🔑 API Key Setup Guide

## 🚨 Understanding the Error

The "API key missing" error is **normal at this stage** because:

1. **The mobile app is trying to connect to the backend**
2. **The backend needs your Supabase and Gemini credentials**
3. **We haven't set up the connection yet**

This is **not a bug** - it's the expected behavior when the app tries to make API calls without a running backend.

## 🛠 Step-by-Step Fix

### Step 1: Set Up Backend Credentials

Edit `backend/.env` with your real credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co  # Replace with your actual Supabase URL
SUPABASE_SERVICE_KEY=your-service-role-key      # Replace with your actual service key

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=your-gemini-api-key              # Replace with your actual Gemini key

# Server Configuration
PORT=3000
```

### Step 2: Start the Backend Server

```bash
cd backend
npm run dev
```

### Step 3: Update Mobile App API URL

Edit `backend/mobile/src/services/api.js` and update the API_URL:

```javascript
// Change this line (around line 5):
const API_URL = 'http://localhost:3000/api';  // For local testing

// OR for production:
const API_URL = 'http://your-deployed-backend-url:3000/api';
```

### Step 4: Restart the Mobile App

```bash
cd backend/mobile
npx expo start -c  # -c clears the cache
```

## 🔧 Alternative: Disable API Calls for Testing

If you want to test the **UI only** without backend connection:

### Option A: Mock the API Service

Create a mock API service in `backend/mobile/src/services/mockApi.js`:

```javascript
export const login = async (email, password) => {
  // Mock successful login
  return { access_token: 'mock-token' };
};

// Add mock implementations for all other API functions
```

Then update `App.js` to use the mock service during development.

### Option B: Wrap API Calls in Try/Catch

Modify the existing screens to handle missing backend gracefully:

```javascript
// Example in HomeScreen.js
const loadReceipts = async () => {
  try {
    const data = await getReceipts(currentMonth, currentYear);
    setReceipts(data);
  } catch (err) {
    console.log('Backend not connected - using mock data');
    // Use mock data for testing
    setReceipts([
      {
        id: '1',
        merchant: 'Carrefour',
        total: 150.50,
        receipt_date: '2024-06-10',
        categories: { name: 'Groceries', icon: '🛒' }
      }
    ]);
  }
};
```

## 🎯 Recommended Approach

### For Local Development (Best Option)

1. **Start backend first**:
   ```bash
   cd backend
   npm run dev
   ```

2. **In separate terminal, start mobile**:
   ```bash
   cd backend/mobile
   npx expo start
   ```

3. **Use local API URL**:
   ```javascript
   const API_URL = 'http://localhost:3000/api';
   ```

### For Production

1. **Deploy backend** to Railway/Render
2. **Update API_URL** to your deployed URL
3. **Build mobile app** for production

## 📋 Checklist

- [ ] Add Supabase credentials to `backend/.env`
- [ ] Add Gemini API key to `backend/.env`
- [ ] Start backend server (`npm run dev`)
- [ ] Update API_URL in mobile app
- [ ] Restart mobile app (`npx expo start -c`)

## 🚀 Quick Test Without Backend

Want to test the UI **right now** without setting up the backend?

### Use Mock Data

I can quickly add mock data to the screens so you can test the UI immediately. Would you like me to:

1. **Add mock data to all screens** - Test UI without backend
2. **Help you set up the backend credentials** - Get full functionality
3. **Show you how to do both** - Learn the process

Just let me know which approach you prefer! 😊