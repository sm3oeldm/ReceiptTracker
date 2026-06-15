// API Configuration
// Update this URL to match your backend server address.
// Android emulator: use 10.0.2.2 (maps to host localhost)
// iOS simulator: use 127.0.0.1 (localhost can sometimes resolve to IPv6 ::1
//   which React Native on iOS may not handle — 127.0.0.1 avoids that)
// Physical device: use your machine's local IP address (e.g. 192.168.x.x)

import { Platform } from 'react-native';

const DEV_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const API_PORT = '3000';

export const API_BASE_URL = `http://${DEV_API_HOST}:${API_PORT}/api/`;
