import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

export const registerUser = async (userData) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
  return response.data;
};

export const getMe = async (token) => {
  const response = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const parentLoginByCode = async (code) => {
  const response = await axios.post(`${BASE_URL}/auth/parent-login`, { code });
  return response.data;
};