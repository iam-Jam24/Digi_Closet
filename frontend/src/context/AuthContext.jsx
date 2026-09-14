import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('digi_closet_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
      } catch {
        localStorage.removeItem('digi_closet_token');
        localStorage.removeItem('digi_closet_user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user: userData, token } = data.data;

    localStorage.setItem('digi_closet_token', token);
    localStorage.setItem('digi_closet_user', JSON.stringify(userData));
    setUser(userData);

    return data;
  }, []);

  const register = useCallback(async (name, email, password, confirmPassword) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
    });
    const { user: userData, token } = data.data;

    localStorage.setItem('digi_closet_token', token);
    localStorage.setItem('digi_closet_user', JSON.stringify(userData));
    setUser(userData);

    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('digi_closet_token');
    localStorage.removeItem('digi_closet_user');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
