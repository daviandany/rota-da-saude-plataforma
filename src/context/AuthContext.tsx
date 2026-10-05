import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { User, UserRole } from '../types';
import { api, apiClient, setAuthToken } from '../services/api';
import { signInWithGoogle, signOutFirebase, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FirestoreClinicalService } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  login: (email: string, pass: string, name?: string, role?: UserRole) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    age?: number;
    gender?: string;
    crm?: string;
    conditions?: string[];
  }) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  loginGoogle: (role: UserRole, emailHint?: string) => Promise<void>;
  updateUserProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Sincroniza o token do AuthContext com a instância do Axios
  useLayoutEffect(() => {
    setAuthToken(token);

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setAuthToken(savedToken);
    setToken(savedToken);

    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.warn('Sessão expirada, limpando token.');
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setIsFirebaseConnected(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, name?: string, role?: UserRole) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass, name, role);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    age?: number;
    gender?: string;
    crm?: string;
    conditions?: string[];
  }) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (role: UserRole, emailHint?: string) => {
    setLoading(true);
    try {
      // 1. Popup Google login + sync to Firestore users collection
      const { firebaseUser } = await signInWithGoogle(
        role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        emailHint
      );

      // 2. Synchronize with backend session
      const res = await api.loginGoogleFirebase({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário Google',
        photoURL: firebaseUser.photoURL || undefined,
        role,
      });

      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setIsFirebaseConnected(true);

      // Sincroniza dados iniciais clínicos no Firestore se autenticado
      if (FirestoreClinicalService.isAuthReady()) {
        FirestoreClinicalService.seedFirestoreIfEmpty(res.user).catch((e) =>
          console.warn('[Firestore] Seed background:', e)
        );
      }
    } catch (err: any) {
      console.error('[AuthContext] Erro no login com Google / Firebase:', err);
      throw err;
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
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await signOutFirebase();
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.error(e);
    }
  };

  const updateUserProfile = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.updateProfile(data);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isFirebaseConnected,
        login,
        register,
        loginDemo,
        loginGoogle,
        updateUserProfile,
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
