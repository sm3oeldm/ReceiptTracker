# 🚀 Backend Quick Start Guide

## Let's Get Your Backend Running in 5 Minutes!

### Step 1: Open the .env Template

I've created a template file at: `backend/.env.template`

```bash
# Open it in your favorite text editor
# For example:
notepad backend/.env.template
```

### Step 2: Get Your Supabase Credentials

**Follow these steps:**

1. **Open Supabase**: Go to [https://supabase.com](https://supabase.com) and login
2. **Open your project**: Click on your project name
3. **Go to API Settings**:
   - Click "Settings" (gear icon) in left sidebar
   - Click "API"
4. **Copy these values**:
   - **Project URL**: `https://your-project-name.supabase.co`
   - **service_role key**: Long key starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Get Your Gemini API Key

**Follow these steps:**

1. **Open Google AI Studio**: Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. **Sign in**: Use your Google account
3. **Get API Key**:
   - Click "Get API Key" or "Create API Key"
   - Copy the generated key (starts with `AIzaSy...`)

### Step 4: Fill in the Template

Replace the placeholder values in `.env.template`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-name.supabase.co      # ← PASTE YOUR PROJECT URL HERE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← PASTE YOUR SERVICE KEY HERE

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=AIzaSyYourGeminiAPIKeyHere              # ← PASTE YOUR GEMINI KEY HERE

# Server Configuration
PORT=3000
```

### Step 5: Save as .env

```bash
# Save the file as .env in the backend directory
# Make sure the filename is exactly: .env
```

### Step 6: Run the Database Setup SQL

**Important!** Run this SQL to create your database tables:

1. Open Supabase project
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Paste entire content of `wordFiles/supabase_setup.sql`
5. Click "Run"

### Step 7: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 3000
```

### Step 8: Test the API

```bash
node test_api.js
```

This will test all endpoints and create sample data.

## 🎯 You're Done!

Your backend is now running with real credentials. 🎉

## 📱 Connect Mobile App

Edit `backend/mobile/src/services/api.js`:

```javascript
// Change line 6 to:
const USE_MOCK_DATA = false;  // Use real API
```

Then start mobile app:
```bash
cd backend/mobile
npx expo start
```

## 🐛 Need Help?

Stuck on any step? Tell me which one and I'll help!

1. [ ] Getting Supabase credentials
2. [ ] Getting Gemini API key
3. [ ] Filling in .env template
4. [ ] Running SQL script
5. [ ] Starting backend server
6. [ ] Testing the API
7. [ ] Connecting mobile app

Just say "Help with step X" and I'll guide you through it! 😊