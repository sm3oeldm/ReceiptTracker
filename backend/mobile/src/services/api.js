import { API_BASE_URL } from './api.config';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach auth token to every request automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // SecureStore may fail silently (e.g. no token stored yet)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// GET receipts by month/year
export const getReceipts = async (month, year) => {
  try {
    const response = await api.get(`receipts`, { params: { month, year } });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to fetch receipts: ${message}`);
  }
};

// GET current group (if applicable)
export const getCurrentGroup = async () => {
  try {
    const response = await api.get('groups/me');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to fetch current group: ${message}`);
  }
};

// CREATE a new group
export const createGroup = async (groupName) => {
  try {
    const response = await api.post('groups/create', { name: groupName });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to create group: ${message}`);
  }
};

// JOIN a group by invite code
export const joinGroup = async (inviteCode) => {
  try {
    const response = await api.post('groups/join', { invite_code: inviteCode });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to join group: ${message}`);
  }
};

// LEAVE current group
export const leaveGroup = async () => {
  try {
    const response = await api.post('groups/leave');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to leave group: ${message}`);
  }
};

// GET report data
export const getReport = async (year, month) => {
  try {
    const response = await api.get(`reports/${year}/${month}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Network Error';
    throw new Error(`Failed to fetch report: ${message}`);
  }
};
