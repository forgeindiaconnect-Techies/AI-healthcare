import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      const userPayload = { ...data.data, token: data.token };
      setUser(userPayload);
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response && (error.response.data.error || error.response.data.message)
          ? (error.response.data.error || error.response.data.message)
          : error.message 
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await axios.post('/api/auth/register', { 
        name, email, password, role 
      });
      const userPayload = { ...data.data, token: data.token };
      setUser(userPayload);
      localStorage.setItem('userInfo', JSON.stringify(userPayload));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response && (error.response.data.error || error.response.data.message)
          ? (error.response.data.error || error.response.data.message)
          : error.message 
      };
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
