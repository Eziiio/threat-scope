import apiClient from '../api/client.js';

export const getDashboardStatsApi = async () => {
  const response = await apiClient.get('/api/dashboard');
  return response.data;
};
