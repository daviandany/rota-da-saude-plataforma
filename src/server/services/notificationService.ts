import { getDatabase } from '../db/database';

export interface PushNotificationItem {
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

export interface RegisteredToken {
  token: string;
  userId: string;
  role: 'PATIENT' | 'PROFESSIONAL';
  platform: string;
  registeredAt: string;
  updatedAt: string;
}

export class NotificationService {
  private static tokens: Map<string, RegisteredToken> = new Map();
  private static notifications: PushNotificationItem[] = [
    {
      id: 'notif-seed-1',
      recipientId: 'u-patient-maria',
      recipientRole: 'PATIENT',
      title: '💊 Lembrete de Medicamento: Losartana 50mg',
      body: 'Hora de tomar sua dose da manhã (08:00). Mantenha seu coração protegido!',
      type: 'MEDICATION',
      data: {
        medicationName: 'Losartana',
        dosage: '50mg',
        scheduledTime: '08:00',
      },
      read: false,
      sentAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'notif-seed-2',
      recipientId: 'u-prof-carlos',
      recipientRole: 'PROFESSIONAL',
      title: '🚨 ALERTA CRÍTICO: Pressão Alta - Maria Silva',
      body: 'Pressão registrada em 165/102 mmHg (Crítica). Paciente estratificada em Alto Risco cardiovascular.',
      type: 'CRITICAL_READING',
      data: {
        patientId: 'pat-maria',
        patientName: 'Maria Silva',
        metric: 'PRESSURE',
        value: '165/102 mmHg',
        severity: 'CRITICO',
      },
      read: false,
      sentAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  private static listeners: Set<(notif: PushNotificationItem) => void> = new Set();

  /**
   * Registra ou atualiza um token de dispositivo FCM
   */
  static registerToken(data: {
    token: string;
    userId: string;
    role: 'PATIENT' | 'PROFESSIONAL';
    platform?: string;
  }): RegisteredToken {
    const existing = this.tokens.get(data.token);
    const registeredAt = existing ? existing.registeredAt : new Date().toISOString();
    
    const record: RegisteredToken = {
      token: data.token,
      userId: data.userId,
      role: data.role,
      platform: data.platform || 'web',
      registeredAt,
      updatedAt: new Date().toISOString(),
    };

    this.tokens.set(data.token, record);
    console.log(`[FCM] Token registrado com sucesso para ${data.role} (${data.userId}): ${data.token.slice(0, 20)}...`);
    return record;
  }

  /**
   * Retorna os tokens registrados (para auditoria e monitoramento)
   */
  static getRegisteredTokens(): RegisteredToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Dispara notificação push para um usuário específico
   */
  static async sendPushToUser(
    recipientId: string,
    recipientRole: 'PATIENT' | 'PROFESSIONAL',
    notification: {
      title: string;
      body: string;
      type: 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT' | 'GENERAL';
      data?: Record<string, any>;
    }
  ): Promise<PushNotificationItem> {
    const item: PushNotificationItem = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      recipientId,
      recipientRole,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data || {},
      read: false,
      sentAt: new Date().toISOString(),
    };

    this.notifications.unshift(item);
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }

    // Broadcast para ouvintes em tempo real
    this.notifyListeners(item);

    // Identificar tokens associados ao usuário para envio FCM
    const userTokens = Array.from(this.tokens.values()).filter(
      (t) => t.userId === recipientId || t.role === recipientRole
    );
    console.log(`[FCM PUSH ENVIADO] ${item.title} -> ${userTokens.length} dispositivo(s) FCM encontrados.`);

    return item;
  }

  /**
   * Dispara alerta crítico para todos os Médicos e Profissionais de Saúde
   */
  static async sendCriticalReadingAlert(params: {
    patientId: string;
    patientName: string;
    metricType: 'PRESSURE' | 'GLUCOSE';
    value: string;
    severity: 'CRITICO' | 'ATENCAO';
    message: string;
  }): Promise<PushNotificationItem> {
    const metricLabel = params.metricType === 'PRESSURE' ? 'Pressão Arterial' : 'Glicemia Capilar';
    const title = `🚨 ALERTA CRÍTICO: ${metricLabel} (${params.patientName})`;
    const body = `${params.patientName} registrou ${params.value} (${params.severity}). ${params.message}`;

    const item: PushNotificationItem = {
      id: 'crit-' + Date.now(),
      recipientId: 'all-doctors',
      recipientRole: 'PROFESSIONAL',
      title,
      body,
      type: 'CRITICAL_READING',
      data: {
        patientId: params.patientId,
        patientName: params.patientName,
        metricType: params.metricType,
        value: params.value,
        severity: params.severity,
      },
      read: false,
      sentAt: new Date().toISOString(),
    };

    this.notifications.unshift(item);
    this.notifyListeners(item);

    console.log(`[FCM CRITICAL BROADCAST] ${title} disparado para a equipe médica.`);
    return item;
  }

  /**
   * Dispara lembrete de medicação para o paciente
   */
  static async sendMedicationReminder(params: {
    patientId: string;
    patientUserId?: string;
    medicationName: string;
    dosage: string;
    reminderTime: string;
    patientName?: string;
  }): Promise<PushNotificationItem> {
    const name = params.patientName || 'Paciente';
    const title = `💊 Lembrete de Medicamento: ${params.medicationName} ${params.dosage}`;
    const body = `Olá, ${name}! Está no horário (${params.reminderTime}) de tomar sua dose de ${params.medicationName}. Não se esqueça de beber água!`;

    const item: PushNotificationItem = {
      id: 'med-' + Date.now(),
      recipientId: params.patientUserId || params.patientId,
      recipientRole: 'PATIENT',
      title,
      body,
      type: 'MEDICATION',
      data: {
        medicationName: params.medicationName,
        dosage: params.dosage,
        reminderTime: params.reminderTime,
        patientId: params.patientId,
      },
      read: false,
      sentAt: new Date().toISOString(),
    };

    this.notifications.unshift(item);
    this.notifyListeners(item);

    console.log(`[FCM MEDICATION REMINDER] Disparado para ${params.patientId}: ${params.medicationName}`);
    return item;
  }

  /**
   * Retorna notificações filtradas pelo usuário / papel
   */
  static getNotifications(userId?: string, role?: string): PushNotificationItem[] {
    return this.notifications.filter((n) => {
      if (!userId && !role) return true;
      if (n.recipientRole === 'ALL') return true;
      if (role && n.recipientRole === role) return true;
      if (userId && (n.recipientId === userId || n.recipientId === 'all-doctors')) return true;
      return false;
    });
  }

  /**
   * Marca uma notificação como lida
   */
  static markAsRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  /**
   * Marca todas como lidas
   */
  static markAllAsRead(userId?: string, role?: string): number {
    let count = 0;
    this.notifications.forEach((n) => {
      if (!userId || n.recipientId === userId || (role && n.recipientRole === role)) {
        if (!n.read) {
          n.read = true;
          count++;
        }
      }
    });
    return count;
  }

  /**
   * Limpa histórico
   */
  static clearNotifications(): void {
    this.notifications = [];
  }

  /**
   * Assina atualizações em tempo real (Observer)
   */
  static subscribe(listener: (notif: PushNotificationItem) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(notif: PushNotificationItem) {
    this.listeners.forEach((fn) => {
      try {
        fn(notif);
      } catch (err) {
        console.error('[FCM listener error]', err);
      }
    });
  }
}
