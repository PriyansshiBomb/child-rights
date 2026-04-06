import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ai';

export const askCompanion = async (message, context = '') => {
  const response = await axios.post(`${API_URL}/chat`, { message, context });
  return response.data;
};

export const getStoryForZone = async (right) => {
  const response = await axios.get(`${API_URL}/story/${right}`);
  return response.data;
};

export const getParentReport = async (progress) => {
  const response = await axios.post(`${API_URL}/parent/report`, { progress });
  return response.data;
};

export const askParentChat = async (message, progress) => {
  const response = await axios.post(`${API_URL}/parent/chat`, { message, progress });
  return response.data;
};

export const getAIQuiz = async (zoneName, right, progress) => {
  const response = await axios.post(`${API_URL}/quiz`, { zoneName, right, progress });
  return response.data;
};
