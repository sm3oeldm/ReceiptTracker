import { API_BASE_URL } from './api.config';
import * as SecureStore from 'expo-secure-store';

// Auth error callback — gets called when token is invalid/expired
let onAuthError = null;
export function setOnAuthError(callback) {
  onAuthError = callback;
}

// Helper: read auth token and make a fetch request
async function authFetch(path, options = {}) {
  let token;
  try {
    token = await SecureStore.getItemAsync('userToken');
  } catch (e) {
    // No token stored yet — fine for unauthenticated flows
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }

  const data = await response.json();

  if (!response.ok) {
    // Detect expired/invalid token and trigger logout
    if (response.status === 401 && onAuthError) {
      onAuthError();
    }
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// GET receipts by month/year
export const getReceipts = async (month, year) => {
  try {
    return await authFetch(`receipts?month=${month}&year=${year}`);
  } catch (error) {
    throw new Error(error.message);
  }
};

// GET current group (if applicable)
export const getCurrentGroup = async () => {
  try {
    return await authFetch('groups/me');
  } catch (error) {
    throw new Error(error.message);
  }
};

// CREATE a new group
export const createGroup = async (groupName) => {
  try {
    return await authFetch('groups/create', {
      method: 'POST',
      body: JSON.stringify({ name: groupName }),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// JOIN a group by invite code
export const joinGroup = async (inviteCode) => {
  try {
    return await authFetch('groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// LEAVE current group
export const leaveGroup = async () => {
  try {
    return await authFetch('groups/leave', {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// GET report data
export const getReport = async (year, month) => {
  try {
    return await authFetch(`reports/${year}/${month}`);
  } catch (error) {
    throw new Error(error.message);
  }
};
