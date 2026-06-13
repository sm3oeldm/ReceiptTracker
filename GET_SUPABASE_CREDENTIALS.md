# 🔑 How to Get Your Supabase Credentials

## Step-by-Step Guide to Find Your Supabase URL and Service Key

### Step 1: Log in to Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Sign In" in the top right
3. Enter your email and password

### Step 2: Open Your Project
1. After logging in, you'll see your dashboard
2. Click on your project (if you have multiple)
3. You should see your project dashboard

### Step 3: Find Your Project URL
1. Look in the left sidebar
2. Click on "Settings" (gear icon at the bottom)
3. Click on "API" in the settings menu
4. **Copy the "Project URL"** - it looks like:
   ```
   https://your-project-name.supabase.co
   ```

### Step 4: Find Your Service Role Key
1. Still in the API settings page
2. Look for "Project API keys" section
3. Find the "service_role" key (this is important!)
4. **Copy the service_role key** - it's a long string like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1uYW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYyMDA2NzQ0MCwiZXhwIjoxOTM1NjQzNDQwfQ.YourLongKeyHere
   ```

### Step 5: Run the Database Setup SQL
1. Go back to your project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the entire content of `wordFiles/supabase_setup.sql`
5. Click "Run"
6. Verify it says "Success. No rows returned" (this is normal)

### Step 6: Verify Tables Were Created
1. Click "Table Editor" in the left sidebar
2. You should see these tables:
   - `groups`
   - `profiles`
   - `categories` (with 10 default categories)
   - `receipts`

## 📋 What You Should Have Now

```
SUPABASE_URL = "https://your-project-name.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🚨 Important Security Notes

1. **Use the service_role key** - NOT the anon key
2. **Never commit this to version control** - It's already in .gitignore
3. **Keep it secret** - Anyone with this key has full database access
4. **Rotate if compromised** - You can generate a new one in settings

## 🎯 Next Step

Once you have these two values, we'll:
1. Add them to `backend/.env`
2. Start the backend server
3. Test the API

## 🐛 Troubleshooting

### "I don't see my project"
- Make sure you're logged in to the correct account
- Check if you have multiple organizations

### "SQL script failed"
- Make sure you pasted the entire file
- Check for syntax errors
- Try running smaller sections at a time

### "Can't find service_role key"
- It's under "Project API keys" in API settings
- Make sure you're not looking at the anon key
- The service_role key is longer

## 📚 Visual Guide

```
Supabase Dashboard
├── Project Selection
│   └── Click your project
│
├── Left Sidebar
│   ├── Settings (gear icon)
│   │   └── API
│   │       ├── Project URL      ← COPY THIS
│   │       └── Project API keys
│   │           └── service_role ← COPY THIS KEY
│   │
│   ├── SQL Editor
│   │   └── Run supabase_setup.sql
│   │
│   └── Table Editor
│       └── Verify tables exist
│
└── Project Dashboard
    └── Overview of your project
```

## ✅ You're Ready!

Once you have your **Project URL** and **service_role key**, we can move to the next step of setting up the backend!