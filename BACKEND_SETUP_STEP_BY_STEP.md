# 🚀 Backend Setup - Step by Step Guide

## 🎯 Let's Set Up the Real Backend!

I'll guide you through setting up the backend with your real credentials. Here's what we'll do:

### Step 1: Get Your Supabase Credentials

#### If you already have Supabase:
1. Go to [supabase.com](https://supabase.com) and login
2. Open your project dashboard
3. Copy your **Project URL** and **service_role key**

#### If you don't have Supabase yet:
1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Click "New Project" and create one
4. Wait for database to be ready (~1 minute)

### Step 2: Set Up Supabase Database

#### Run the SQL Setup Script:
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the entire content of `wordFiles/supabase_setup.sql`
5. Click "Run"

This creates all tables and seeds default categories.

### Step 3: Get Your Google Gemini API Key

#### If you have a Gemini API key:
1. Copy your existing key

#### If you need a new key:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google
3. Click "Get API Key" or "Create API Key"
4. Copy the generated key

### Step 4: Configure Backend Environment

Edit `backend/.env` file:

```bash
cd backend
# Edit .env file
```

Replace the placeholder values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co  # Replace with your actual Supabase URL
SUPABASE_SERVICE_KEY=your-service-role-key      # Replace with your actual service key

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=your-gemini-api-key              # Replace with your actual Gemini key

# Server Configuration
PORT=3000
```

### Step 5: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 6: Start the Backend Server

```bash
npm run dev
```

You should see:
```
Server running on port 3000
```

### Step 7: Test the Backend API

Run the test script:

```bash
node test_api.js
```

This will:
- Register a test user
- Create a test group
- Add test categories
- Save test receipts
- Generate test reports

### Step 8: Connect Mobile App to Backend

Edit `backend/mobile/src/services/api.js`:

```javascript
// Change this line (around line 6):
const USE_MOCK_DATA = false;  // Set to false to use real API

// Make sure API_URL points to your backend:
const API_URL = 'http://localhost:3000/api';  // For local testing
```

### Step 9: Start Mobile App with Real Backend

```bash
cd backend/mobile
npx expo start -c
```

## 📋 Detailed Step-by-Step

### Let's Do This Together!

I'll guide you through each step. Ready to begin?

#### Step 1: Supabase Setup

**Do you have:**
- [ ] Supabase account
- [ ] Supabase project created
- [ ] Project URL and service key

**Need help with any of these?**

#### Step 2: Database Setup

**Have you run the SQL script?**
- [ ] Opened SQL Editor in Supabase
- [ ] Pasted supabase_setup.sql
- [ ] Clicked Run

**Want me to verify the tables were created?**

#### Step 3: Gemini API Key

**Do you have:**
- [ ] Google account
- [ ] Gemini API key
- [ ] Key copied and ready

**Need help getting a Gemini key?**

#### Step 4: Backend Configuration

Let's edit the `.env` file together. I'll show you exactly what to put.

#### Step 5: Start the Server

I'll help you start the backend and verify it's working.

#### Step 6: Test the API

We'll run the test script and make sure all endpoints work.

#### Step 7: Connect Mobile App

I'll show you how to switch from mock data to real API.

#### Step 8: Test the Full System

We'll test the complete flow from mobile to backend.

## 🎯 What We'll Accomplish

By the end of this setup, you'll have:

✅ **Real backend** with your credentials
✅ **Working API** with all endpoints
✅ **Mobile app** connected to backend
✅ **Full system** ready for testing
✅ **Receipt scanning** with real AI
✅ **User accounts** with real authentication
✅ **Group management** working
✅ **Reports** with real data

## 🚀 Let's Begin!

**Which step would you like to start with?**

1. **Supabase Setup** - Create account and project
2. **Database Setup** - Run SQL script
3. **Gemini API Key** - Get your API key
4. **Backend Configuration** - Edit .env file
5. **Start Server** - Launch backend
6. **Test API** - Run test script
7. **Connect Mobile** - Update mobile app
8. **Full Test** - Test complete system

**Just tell me which step you want to do first, and I'll guide you through it!** 😊