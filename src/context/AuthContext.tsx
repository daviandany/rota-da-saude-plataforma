import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      // Auto-login as Maria Silva by default for instant delight if first visit
      try {
        await loginDemo('PATIENT');
      } catch (e) {
        setLoading(false);
      }
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.warn('Sessão expirada, limpando token.');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // fallback to demo patient
      try {
        await loginDemo('PATIENT');
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      const email = role === 'PATIENT' ? 'maria.silva@email.com' : 'carlos.mendes@saude.gov.br';
      const pass = role === 'PATIENT' ? 'paciente123' : 'medico123';
      const res = await api.login(email, pass);
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
