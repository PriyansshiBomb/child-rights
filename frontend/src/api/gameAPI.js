import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getZones = async (token) => {
  const response = await axios.get(`${BASE_URL}/zones`, authHeaders(token));
  return response.data;
};

export const getMyProgress = async (token) => {
  const response = await axios.get(`${BASE_URL}/progress/me`, authHeaders(token));
  return response.data;
};

export const saveProgress = async (token, progressData) => {
  const response = await axios.post(`${BASE_URL}/progress/save`, progressData, authHeaders(token));
  return response.data;
};

export const getLeaderboard = async (token) => {
  const response = await axios.get(`${BASE_URL}/leaderboard`, authHeaders(token));
  return response.data;
};

export const getBadges = async (token) => {
  const response = await axios.get(`${BASE_URL}/badges`, authHeaders(token));
  return response.data;
};

export const getChildProgress = async (token, childId) => {
  const response = await axios.get(`${BASE_URL}/progress/child/${childId}`, authHeaders(token));
  return response.data;
};

export const updateZone = async (token, zoneId, data) => {
  const response = await axios.put(`${BASE_URL}/zones/${zoneId}`, data, authHeaders(token));
  return response.data;
};

export const createZone = async (token, data) => {
  const response = await axios.post(`${BASE_URL}/zones`, data, authHeaders(token));
  return response.data;
};