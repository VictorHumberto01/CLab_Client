"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      let token = null;
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        token = window.localStorage.getItem('token');
      }
      
      if (token) {
        try {
          const res = await api.get('/validate');
           if (res.data.success) {
             setUser(res.data.data);
           }
        } catch (error) {
          console.error("Token validation failed", error);
          if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
            window.localStorage.removeItem('token');
          }
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.data.success) {
        const token = res.data.data.token;
        if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
          window.localStorage.setItem('token', token);
        }
        
         const validateRes = await api.get('/validate');
         if (validateRes.data.success) {
             setUser(validateRes.data.data);
         }
        return { success: true };
      }
    } catch (error) {
      console.error("Login failed", error);
        return { 
            success: false, 
            error: error.response?.data?.error || "Login failed" 
        };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem('token');
    }
    setUser(null);
    router.push('/');
  };

  // Login with an already obtained token (e.g., from matricula login)
  const loginWithToken = async (token) => {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem('token', token);
    }
    try {
      const validateRes = await api.get('/validate');
      if (validateRes.data.success) {
        setUser(validateRes.data.data);
      }
    } catch (error) {
      console.error("Token validation failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
