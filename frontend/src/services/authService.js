import apiClient from '../api/client.js';

export const loginApi = async (credentials) => {
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData) => {
  const response = await apiClient.post('/api/auth/register', userData);
  return response.data;
};

export const logoutApi = async () => {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
};

export const getProfileApi = async () => {
  const response = await apiClient.get('/api/auth/profile');
  return response.data;
};
