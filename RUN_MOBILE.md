# 🚀 How to Run the Mobile App

## 📱 Starting the Mobile App

### Correct Directory
The mobile app is located in: `backend/mobile/`

### Step 1: Navigate to the Mobile Directory
```bash
cd backend/mobile
```

### Step 2: Start Expo
```bash
npx expo start
```

### Step 3: Choose How to Run

#### Option A: On Your Physical Device (Recommended)
1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in the terminal with your phone's camera
3. The app will open automatically in Expo Go

#### Option B: iOS Simulator (Mac only)
```bash
# Press 'i' in the terminal
```

#### Option C: Android Emulator
```bash
# Press 'a' in the terminal
```

#### Option D: Web Browser
```bash
# Press 'w' in the terminal
```

## 🐛 Common Issues & Fixes

### Issue: "package.json does not exist"
**Cause**: Running `npx expo start` from the wrong directory
**Fix**: Make sure you're in `backend/mobile/` directory

### Issue: Metro Bundler Stuck
**Fix**:
```bash
# Stop the process (Ctrl+C)
# Clear cache
npx expo start -c
```

### Issue: Camera Not Working
**Fix**:
1. Make sure you're testing on a physical device or emulator
2. Grant camera permissions when prompted
3. Check `app.json` for proper permissions

### Issue: API Connection Failed
**Fix**:
1. Make sure backend server is running
2. Update API_URL in `src/services/api.js`
3. Check your network connection

## 📱 Testing the App

### What You Can Test Now
1. **Authentication Flow**
   - Register new users
   - Login with existing users
   - Auto-login on app restart

2. **Navigation**
   - Switch between all 4 tabs
   - Test auth stack navigation

3. **Camera**
   - Take photos
   - Access gallery
   - Test permissions

4. **UI Components**
   - All screens render properly
   - Loading states work
   - Error handling displays correctly

### What Needs Backend Connection
- Receipt scanning
- User registration/login
- Group management
- Report generation

## 🔧 Development Tips

### Hot Reloading
- Save files to see changes instantly
- Press `r` to reload manually
- Press `d` for developer menu

### Debugging
```bash
# Start with debugging enabled
npx expo start --clear
```

### Clean Cache
```bash
# Clear Metro cache
npx expo start -c
```

## 📱 Device Testing

### iOS
- Use iPhone simulator on Mac
- Or use Expo Go on physical iPhone

### Android
- Use Android Studio emulator
- Or use Expo Go on physical Android device

### Web
- Limited functionality
- Good for UI testing
- Press `w` to launch in browser

## 🎯 Next Steps After Testing

1. **Connect to Backend**
   - Update API_URL in `src/services/api.js`
   - Test authentication

2. **Implement Receipt Flow**
   - Connect camera to parsing API
   - Add confirmation screen
   - Save receipts to database

3. **Test Group Features**
   - Create/join groups
   - Test shared receipts
   - Verify reports work

## 🚀 You're Ready!

The mobile app is set up and ready to test. Navigate to the correct directory and run:

```bash
cd backend/mobile
npx expo start
```

Then scan the QR code with your phone to see the app in action! 🎉