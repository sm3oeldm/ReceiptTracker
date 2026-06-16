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

// GET a single receipt by ID
export const getReceiptById = async (receiptId) => {
  try {
    return await authFetch(`receipts/${receiptId}`);
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

// GET all available categories
export const getCategories = async () => {
  try {
    return await authFetch('categories');
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

// Send a receipt image to Gemini for AI parsing
export const parseReceipt = async (imageUri) => {
  let token;
  try {
    token = await SecureStore.getItemAsync('userToken');
  } catch (e) {}

  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}receipts/parse`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401 && onAuthError) onAuthError();
    throw new Error(data.error || data.details || 'Failed to parse receipt');
  }

  return data.data;
};

// Save a new receipt to the backend
export const createReceipt = async (receiptData) => {
  try {
    return await authFetch('receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// UPDATE an existing receipt
export const updateReceipt = async (receiptId, receiptData) => {
  try {
    return await authFetch(`receipts/${receiptId}`, {
      method: 'PUT',
      body: JSON.stringify(receiptData),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// GET receipts with active warranties or return periods
export const getWarranties = async () => {
  try {
    return await authFetch('receipts/warranties/list');
  } catch (error) {
    throw new Error(error.message);
  }
};

// Chat with AI spending assistant
export const chatWithAssistant = async (message, conversationHistory) => {
  try {
    return await authFetch('assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
