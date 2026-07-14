import axios from 'axios';

const apiClient = axios.create({
  baseURL: '', // Empty because the Vite proxy handles mapping relative /api requests to localhost:5000
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Send cookies automatically
});

// Response Interceptor for global error catching
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error response is an authentication failure, we can handle it globally
    const status = error.response ? error.response.status : null;
    
    if (status === 401 && !window.location.pathname.includes('/login')) {
      console.warn('[API Client] Unauthorized request. Redirecting context state.');
      // Custom event to alert AuthContext to logout the user
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
