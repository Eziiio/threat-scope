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
