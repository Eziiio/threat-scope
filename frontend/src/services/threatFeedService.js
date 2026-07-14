import apiClient from '../api/client.js';

export const getThreatFeedApi = async (params = {}) => {
  const response = await apiClient.get('/api/threat-feed', { params });
  return response.data;
};
