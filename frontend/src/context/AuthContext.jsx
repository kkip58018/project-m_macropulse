import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import axios from 'axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
  });

  // Add token to all requests
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
     if (data.session) {
    localStorage.setItem('supabase.auth.token', data.session.access_token);
    }
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setAuthToken(null);
    localStorage.removeItem('supabase.auth.token');
  };

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        localStorage.setItem('supabase.auth.token', token);
        setAuthToken(token);
        
        // Fetch user info from Django
        try {
          const response = await api.get('/auth/me/');
          const { email, is_admin } = response.data;
          setUser({ email, is_admin });
          setIsAdmin(is_admin);
        } catch (err) {
          console.error('Failed to fetch user info', err);
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const token = session.access_token;
        localStorage.setItem('supabase.auth.token', token);
        setAuthToken(token);
        try {
          const response = await api.get('/auth/me/');
          const { email, is_admin } = response.data;
          setUser({ email, is_admin });
          setIsAdmin(is_admin);
        } catch (err) {
          console.error('Failed to fetch user info on auth change', err);
          await supabase.auth.signOut();
        }
      } else {
        localStorage.removeItem('supabase.auth.token');
        setUser(null);
        setIsAdmin(false);
        setAuthToken(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};