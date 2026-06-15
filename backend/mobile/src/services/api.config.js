// API Configuration
// =================
// This file controls how the mobile app connects to the backend server.
//
// Platform defaults:
//   Android emulator → 10.0.2.2  (maps to host machine's localhost)
//   iOS simulator    → localhost  (runs on the same Mac)
//   Physical device  → use your computer's LAN IP (e.g. 192.168.x.x)
//
// If you see "Network Error" on every screen, the app can't reach the backend.
// Most common fix: replace the host below with your computer's network IP.
//
//   Example: const DEV_API_HOST = '192.168.1.50';
//
// Backend must be running: cd ../backend && npm run dev

import { Platform } from 'react-native';

const DEV_API_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});
const API_PORT = '3000';

export const API_BASE_URL = `http://${DEV_API_HOST}:${API_PORT}/api/`;

// For debugging: uncomment the line below to see the URL in Metro logs
// console.log('[api.config] API_BASE_URL:', API_BASE_URL);
