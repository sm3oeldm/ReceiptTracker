# 📝 How to Fill in Your .env File

## Step-by-Step Guide

### Step 1: Open the .env File

The file is located at: `backend/.env`

```bash
# Open it in Notepad or your favorite editor
notepad backend/.env
```

### Step 2: Replace the Placeholder Values

Current file looks like this:

```env
# Receipt Tracker Backend - Environment Variables
# This file should NOT be committed to version control

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
PORT=3000
```

### Step 3: Get Your Real Credentials

#### For SUPABASE_URL:
1. Go to [supabase.com](https://supabase.com) and login
2. Open your project
3. Click "Settings" (gear icon) → "API"
4. **Copy the "Project URL"**
5. Replace `https://your-project.supabase.co` with your actual URL

Example:
```
SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
```

#### For SUPABASE_SERVICE_KEY:
1. Still in Supabase API settings
2. Look for "Project API keys" section
3. Find the "service_role" key
4. **Copy the entire key** (it's long!)
5. Replace `your-service-role-key` with your actual key

Example:
```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDA2NzQ0MCwiZXhwIjoxOTM1NjQzNDQwfQ.your-actual-key-here
```

#### For GEMINI_API_KEY:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google
3. Click "Get API Key" or "Create API Key"
4. **Copy the generated key**
5. Replace `your-gemini-api-key` with your actual key

Example:
```
GEMINI_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

### Step 4: Final .env File Example

Your completed file should look like:

```env
# Receipt Tracker Backend - Environment Variables
# This file should NOT be committed to version control

# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3BxcnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDA2NzQ0MCwiZXhwIjoxOTM1NjQzNDQwfQ.your-actual-key-here

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890

# Server Configuration
PORT=3000
```

### Step 5: Save the File

Make sure to save the changes!

### Step 6: Test the Backend

```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 3000
```

### Step 7: Run the API Test

```bash
node test_api.js
```

## 🎯 Visual Guide

```
Before (with placeholders):
┌─────────────────────────────────┐
│ SUPABASE_URL=your-project-url  │  ❌ Placeholder
│ SUPABASE_SERVICE_KEY=your-key   │  ❌ Placeholder  
│ GEMINI_API_KEY=your-key         │  ❌ Placeholder
└─────────────────────────────────┘

After (with real credentials):
┌─────────────────────────────────┐
│ SUPABASE_URL=https://abc123...  │  ✅ Real URL
│ SUPABASE_SERVICE_KEY=eyJhbG... │  ✅ Real key
│ GEMINI_API_KEY=AIzaSy...        │  ✅ Real key
└─────────────────────────────────┘
```

## 🚨 Important Security Reminders

1. **Never share this file** - It contains secret keys
2. **Don't commit to Git** - It's already in .gitignore
3. **Keep it safe** - Anyone with these keys has full access
4. **Rotate if exposed** - Generate new keys if compromised

## 🎉 You're Ready!

Once you fill in the real credentials, your backend will be fully functional!

**Need help finding any of these values?** Just ask! I can guide you step-by-step through getting each credential. 😊