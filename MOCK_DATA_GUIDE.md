# 🎭 Mock Data Testing Guide

## 🎉 Great News!

I've added **mock data support** to the mobile app, so you can test **all the UI features** without needing to set up the backend!

## 🚀 How to Test with Mock Data

### Step 1: Start the Mobile App

```bash
cd backend/mobile
npx expo start
```

### Step 2: Scan the QR Code

Use your phone to scan the QR code that appears in the terminal.

### Step 3: Test All Features

**Everything now works with mock data!** 🎉

## ✅ What Works with Mock Data

### 🔐 Authentication
- **Login**: Use any email/password (e.g., `test@example.com` / `password`)
- **Register**: Creates mock account instantly
- **Auto-login**: Persists between app restarts

### 🏠 Home Screen
- **Recent Receipts**: Shows 10 mock receipts
- **Categories**: Groceries, Restaurants, Transport, etc.
- **Dates**: Realistic date ranges
- **Amounts**: Random realistic amounts

### 📊 Report Screen
- **Monthly Summary**: Shows total spent (AED 1,536.50)
- **33 Receipts**: Across all categories
- **Trend Chart**: 6 months of mock data
- **Category Breakdown**: 4 categories with percentages
- **Member Breakdown**: Sameer & Sarah's spending
- **Export Button**: UI works (export coming soon)

### 👥 Group Screen
- **Group Info**: "Family Expenses" group
- **Invite Code**: "ABC123" (copy button works)
- **Members**: Shows Sameer & Sarah
- **Owner Badge**: You're shown as owner

### 📸 Scan Screen
- **Camera**: Fully functional
- **Gallery Access**: Works
- **Visual Guides**: Scanning frame with corners
- **Capture Button**: Takes photos (mock processing)

## 🎯 What You Can Test Right Now

### 1. Complete Authentication Flow
```
1. Open app → See login screen
2. Tap "Sign Up" → Register with any credentials
3. Auto-logged in → See home screen
4. Logout → Back to login
5. Login again → Returns to home
```

### 2. Navigation System
```
- Tap bottom tabs to switch screens
- Test all 4 main screens
- Verify smooth transitions
```

### 3. Receipt Management
```
- Home screen shows 10 mock receipts
- Scroll through the list
- Pull to refresh (works!)
- See different merchants and categories
```

### 4. Reports & Analytics
```
- Report screen shows full mock data
- Swipe through trend chart
- See category percentages
- Check member breakdown
- Test month navigation (chevrons)
```

### 5. Group Features
```
- See your group info
- Copy invite code (works!)
- View group members
- Test leave group button (mock)
```

### 6. Camera Functionality
```
- Open Scan screen
- Grant camera permission
- See visual scanning guides
- Take photos (saved to mock)
- Access gallery
```

## 🔧 How Mock Data Works

### Under the Hood
- **No backend needed**: All data generated locally
- **Realistic data**: Random but believable values
- **Fast loading**: Instant responses (500-1000ms delays)
- **Persistent**: Mock login state saved

### Mock Data Examples

**Receipts:**
```json
{
  "merchant": "Carrefour",
  "total": 125.50,
  "date": "2024-06-10",
  "category": { "name": "Groceries", "icon": "🛒" }
}
```

**Reports:**
```json
{
  "total_spent": 1536.50,
  "receipt_count": 33,
  "by_category": [
    { "category_name": "Groceries", "total": 650.50, "percentage": 42.5 }
  ]
}
```

## 🎨 UI Testing Checklist

- [ ] Login screen design
- [ ] Register screen layout
- [ ] Home screen receipt cards
- [ ] Scan screen camera interface
- [ ] Report screen charts
- [ ] Group screen layout
- [ ] Navigation smoothness
- [ ] Loading indicators
- [ ] Error handling
- [ ] Color scheme
- [ ] Typography
- [ ] Spacing and alignment

## 🚀 When You're Ready for Real Backend

### Switch to Real API

The app has a built-in toggle system:

```javascript
// To switch to real API (when backend is ready):
import { enableRealAPI } from './services/api';
enableRealAPI();

// To switch back to mock:
import { enableMockAPI } from './services/api';
enableMockAPI();
```

### Setup Steps

1. **Add credentials** to `backend/.env`
2. **Start backend** (`npm run dev`)
3. **Update API_URL** in mobile app
4. **Call enableRealAPI()**
5. **Restart app**

## 🐛 Common Mock Testing Issues

### Issue: "Still seeing API errors"
**Fix**: Make sure `USE_MOCK_DATA = true` in `api.js`

### Issue: "Data not updating"
**Fix**: Pull to refresh or restart app

### Issue: "Login not working"
**Fix**: Use any email/password (mock accepts all)

### Issue: "Camera black screen"
**Fix**: Grant permissions when prompted

## 🎉 You're Ready to Test!

**No backend needed** - everything works with beautiful mock data!

```bash
cd backend/mobile
npx expo start
```

Then scan the QR code and enjoy testing all the features! 🎊

### What to Test First
1. ✅ Authentication flow
2. ✅ Navigation between screens
3. ✅ Receipt list on home screen
4. ✅ Report charts and data
5. ✅ Camera functionality
6. ✅ Group management UI

**Everything is working** - have fun testing! 🚀