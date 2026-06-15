import { API_BASE_URL } from './api.config';
import * as SecureStore from 'expo-secure-store';

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// GET receipts by month/year
export const getReceipts = async (month, year) => {
  try {
    return await authFetch(`receipts?month=${month}&year=${year}`);
  } catch (error) {
    throw new Error(`Failed to fetch receipts: ${error.message}`);
  }
};

// GET current group (if applicable)
export const getCurrentGroup = async () => {
  try {
    return await authFetch('groups/me');
  } catch (error) {
    throw new Error(`Failed to fetch current group: ${error.message}`);
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
    throw new Error(`Failed to create group: ${error.message}`);
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
    throw new Error(`Failed to join group: ${error.message}`);
  }
};

// LEAVE current group
export const leaveGroup = async () => {
  try {
    return await authFetch('groups/leave', {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(`Failed to leave group: ${error.message}`);
  }
};

// GET report data
export const getReport = async (year, month) => {
  try {
    return await authFetch(`reports/${year}/${month}`);
  } catch (error) {
    throw new Error(`Failed to fetch report: ${error.message}`);
  }
};
