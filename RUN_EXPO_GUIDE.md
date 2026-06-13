# Running the Expo Mobile App - Step by Step Guide

## Prerequisites

Before running the app, make sure you have:
1. **Node.js** (v18 or later) - [Download Node.js](https://nodejs.org/)
2. **Expo CLI** - Install globally with:
   ```bash
   npm install -g expo-cli
   ```
3. **Expo Go app** on your phone (iOS/Android) - [Download Expo Go](https://expo.dev/client)
4. **OR** an Android/iOS emulator set up

## Step 1: Navigate to Mobile Project

Open your terminal and navigate to the mobile project:

```bash
cd C:\Users\sm3oe\OneDrive\Desktop\VS-Projects\ReceiptTracker\backend\mobile
```

Or on macOS/Linux:
```bash
cd ~/OneDrive/Desktop/VS-Projects/ReceiptTracker/backend/mobile
```

## Step 2: Install Dependencies

Install the required npm packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- Expo SDK
- React Navigation
- Axios (for API calls)
- Various Expo modules (camera, file system, etc.)

**Note**: This may take a few minutes the first time.

## Step 3: Start the Expo Development Server

Run the Expo development server:

```bash
npx expo start
```

This will:
1. Start the Metro bundler
2. Launch the Expo Dev Tools in your browser
3. Generate a QR code

## Step 4: Run on Device or Emulator

### Option A: Run on Physical Device (Recommended)

1. Open the **Expo Go** app on your phone
2. Scan the QR code displayed in your terminal or browser
3. The app will load and run on your device

### Option B: Run on Android Emulator

1. Make sure you have Android Studio installed with an emulator set up
2. Press `a` in the terminal where Expo is running
3. Select your emulator when prompted

### Option C: Run on iOS Simulator (Mac only)

1. Press `i` in the terminal where Expo is running
2. Make sure Xcode is installed

## Step 5: Test the App

Once the app loads, you should see:

### If Not Logged In:
- **Login Screen** - Enter email/password
- **Register Screen** - Create new account
- Navigation between login/register

### If Logged In:
- **Bottom Tab Navigation** with 4 tabs:
  1. **Home** - Main dashboard
  2. **Scan** - Receipt scanning
  3. **Report** - Expense reports
  4. **Group** - Shared groups

## Step 6: Development Workflow

### Making Changes
1. Edit files in `src/` directory
2. Save changes - Expo will hot-reload automatically
3. See changes reflected on your device/emulator

### Common Commands

```bash
# Start with Android emulator
npx expo start --android

# Start with iOS simulator (Mac only)
npx expo start --ios

# Start with web
npx expo start --web

# Clear cache (if needed)
npx expo start -c
```

## Step 7: Connect to Backend

The mobile app is configured to connect to your local backend at `http://localhost:3000/api`

### Important:
1. Make sure your backend server is running:
   ```bash
   # In another terminal
   cd ../..
   node backend/src/index.js
   ```

2. For physical devices, you may need to:
   - Use your computer's local IP instead of `localhost`
   - Make sure your computer and phone are on the same network
   - Update the API base URL in the mobile app's API service file

## Troubleshooting

### Issue: QR Code Not Scanning
- Make sure your phone camera has permission to access Expo Go
- Try restarting Expo Go app
- Check your internet connection

### Issue: App Not Loading
```bash
# Clear Expo cache
npx expo start -c

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Issue: Metro Bundler Errors
- Make sure all dependencies are installed (`npm install`)
- Check for syntax errors in your code
- Restart the bundler

### Issue: Backend Connection Failed
- Make sure backend server is running
- Check your network connection
- For physical devices, use your computer's IP address

## Project Structure

```
backend/mobile/
├── App.js                # Main app entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
├── src/
│   ├── context/         # React context (Auth)
│   ├── screens/         # All app screens
│   ├── services/        # API services
│   └── components/      # Reusable components
├── assets/              # Images, fonts, etc.
└── node_modules/        # Installed dependencies
```

## Important Files

### App.js
The main entry point with:
- Authentication flow (AuthStack vs AppTabs)
- Navigation setup
- Auth context provider

### src/screens/
- `LoginScreen.js` - User login
- `RegisterScreen.js` - User registration
- `HomeScreen.js` - Main dashboard
- `ScanScreen.js` - Receipt scanning
- `ReportScreen.js` - Expense reports
- `GroupScreen.js` - Group management

### src/services/api.js
Contains API calls to your backend:
- Authentication endpoints
- Receipt management
- Group operations
- Report generation

## Next Steps

### 1. Test All Screens
- Login/Registration flow
- Navigation between tabs
- API connectivity

### 2. Configure API Base URL
If testing on physical device, update the API base URL in `src/services/api.js`:

```javascript
// Change from:
const API_URL = 'http://localhost:3000/api'

// To (use your computer's local IP):
const API_URL = 'http://192.168.x.x:3000/api'
```

### 3. Start Developing Features
- Implement receipt scanning
- Build expense tracking
- Create reports
- Add group sharing

## Useful Expo Commands

```bash
# Install Expo CLI globally (if not installed)
npm install -g expo-cli

# Login to Expo (for publishing)
npx expo login

# Build for production
npx expo build:android
npx expo build:ios

# Publish updates
expo publish

# Install specific Expo CLI version
npm install -g expo-cli@version
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Icons](https://icons.expo.fyi/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)

## Summary

1. Navigate to `backend/mobile`
2. Run `npm install`
3. Run `npx expo start`
4. Scan QR code with Expo Go app
5. Test the app!

The app should load and you can start testing the authentication flow and navigation. 🎉