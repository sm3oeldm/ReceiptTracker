// API Configuration
// Update this URL to match your backend server address.
// Android emulator: use 10.0.2.2 (maps to host localhost)
// iOS simulator: use 127.0.0.1 or your LAN IP
// Physical device: use your machine's local IP address (e.g. 192.168.x.x)
//
// Backend must be running: cd ../backend && npm run dev

import { Platform } from 'react-native';

const DEV_API_HOST = Platform.select({
  android: '10.0.2.2',
  ios: '192.168.0.132',
  default: '192.168.0.132',
});
const API_PORT = '3000';

export const API_BASE_URL = `http://${DEV_API_HOST}:${API_PORT}/api/`;

// For debugging: uncomment the line below to see the URL in Metro logs
// console.log('[api.config] API_BASE_URL:', API_BASE_URL);
