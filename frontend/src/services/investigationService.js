import apiClient from '../api/client.js';

export const investigateIpApi = async (ip) => {
  const response = await apiClient.post('/api/ip', { ip });
  return response.data;
};

export const investigateDomainApi = async (domain) => {
  const response = await apiClient.post('/api/domain', { domain });
  return response.data;
};

export const investigateUrlApi = async (url) => {
  const response = await apiClient.post('/api/url', { url });
  return response.data;
};

export const investigateHashApi = async (hash) => {
  const response = await apiClient.post('/api/hash', { hash });
  return response.data;
};

export const bookmarkIocApi = async (iocData) => {
  const response = await apiClient.post('/api/saved-iocs', iocData);
  return response.data;
};

export const downloadInvestigationPdfApi = async (id) => {
  const response = await apiClient.get(`/api/${id}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

export const explainThreatApi = async (investigationId) => {
  const response = await apiClient.post('/api/ai/explain', { investigationId });
  return response.data;
};
