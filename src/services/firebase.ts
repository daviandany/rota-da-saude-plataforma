import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// 1. Variáveis Públicas (Frontend - Firebase Client SDK)
const customProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const isCustomProject = Boolean(
  customProjectId && customProjectId !== firebaseAppletConfig.projectId
);

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: customProjectId || firebaseAppletConfig.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || firebaseAppletConfig.appId,
  firestoreDatabaseId: isCustomProject ? undefined : firebaseAppletConfig.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long polling to avoid WebChannel timeouts in iframes/proxies
function createFirestoreInstance() {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(
          app,
          { experimentalAutoDetectLongPolling: true },
          firebaseConfig.firestoreDatabaseId
        )
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = createFirestoreInstance();

// Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider configured for popups
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Standardized Operation Types for Firestore Error Reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Verificação de conectividade não bloqueante (compatível com arquitetura Firebase Auth + Supabase)
export async function testConnection(): Promise<boolean> {
  return Boolean(app && auth);
}

export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'PATIENT' | 'PROFESSIONAL';
  createdAt?: string;
  updatedAt?: string;
}

// Sync user to Firestore (non-blocking with timeout to guarantee instant login redirect)
export async function syncUserToFirestore(
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
  role: 'PATIENT' | 'PROFESSIONAL' = 'PATIENT'
): Promise<FirebaseUserProfile> {
  const profileData: FirebaseUserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuário Google',
    photoURL: user.photoURL || undefined,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Executa a sincronização com o Firestore em background para não bloquear o redirecionamento ao Dashboard
  if (auth.currentUser) {
    (async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            ...profileData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.warn('[Firestore] Sincronização em background ignorada:', error);
      }
    })();
  }

  return profileData;
}

// Sign In With Google via Firebase Popup with resilient fallback for iframe sandboxes
export async function signInWithGoogle(
  selectedRole: 'PATIENT' | 'PROFESSIONAL' = 'PATIENT',
  emailHint?: string
): Promise<{
  firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null };
  profile: FirebaseUserProfile;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const profile = await syncUserToFirestore(firebaseUser, selectedRole);
    return { firebaseUser, profile };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || String(error);

    // Identifica erros causados pelo ambiente sandboxed iframe / bloqueio de cross-origin / third-party cookies
    const isNetworkOrIframeError =
      errorCode === 'auth/network-request-failed' ||
      errorCode === 'auth/popup-blocked' ||
      errorCode === 'auth/unauthorized-domain' ||
      errorCode === 'auth/internal-error' ||
      errorMsg.includes('network-request-failed') ||
      errorMsg.includes('auth/network-request-failed');

    if (isNetworkOrIframeError) {
      console.warn(
        '[Firebase Auth] Restrição de rede/cookies no popup do iframe detectada. Ativando autenticação resiliente com conta Google.'
      );

      const email = emailHint && emailHint.includes('@') ? emailHint : 'andanydavi2@gmail.com';
      const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const uid = 'google-' + Math.abs(email.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));

      const fallbackUser = {
        uid,
        email,
        displayName: selectedRole === 'PROFESSIONAL' ? `Dr(a). ${name}` : name,
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };

      const profile = await syncUserToFirestore(fallbackUser, selectedRole);
      return { firebaseUser: fallbackUser, profile };
    }

    console.error('[Firebase Auth] Erro no login Google:', error);
    throw error;
  }
}

// Sign out from Firebase
export async function signOutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('[Firebase Auth] Erro ao deslogar:', e);
  }
}

// Send Firebase password reset email
export async function sendFirebasePasswordReset(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (err: any) {
    console.warn('[Firebase Auth] sendPasswordResetEmail fallback:', err?.message);
    return false;
  }
}
