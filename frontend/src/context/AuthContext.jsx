import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  const register = async (name, email, password, role) => {
    const { data } = await api.post(`${import.meta.env.VITE_API_URL}/auth/register`, { name, email, password, role });
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
