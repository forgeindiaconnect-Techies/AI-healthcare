import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Failed to parse user info from localStorage', error);
      localStorage.removeItem('userInfo');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await API.post('/api/auth/login', { email, password });
      const userPayload = { ...data.data, token: data.token };
      setUser(userPayload);
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      return { success: true, user: userPayload };
    } catch (error) {
      let message = error.message;
      let code = null;
      if (error.response && error.response.data) {
        code = error.response.data.code;
        if (error.response.data.details && error.response.data.details.length > 0) {
          message = error.response.data.details.map(d => d.message).join(', ');
        } else {
          message = error.response.data.error || error.response.data.message || message;
        }
      }
      return { success: false, message, code };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await API.post('/api/auth/register', { 
        name, email, password, role 
      });
      if (data.token) {
        const userPayload = { ...data.data, token: data.token };
        setUser(userPayload);
        localStorage.setItem('userInfo', JSON.stringify(userPayload));
        return { success: true, user: userPayload };
      } else {
        return { success: true, message: data.message };
      }
    } catch (error) {
      let message = error.message;
      if (error.response && error.response.data) {
        if (error.response.data.details && error.response.data.details.length > 0) {
          message = error.response.data.details.map(d => d.message).join(', ');
        } else {
          message = error.response.data.error || error.response.data.message || message;
        }
      }
      return { success: false, message };
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('doctor');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
