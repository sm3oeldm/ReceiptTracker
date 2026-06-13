# Receipt Tracker - Setup Guide

This guide will walk you through setting up the Receipt Tracker backend and database.

## 📋 Prerequisites

Before you begin, make sure you have:

- Node.js v18 or higher installed
- npm or yarn package manager
- A Supabase account (free tier is sufficient)
- A Google Gemini API key

## 🚀 Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project" and create a new project
3. Wait for the database to be provisioned (usually takes a minute)

### 1.2 Run the Database Setup Script

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" and paste the entire content of `wordFiles/supabase_setup.sql`
4. Click "Run" to execute the script

This will create all the necessary tables:
- `groups` - Family groups
- `profiles` - User profiles with group associations
- `categories` - Expense categories (with default categories seeded)
- `receipts` - Receipt data

### 1.3 Get Your Supabase Credentials

1. Go to "Project Settings" (gear icon in the left sidebar)
2. Click on "API"
3. Copy your:
   - **Project URL** (under "Config")
   - **service_role key** (under "Project API keys")

⚠️ **Important**: Use the `service_role` key, not the `anon` key. The service role key bypasses Row Level Security (RLS), which is necessary for the backend to perform all operations.

## 🛠 Step 2: Set Up the Backend

### 2.1 Install Dependencies

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file and add your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co  # Replace with your Project URL
SUPABASE_SERVICE_KEY=your-service-role-key    # Replace with your service_role key

# Google Gemini API (for receipt parsing)
GEMINI_API_KEY=your-gemini-api-key            # Replace with your Gemini API key

# Server Configuration
PORT=3000
```

### 2.3 Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key
5. Paste it into your `.env` file

## 🚀 Step 3: Start the Server

Start the development server:

```bash
npm run dev
```

The server should start and you'll see:
```
Server running on port 3000
```

## 🧪 Step 4: Test the API

You can test the API using the provided test script:

```bash
node test_api.js
```

This will:
1. Register a test user
2. Create a group
3. Create a category
4. Create a receipt
5. Generate a report

All tests should pass with ✓ marks.

## 📱 Step 5: Set Up the Mobile App (Coming Soon)

The mobile app will be built with Expo React Native. This setup guide will be updated when the mobile app is ready.

## 🔧 API Endpoints

Here's a quick reference of all available endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Groups
- `POST /api/groups/create` - Create a family group
- `POST /api/groups/join` - Join a group with invite code
- `GET /api/groups/me` - Get current group info
- `POST /api/groups/leave` - Leave current group

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create custom category
- `DELETE /api/categories/:id` - Delete custom category

### Receipts
- `POST /api/receipts/parse` - Parse receipt image (multipart form with 'image' field)
- `POST /api/receipts` - Save a receipt
- `GET /api/receipts` - List all receipts
- `GET /api/receipts/:id` - Get single receipt
- `PUT /api/receipts/:id` - Update receipt
- `DELETE /api/receipts/:id` - Delete receipt

### Reports
- `GET /api/reports/:year/:month` - Get monthly report
- `GET /api/reports/:year/:month/export/csv` - Export report as CSV

## 🔒 Security Notes

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Use HTTPS in production** - All API communication should be encrypted
3. **Keep your service_role key secret** - Anyone with this key has full access to your database
4. **Rotate compromised keys immediately** - If any key is exposed, generate a new one

## 🐛 Troubleshooting

### Common Issues

**Issue: Supabase connection failed**
- Check that your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Make sure your Supabase project is in the same region you're connecting from

**Issue: Gemini API errors**
- Verify your `GEMINI_API_KEY` is correct
- Check that you have enough quota
- Make sure you're using the correct model name

**Issue: CORS errors**
- The backend has CORS enabled for all origins in development
- In production, you should restrict this to your mobile app's domain

### Debugging

Enable debug logging by adding this to your `.env`:
```env
DEBUG=receipt-tracker:*
```

## 📚 Next Steps

1. **Set up the mobile app** - Follow the mobile setup guide (coming soon)
2. **Deploy the backend** - Consider using Railway or Render for hosting
3. **Invite family members** - Use the group invite code to add family members
4. **Start tracking expenses** - Begin scanning receipts and monitoring your spending

## 🎉 Congratulations!

You've successfully set up the Receipt Tracker backend. The API is now ready to power your family expense tracking app!