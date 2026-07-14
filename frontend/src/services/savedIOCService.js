import apiClient from '../api/client.js';

export const getSavedIOCsApi = async (params = {}) => {
  const response = await apiClient.get('/api/saved-iocs', { params });
  return response.data;
};

export const deleteSavedIOCApi = async (id) => {
  const response = await apiClient.delete(`/api/saved-iocs/${id}`);
  return response.data;
};
