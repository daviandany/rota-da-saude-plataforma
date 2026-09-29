import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';
import { api } from './api';

// Inicialização segura do Firebase App
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Chime de áudio sintetizado com Web Audio API (sem dependência de arquivos externos)
export function playNotificationSound(
  type: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL' = 'GENERAL'
) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'CRITICAL_READING') {
      // Tom de alerta urgente (duplo pulso)
      const now = ctx.currentTime;
      [0, 0.2].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now + offset); // Lá 5
        osc.frequency.exponentialRampToValueAtTime(440, now + offset + 0.15);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } else {
      // Tom suave de lembrete de medicação (2 tons ascendentes)
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // Dó, Mi, Sol
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.2);
      });
    }
  } catch (e) {
    console.warn('Não foi possível reproduzir som de notificação:', e);
  }
}

export interface FCMNotificationPayload {
  title: string;
  body: string;
  type: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL';
  data?: Record<string, any>;
  timestamp: string;
}

class FCMService {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private messageListeners: Set<(payload: FCMNotificationPayload) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.currentToken = localStorage.getItem('fcm_device_token');
  }

  // Verifica se o navegador tem suporte a Notificações e Service Worker
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Status atual da permissão
  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Inicializa o Messaging e registra o Service Worker
  async init(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      getFirebaseApp();
      const supported = await isSupported().catch(() => false);
      if (supported) {
        this.messaging = getMessaging(getFirebaseApp());
        this.setupForegroundListener();
      }

      // Registrar Service Worker para push em background
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });
        } catch (swErr) {
          console.warn('[FCM] Registro do service worker em background:', swErr);
        }
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('[FCM] Falha na inicialização do Firebase Messaging:', err);
    }
  }

  // Solicita permissão e obtém o Token do Dispositivo
  async requestPermissionAndGetToken(): Promise<string | null> {
    await this.init();

    let browserPermission: NotificationPermission = 'default';
    if (this.isSupported()) {
      try {
        browserPermission = await Notification.requestPermission();
      } catch (permErr) {
        // Em iframes ou ambientes com permissões delegadas restritas
        console.info('[FCM] Permissão de notificação nativa restrita pelo ambiente:', permErr);
        browserPermission = 'denied';
      }
    }

    let token: string | null = null;

    // Se o usuário concedeu permissão nativa, tenta obter token nativo FCM via Service Worker
    if (browserPermission === 'granted' && this.messaging && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        token = await getToken(this.messaging, {
          serviceWorkerRegistration: registration,
        });
      } catch (fcmTokenErr) {
        console.warn('[FCM] getToken nativo FCM em sandbox:', fcmTokenErr);
      }
    }

    // Se a permissão nativa não foi concedida ou estiver em ambiente iframe/sandbox:
    // Ativa o token para notificações in-app (toasts com som Web Audio API e central)
    if (!token) {
      let storedToken = localStorage.getItem('fcm_device_token');
      if (!storedToken) {
        storedToken = `fcm-inapp-${firebaseConfig.projectId}-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      }
      token = storedToken;
      console.info(
        `[FCM] Canal de notificações ativo (${
          browserPermission === 'granted' ? 'Push Nativo' : 'In-App Foreground'
        }) com token registrado.`
      );
    }

    this.currentToken = token;
    localStorage.setItem('fcm_device_token', token);

    // Registrar token com o backend para receber disparos
    try {
      await api.registerFCMToken(token, 'web');
    } catch (backendErr) {
      console.warn('[FCM] Erro ao sincronizar token com backend:', backendErr);
    }

    return token;
  }

  // Retorna o token atual armazenado
  getCurrentToken(): string | null {
    return this.currentToken || localStorage.getItem('fcm_device_token');
  }

  // Configura ouvinte para mensagens em primeiro plano (quando o app está aberto)
  private setupForegroundListener() {
    if (!this.messaging) return;

    try {
      onMessage(this.messaging, (payload) => {
        const notif: FCMNotificationPayload = {
          title: payload.notification?.title || payload.data?.title || 'Rota da Saúde',
          body: payload.notification?.body || payload.data?.body || '',
          type: (payload.data?.type as any) || 'GENERAL',
          data: payload.data,
          timestamp: new Date().toISOString(),
        };

        this.dispatchForegroundMessage(notif);
      });
    } catch (e) {
      console.warn('[FCM] Erro no listener onMessage:', e);
    }
  }

  // Dispara mensagem em foreground para todos os componentes inscritos
  dispatchForegroundMessage(notif: FCMNotificationPayload) {
    playNotificationSound(notif.type);
    this.messageListeners.forEach((listener) => {
      try {
        listener(notif);
      } catch (err) {
        console.error('[FCM] Erro no listener:', err);
      }
    });

    // Se o usuário permitiu notificações no navegador, exibir notificação nativa
    if (this.getPermission() === 'granted' && typeof Notification !== 'undefined') {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/assets/favicon.ico',
        });
      } catch (nErr) {
        // Ignora em caso de restrição do navegador
      }
    }
  }

  // Assinar mensagens recebidas
  onMessage(callback: (payload: FCMNotificationPayload) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }
}

export const fcmService = new FCMService();
