# Receipt Tracker Mobile App

Expo React Native mobile application for the Receipt Tracker family expense tracking system.

## 📱 Features

### Implemented
- ✅ User authentication (login/registration)
- ✅ Bottom tab navigation
- ✅ Authentication context
- ✅ API service layer
- ✅ Basic UI components
- ✅ Camera integration for receipt scanning
- ✅ Group management interface
- ✅ Report screens with charts

### Coming Soon
- ⏳ Receipt scanning flow
- ⏳ Receipt confirmation screen
- ⏳ Category selection
- ⏳ Receipt editing
- ⏳ CSV export functionality
- ⏳ Push notifications

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Expo CLI
- iOS/Android device or emulator
- Backend server running (see main README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Update API URL in `src/services/api.js`:
```javascript
const API_URL = 'http://your-backend-url:3000/api';
```

### Running the App

Start the development server:
```bash
npx expo start
```

- **iOS**: Press `i` to launch iOS simulator
- **Android**: Press `a` to launch Android emulator
- **Physical Device**: Scan the QR code with Expo Go app

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/          # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ScanScreen.js
│   │   ├── ReportScreen.js
│   │   └── GroupScreen.js
│   ├── components/       # Reusable components
│   │   └── ReceiptCard.js
│   ├── services/         # API services
│   │   └── api.js
│   └── context/          # React context
│       └── AuthContext.js
├── App.js               # Main app with navigation
└── README.md            # This file
```

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/services/api.js`:

```javascript
const API_URL = 'http://your-backend-url:3000/api';
```

### Environment Variables
Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=http://your-backend-url:3000/api
```

## 📱 Screens

### Authentication
- **LoginScreen**: Email/password login
- **RegisterScreen**: User registration with display name

### Main App (Authenticated)
- **HomeScreen**: Recent receipts list
- **ScanScreen**: Camera interface for receipt scanning
- **ReportScreen**: Monthly spending reports with charts
- **GroupScreen**: Family group management

## 🎨 UI Components

### ReceiptCard
Displays receipt information with merchant, amount, category, and date.

### Navigation
Bottom tab navigation with icons using `@react-navigation/bottom-tabs`.

## 📦 Dependencies

### Core
- `expo`: Framework for React Native
- `react-native`: Native components
- `axios`: HTTP client
- `@react-navigation/native`: Navigation
- `@react-navigation/native-stack`: Stack navigation
- `@react-navigation/bottom-tabs`: Tab navigation

### UI
- `react-native-chart-kit`: Charts for reports
- `react-native-svg`: SVG support
- `@expo/vector-icons`: Icon library

### Features
- `expo-camera`: Camera access
- `expo-image-picker`: Image selection
- `expo-file-system`: File operations
- `expo-secure-store`: Secure token storage
- `expo-sharing`: Content sharing

## 🔒 Authentication

The app uses JWT tokens stored securely in `expo-secure-store`. The `AuthContext` provides:
- Login/Logout functionality
- Registration
- Token management
- Authentication state

## 📱 Camera Integration

The ScanScreen uses `expo-camera` for:
- Real-time camera preview
- Photo capture
- Gallery access
- Permission handling

## 📊 Charts

The ReportScreen uses `react-native-chart-kit` for:
- Bar charts (spending trends)
- Category breakdowns
- Member comparisons

## 🤝 API Integration

All backend API calls are centralized in `src/services/api.js`:
- Automatic token attachment
- Error handling
- Response processing
- Secure storage

## 🚀 Deployment

### Expo Go (Development)
```bash
npx expo start --tunnel
```

### Production Build
```bash
npx expo build:android
npx expo build:ios
```

### App Store Deployment
```bash
npx expo publish
```

## 🐛 Debugging

### Common Issues

**Camera Permission Denied**:
- Check `app.json` for proper permissions
- Request permissions at runtime

**API Connection Failed**:
- Verify backend URL
- Check CORS settings on backend
- Ensure backend is running

**Authentication Errors**:
- Verify JWT token storage
- Check token expiration
- Validate backend auth endpoints

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and structure.

## 📝 Notes

- The app is designed for iOS and Android
- Uses Expo for easy development and deployment
- Follows React Native best practices
- Implements clean architecture with separation of concerns

## 🎉 Next Steps

1. Complete receipt scanning flow
2. Implement receipt confirmation screen
3. Add category selection
4. Implement CSV export
5. Add push notifications
6. Polish UI/UX
7. Test on multiple devices
8. Prepare for app store submission

The mobile app is well-structured and ready for further development!