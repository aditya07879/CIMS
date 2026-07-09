import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ims_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('ims_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      localStorage.setItem('ims_user', JSON.stringify(data.data));
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('ims_token', data.token);
    localStorage.setItem('ims_user', JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const register = async (formData) => {
    // Safety: always force role to 'student' on the client side too.
    // The backend enforces this independently.
    const sanitized = { ...formData, role: 'student' };
    const { data } = await authAPI.register(sanitized);
    localStorage.setItem('ims_token', data.token);
    localStorage.setItem('ims_user', JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const logout = async () => {
    try {
      // Notify server to invalidate token (advances tokenIssuedAt)
      await authAPI.logout();
    } catch {
      // Proceed with client-side logout even if the server call fails
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
