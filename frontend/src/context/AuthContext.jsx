import { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, logoutApi, getProfileApi } from '../services/authService.js';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Checks current session by loading analyst profile
  const checkSession = useCallback(async () => {
    try {
      const response = await getProfileApi();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Fail silently for session checks on page load (expected if user hasn't logged in yet)
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync session on mount
  useEffect(() => {
    checkSession();

    // Catch 401s from Axios client globally
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [checkSession]);

  // Login handler
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await loginApi(credentials);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success(response.message || 'Logged in successfully!');
        return response.data;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await registerApi(userData);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        toast.success(response.message || 'Registration successful!');
        return response.data;
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please check validation rules.';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully.');
    } catch (error) {
      // Force clear state even if API fails
      setUser(null);
      setIsAuthenticated(false);
      toast.error('Session cleared.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        refreshProfile: checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
