# Receipt Tracker

A family expense tracking app that uses AI to extract data from receipt photos.

## 📱 Overview

Receipt Tracker helps families track their spending by:
- Photographing receipts with a mobile app
- Using AI (Google Gemini) to extract merchant, total, date, and line items
- Allowing users to confirm and categorize expenses
- Generating monthly reports with category breakdowns
- Supporting family groups where all members can see shared expenses

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Expo (React Native) |
| **Backend** | Node.js + Express |
| **Database & Auth** | Supabase (PostgreSQL) |
| **AI / OCR** | Google Gemini API |
| **Export** | CSV generation |

## 📁 Project Structure

```
receipt-tracker/
├── backend/                  # Node.js + Express server
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Authentication middleware
│   │   └── index.js          # Express app entry point
│   ├── .env.example         # Environment variable template
│   ├── .env                 # Local environment (in .gitignore)
│   └── package.json
├── wordFiles/               # Documentation
│   ├── ReceiptTracker_MVP_Spec.md  # Full specification
│   └── supabase_setup.sql   # Database schema and seed data
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Supabase account (free tier)
- Google Gemini API key

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/receipt-tracker.git
   cd receipt-tracker
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   Edit `.env` with your actual credentials.

3. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL script from `wordFiles/supabase_setup.sql` to create tables
   - Copy your **Project URL** and **service_role key** to `.env`

4. **Start the backend:**
   ```bash
   npm run dev
   ```

## 🔧 Backend API

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and get JWT token

### Receipts

- `POST /api/receipts/parse` - Send receipt image for AI parsing
- `POST /api/receipts` - Save a receipt entry
- `GET /api/receipts` - List all receipts

### Groups

- `POST /api/groups/create` - Create a family group
- `POST /api/groups/join` - Join a group with invite code
- `GET /api/groups/me` - Get current group info

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create custom category

### Reports

- `GET /api/reports/:year/:month` - Get monthly report
- `GET /api/reports/:year/:month/export/csv` - Export as CSV

## 📱 Mobile App (Planned)

The mobile app will be built with Expo React Native and will include:

- Camera integration for receipt scanning
- Receipt confirmation and categorization
- Monthly spending reports with charts
- Family group management

## 🔒 Security

- All API keys are stored only on the backend
- Supabase service role key is never exposed to clients
- JWT tokens are used for authentication
- Row-level security is enabled on all database tables

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

For questions or issues, please contact the project maintainer.
