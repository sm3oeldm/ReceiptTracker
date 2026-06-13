# Receipt Tracker
## MVP Specification Document
**Full-Stack Family Expense Tracker — For AI Code Generation Agent**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema-supabase--postgresql)
4. [Backend API](#4-backend-api-nodejs--express)
5. [Mobile App](#5-mobile-app-expo--react-native)
6. [Deployment](#6-deployment)
7. [MVP Scope](#7-mvp-scope--what-to-build-first)
8. [Implementation Notes](#8-implementation-notes-for-ai-agent)
9. [Getting Started Checklist](#9-getting-started-checklist)

---

## 1. Project Overview

Receipt Tracker is a mobile-first family expense tracking app. Users photograph receipts, which are automatically parsed by AI to extract spending data. The app groups family members together, tracks spending by category, and generates monthly reports with charts and export options.

### 1.1 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Expo (React Native) — iOS via Expo Go, no App Store required |
| **Backend** | Node.js + Express — REST API server, hosted on Railway or Render (free tier) |
| **Database & Auth** | Supabase — PostgreSQL database + built-in authentication (free tier) |
| **AI / OCR** | Claude API (`claude-sonnet-4-20250514`) — receipt image parsing |
| **File Storage** | None — receipt photos are discarded after AI extraction |
| **Export** | PDF and CSV generation on the backend |

### 1.2 Core Principles

- Receipt photo → AI extraction → user confirms → saved. Photo is never stored.
- All API keys live on the Node.js backend only. Never exposed to the mobile app.
- Family members share a group. All members see each other's spending in reports.
- One group per user. Groups are created by an owner who shares an invite code.
- English only. No internationalisation needed.

---

## 2. Architecture

### 2.1 Request Flow

```
iPhone (Expo)  →  Node.js/Express (Railway)  →  Supabase (DB + Auth)
                                              →  Claude API (receipt parsing)
```

### 2.2 Repository Structure

```
receipt-tracker/
├── backend/                  Node.js + Express server
│   ├── src/
│   │   ├── routes/           auth.js, receipts.js, groups.js, reports.js
│   │   ├── middleware/        authMiddleware.js (Supabase JWT validation)
│   │   ├── services/          claudeService.js, supabaseService.js
│   │   └── index.js           Express app entry point
│   ├── .env                  SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
│   └── package.json
├── mobile/                   Expo React Native app
│   ├── src/
│   │   ├── screens/          LoginScreen, HomeScreen, ScanScreen,
│   │   │                     HistoryScreen, ReportScreen, GroupScreen
│   │   ├── components/       ReceiptCard, CategoryPicker, ChartView
│   │   ├── services/         api.js (all backend calls)
│   │   └── context/          AuthContext.js
│   ├── App.js
│   └── app.json
└── README.md
```

---

## 3. Database Schema (Supabase / PostgreSQL)

Create all tables in Supabase. Enable Row Level Security (RLS) on all tables. Use Supabase Auth for user management — the `auth.users` table is managed automatically.

### 3.1 Tables

#### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | FK → auth.users.id, Primary Key |
| `display_name` | text | User's display name |
| `group_id` | uuid | FK → groups.id, nullable |
| `created_at` | timestamptz | Default: now() |

#### `groups`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key, default gen_random_uuid() |
| `name` | text | Group display name |
| `invite_code` | text | Unique 6-character alphanumeric code |
| `owner_id` | uuid | FK → auth.users.id |
| `created_at` | timestamptz | Default: now() |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `user_id` | uuid | FK → auth.users.id, nullable (null = system default) |
| `name` | text | Category name e.g. `'Groceries'` |
| `icon` | text | Emoji icon e.g. `'🛒'` |
| `is_default` | boolean | True for system-provided categories |

#### `receipts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary Key |
| `user_id` | uuid | FK → auth.users.id |
| `group_id` | uuid | FK → groups.id, denormalized for fast queries |
| `category_id` | uuid | FK → categories.id |
| `merchant` | text | AI-extracted merchant name |
| `total` | numeric(10,2) | Total amount from receipt |
| `currency` | text | Default: `'AED'` |
| `receipt_date` | date | Date on the receipt (AI-extracted) |
| `items` | jsonb | Array of line items `[{name, price}]` |
| `notes` | text | Optional user note |
| `created_at` | timestamptz | Default: now() |

### 3.2 Default Categories (seed data)

Insert these on app initialisation as system categories (`user_id = null`, `is_default = true`):

| Name | Icon |
|---|---|
| Groceries | 🛒 |
| Fast Food | 🍔 |
| Restaurant | 🍽️ |
| Personal Health | 💊 |
| Transport | 🚗 |
| Gift | 🎁 |
| Entertainment | 🎬 |
| Clothing | 👕 |
| Electronics | 📱 |
| Other | 📦 |

### 3.3 Row Level Security (RLS) Policies

- **profiles** — users can only read/write their own row
- **receipts** — users can read receipts where `user_id = auth.uid()` OR `group_id` matches their group
- **categories** — users can read all default categories + their own custom ones
- **groups** — members can read their own group; owner can update/delete

---

## 4. Backend API (Node.js + Express)

### 4.1 Environment Variables (`.env`)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key   # never the anon key
ANTHROPIC_API_KEY=your-anthropic-key
PORT=3000
```

### 4.2 Authentication Middleware

Every protected route must validate the Supabase JWT sent in the `Authorization` header. Use the Supabase admin client to verify the token and attach the user to `req.user`.

```
Header: Authorization: Bearer <supabase_access_token>
```

### 4.3 API Endpoints

#### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account: `{ email, password, display_name }` |
| POST | `/login` | Login: `{ email, password }` → returns `access_token` |
| POST | `/logout` | Invalidate session |

#### Receipts — `/api/receipts`
| Method | Path | Description |
|---|---|---|
| POST | `/parse` | Send base64 image → Claude extracts data → returns JSON (not saved yet) |
| POST | `/` | Save a receipt entry (after user confirms extracted data) |
| GET | `/` | List all receipts for user (paginated, filterable by month/category) |
| GET | `/:id` | Get single receipt detail |
| PUT | `/:id` | Update receipt (category, notes, amounts) |
| DELETE | `/:id` | Delete receipt |

#### Groups — `/api/groups`
| Method | Path | Description |
|---|---|---|
| POST | `/create` | Create a new group: `{ name }` → returns `invite_code` |
| POST | `/join` | Join group with: `{ invite_code }` |
| GET | `/me` | Get current user's group info + member list |
| POST | `/leave` | Leave current group |

#### Categories — `/api/categories`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all categories (defaults + user's custom ones) |
| POST | `/` | Create custom category: `{ name, icon }` |
| DELETE | `/:id` | Delete a custom category (cannot delete defaults) |

#### Reports — `/api/reports`
| Method | Path | Description |
|---|---|---|
| GET | `/:year/:month` | Get full monthly report JSON for user's group |
| GET | `/:year/:month/export/pdf` | Download monthly report as PDF |
| GET | `/:year/:month/export/csv` | Download all receipts as CSV |

### 4.4 Receipt Parsing Service (Claude API)

`POST /api/receipts/parse` accepts a base64-encoded image. The Node.js backend sends it to Claude with the following system prompt:

> *You are a receipt parser. Extract the following from the receipt image and return ONLY valid JSON with no markdown, no explanation: `{ "merchant": string, "total": number, "currency": string, "date": "YYYY-MM-DD", "items": [{ "name": string, "price": number }] }`. If a field cannot be determined, use null. The currency should be the ISO 4217 code (e.g. AED, USD).*

The response JSON is returned to the mobile app for the user to confirm before saving. The image is never stored.

### 4.5 Monthly Report Data Structure

`GET /api/reports/:year/:month` returns the following JSON shape:

```json
{
  "year": 2025,
  "month": 6,
  "group": { "id": "...", "name": "..." },
  "summary": {
    "total_spent": 1240.50,
    "receipt_count": 34
  },
  "by_category": [
    { "category_name": "Groceries", "icon": "🛒", "total": 540.00, "count": 12, "percentage": 43.5 }
  ],
  "by_member": [
    {
      "display_name": "Sameer",
      "total": 800.00,
      "receipt_count": 20,
      "by_category": [{ "category_name": "Groceries", "total": 300.00 }]
    }
  ],
  "trend": [
    { "month": "2025-01", "total": 980.00 },
    { "month": "2025-02", "total": 1100.00 }
  ],
  "receipts": [
    { "id": "...", "merchant": "Carrefour", "total": 45.00, "date": "2025-06-01", "category": "Groceries", "member": "Sameer" }
  ]
}
```

---

## 5. Mobile App (Expo / React Native)

### 5.1 Setup

```bash
npx create-expo-app mobile --template blank
```

Install dependencies:
```bash
npx expo install expo-camera expo-image-picker expo-file-system expo-secure-store expo-sharing expo-print
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install axios react-native-chart-kit react-native-svg
```

Run the app:
```bash
npx expo start --tunnel
```
Scan the QR code with the iPhone camera — opens in Expo Go, no App Store needed.

### 5.2 Navigation Structure

```
App
├── Auth Stack (logged out)
│   ├── LoginScreen
│   └── RegisterScreen
└── App Stack (logged in) — Bottom Tab Navigator
    ├── HomeScreen        Recent receipts + quick scan button
    ├── ScanScreen        Camera/upload receipt flow
    ├── ReportScreen      Monthly report with charts
    └── GroupScreen       Group management + member list
```

### 5.3 Screens

#### LoginScreen / RegisterScreen
- Email + password fields
- Register also asks for `display_name`
- On success, store token in `SecureStore` and navigate to App Stack

#### HomeScreen
- Shows current month's total spend at the top
- List of recent receipts (last 10), each showing merchant, amount, category icon, date
- Floating Action Button (FAB) to navigate to ScanScreen

#### ScanScreen — 3-step flow
1. **Capture** — Open camera (`expo-camera`) or pick from library (`expo-image-picker`)
2. **Review** — Show AI-extracted data (merchant, total, date, items). User can edit any field. User picks a category.
3. **Confirm** — Save button POSTs to `/api/receipts`. Show success animation.

#### ReportScreen
- Month/year selector (defaults to current month)
- Summary card: total spent, receipt count
- Pie/donut chart: spending by category (`react-native-chart-kit`)
- Bar chart: spending trend over last 6 months
- Per-member breakdown (collapsible list)
- Export buttons: **Download PDF** / **Export CSV**

#### GroupScreen
- **No group:** show Create Group button + Join Group (enter invite code) button
- **In group:** show group name, invite code with copy button, list of members with their monthly totals
- Leave group option

### 5.4 API Service (`mobile/src/services/api.js`)

Centralise all HTTP calls in one file. On every request, read the stored token from `SecureStore` and attach it as `Authorization: Bearer <token>`. Handle 401 responses by clearing the token and redirecting to LoginScreen.

---

## 6. Deployment

### 6.1 Backend — Railway (Recommended)

1. Push `backend/` to a GitHub repository
2. Create a new project on [railway.app](https://railway.app), connect the GitHub repo
3. Add environment variables in the Railway dashboard
4. Railway auto-deploys on every git push — copy the public HTTPS URL

> Alternative: [Render.com](https://render.com) — same process, also free tier available.

### 6.2 Mobile — Expo Go (No App Store)

1. Set `EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app` in `mobile/.env`
2. Run `npx expo start --tunnel`
3. Install **Expo Go** from the App Store on iPhone
4. Scan the QR code with the iPhone camera — app opens instantly

> For a permanent setup (no laptop needed): run `npx expo publish`. This gives a permanent URL anyone can open in Expo Go from anywhere.

---

## 7. MVP Scope & What to Build First

### 7.1 Must Have (MVP)

- [ ] User registration and login
- [ ] Create group / join group via invite code
- [ ] Scan receipt → AI parse → confirm → save
- [ ] View receipt history with category filter
- [ ] Monthly report: totals by category + by member
- [ ] Bar chart: 6-month spending trend
- [ ] Export report as CSV

### 7.2 Nice to Have (Post-MVP)

- [ ] PDF export with formatted layout
- [ ] Push notifications for monthly summary
- [ ] Budget limits per category with alerts
- [ ] Pie/donut chart for category breakdown
- [ ] Edit/delete existing receipts
- [ ] Dark mode

### 7.3 Out of Scope

- Apple App Store distribution
- Multi-language / Arabic support
- Recurring expenses / subscriptions
- Bank/credit card integrations

---

## 8. Implementation Notes for AI Agent

### 8.1 Key Constraints

- **Never store the receipt image** on disk or in Supabase Storage. Process it in memory and discard immediately after Claude returns the result.
- **All API keys must be environment variables on the backend only.** The mobile app must never contain `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_KEY`.
- The mobile app only holds the **Supabase JWT** (access token) and the **backend API URL**.
- Use the **Supabase service role key** on the backend (bypasses RLS), but always validate the user's JWT in middleware to confirm their identity before any operation.

### 8.2 Claude API Receipt Parsing

- Use model: `claude-sonnet-4-20250514`
- Send image as base64 in the messages array with `type: "image"` and `media_type: "image/jpeg"` or `"image/png"`
- Parse the JSON response safely — if parsing fails, return a `422` error with a user-friendly message
- The `/parse` endpoint does **not** save to the database. It only returns extracted data for the user to review.

### 8.3 Invite Code Generation

- Generate a 6-character uppercase alphanumeric code: e.g. `XKRT92`
- Use `crypto.randomBytes` to ensure randomness
- Check for collisions in the `groups` table before saving

### 8.4 Report Queries

- All report queries must filter by `group_id` so all family members' receipts are included
- Use Supabase aggregate functions or raw SQL via `rpc()` for category totals
- Trend data: query last 6 months grouped by month using `date_trunc('month', receipt_date)`

### 8.5 Error Handling

Return a consistent error shape on all endpoints:

```json
{ "error": "Human-readable message", "code": "ERROR_CODE" }
```

| Status | Meaning |
|---|---|
| `401` | Token expired or invalid — mobile should redirect to login |
| `422` | Receipt parsing failed (blurry image, not a receipt, etc.) |
| `409` | Invite code not found, or user already in a group |

---

## 9. Getting Started Checklist

### 9.1 Supabase Setup
- [ ] Create project at [supabase.com](https://supabase.com) (free tier)
- [ ] Run the SQL setup script to create all tables
- [ ] Verify RLS policies are enabled on all tables
- [ ] Confirm default categories are seeded (10 rows in `categories` table)
- [ ] Copy **Project URL** and **service_role key** from Settings → API

### 9.2 Backend Setup
```bash
mkdir backend && cd backend && npm init -y
npm install express @supabase/supabase-js @anthropic-ai/sdk dotenv cors multer
```
- [ ] Create `.env` with all keys
- [ ] Implement routes in order: `auth` → `groups` → `categories` → `receipts` → `reports`
- [ ] Test all endpoints with Postman or curl before connecting the mobile app

### 9.3 Mobile Setup
```bash
npx create-expo-app mobile --template blank
```
- [ ] Install all dependencies from Section 5.1
- [ ] Create `.env` with `EXPO_PUBLIC_API_URL` pointing to your backend
- [ ] Build screens in order: Auth → Home → Scan → Group → Reports
- [ ] Run `npx expo start --tunnel` and scan QR with iPhone

---

*End of Specification*
