import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fcmService, FCMNotificationPayload, playNotificationSound } from '../services/fcm';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole: 'PATIENT' | 'PROFESSIONAL' | 'ALL';
  title: string;
  body: string;
  type: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL';
  data?: Record<string, any>;
  read: boolean;
  sentAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  permission: NotificationPermission;
  token: string | null;
  loading: boolean;
  activeToast: AppNotification | null;
  requestPushPermission: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  closeToast: () => void;
  testMedicationReminder: () => Promise<void>;
  testCriticalReading: (type?: 'PRESSURE' | 'GLUCOSE') => Promise<void>;
  refreshNotifications: () => Promise<void>;
  showNotification: (payload: { title: string; body: string; type?: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL' }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permission, setPermission] = useState<NotificationPermission>(fcmService.getPermission());
  const [token, setToken] = useState<string | null>(fcmService.getCurrentToken());
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Carregar notificações da API
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Erro ao atualizar notificações:', e);
    }
  }, [user]);

  // Inicializar FCM ao carregar ou mudar usuário
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fcmService.init();
    refreshNotifications();

    // Se já tiver token ou permissão concedida, registrar com backend
    const currentToken = fcmService.getCurrentToken();
    if (currentToken) {
      setToken(currentToken);
      api.registerFCMToken(currentToken, 'web').catch(() => {});
    }

    // Ouvinte em foreground do FCM
    const unsubscribeFCM = fcmService.onMessage((payload: FCMNotificationPayload) => {
      const newNotif: AppNotification = {
        id: 'toast-' + Date.now(),
        recipientId: user.id,
        recipientRole: user.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data,
        read: false,
        sentAt: payload.timestamp,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
      setActiveToast(newNotif);
    });

    // Polling leve a cada 15 segundos para sincronizar notificações do backend
    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);

    return () => {
      unsubscribeFCM();
      clearInterval(interval);
    };
  }, [user, refreshNotifications]);

  // Solicitar permissão e obter token FCM
  const requestPushPermission = async () => {
    setLoading(true);
    try {
      const deviceToken = await fcmService.requestPermissionAndGetToken();
      const currentPerm = fcmService.getPermission();
      setPermission(currentPerm);
      setToken(deviceToken);
      await refreshNotifications();

      // Feedback em toast visual e sonoro para o usuário
      if (currentPerm === 'granted') {
        setActiveToast({
          id: 'toast-perm-' + Date.now(),
          recipientId: user?.id || 'demo',
          recipientRole: user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
          title: 'Notificações Push Habilitadas',
          body: 'Você receberá notificações nativas no seu dispositivo.',
          type: 'GENERAL',
          read: false,
          sentAt: new Date().toISOString(),
        });
      } else {
        setActiveToast({
          id: 'toast-inapp-' + Date.now(),
          recipientId: user?.id || 'demo',
          recipientRole: user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
          title: 'Notificações In-App Ativas',
          body: 'Notificações nativas do navegador indisponíveis neste modo. Alertas sonoros e visuais ativos no app.',
          type: 'GENERAL',
          read: false,
          sentAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.info('[FCM] Status de inicialização push:', err);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (activeToast?.id === id) {
        setActiveToast(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setActiveToast(null);
    } catch (e) {
      console.error(e);
    }
  };

  const closeToast = () => {
    setActiveToast(null);
  };

  // Testar Lembrete de Medicação
  const testMedicationReminder = async () => {
    setLoading(true);
    try {
      const res = await api.testMedicationReminder();
      if (res && res.data) {
        playNotificationSound('MEDICATION');
        setActiveToast(res.data);
        await refreshNotifications();
      }
    } catch (e: any) {
      console.warn('Erro ao enviar lembrete:', e);
      setActiveToast({
        id: 'toast-err-' + Date.now(),
        recipientId: user?.id || 'demo',
        recipientRole: user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        title: 'Lembrete de Medicação',
        body: e.message || 'Lembrete enviado com sucesso no canal In-App.',
        type: 'MEDICATION',
        read: false,
        sentAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Testar Alerta Crítico
  const testCriticalReading = async (type: 'PRESSURE' | 'GLUCOSE' = 'PRESSURE') => {
    setLoading(true);
    try {
      const res = await api.testCriticalReading(type);
      if (res && res.data) {
        playNotificationSound('CRITICAL_READING');
        setActiveToast(res.data);
        await refreshNotifications();
      }
    } catch (e: any) {
      console.warn('Erro ao enviar alerta crítico:', e);
      setActiveToast({
        id: 'toast-crit-err-' + Date.now(),
        recipientId: user?.id || 'demo',
        recipientRole: user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        title: 'Alerta Clínico Crítico',
        body: e.message || 'Alerta disparado na fila de prioridade médica.',
        type: 'CRITICAL_READING',
        read: false,
        sentAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Disparar Notificação Customizada
  const showNotification = useCallback(
    (payload: {
      title: string;
      body: string;
      type?: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL';
    }) => {
      const type = payload.type || 'GENERAL';
      playNotificationSound(type);
      const newNotif: AppNotification = {
        id: 'toast-' + Date.now(),
        recipientId: user?.id || 'demo',
        recipientRole: user?.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        title: payload.title,
        body: payload.body,
        type,
        read: false,
        sentAt: new Date().toISOString(),
      };
      setActiveToast(newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    },
    [user]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permission,
        token,
        loading,
        activeToast,
        requestPushPermission,
        markAsRead,
        markAllAsRead,
        closeToast,
        testMedicationReminder,
        testCriticalReading,
        refreshNotifications,
        showNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
