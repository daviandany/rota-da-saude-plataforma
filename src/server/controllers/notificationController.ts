import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { getDatabase } from '../db/database.js';

export const notificationController = {
  // Registra token FCM do dispositivo
  async registerToken(req: Request, res: Response) {
    try {
      const { token, platform } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token FCM é obrigatório.' });
      }

      const userId = req.user?.userId || 'anonymous';
      const role = req.user?.role || 'PATIENT';

      const registered = NotificationService.registerToken({
        token,
        userId,
        role: role as 'PATIENT' | 'PROFESSIONAL',
        platform: platform || 'web',
      });

      return res.status(200).json({
        success: true,
        message: 'Token FCM registrado com sucesso!',
        data: registered,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Retorna notificações do usuário atual
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const list = NotificationService.getNotifications(userId, role);
      const unreadCount = list.filter((n) => !n.read).length;

      return res.json({
        success: true,
        data: list,
        unreadCount,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Marca notificação como lida
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = NotificationService.markAsRead(id);
      return res.json({ success });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Marca todas como lidas
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const count = NotificationService.markAllAsRead(userId, role);
      return res.json({ success: true, updatedCount: count });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Dispara lembrete de medicação de teste (para pacientes)
  async testMedicationReminder(req: Request, res: Response) {
    try {
      const db = await getDatabase();
      const patientId = req.user?.profileId || 'pat-maria';
      const patient = await db.getPatientById(patientId);
      const meds = await db.getMedications(patientId);
      const activeMed = meds.find((m) => m.status === 'ATIVO') || {
        name: 'Losartana Potássica',
        dosage: '50mg',
        reminderTimes: ['08:00'],
      };

      const scheduledTime = activeMed.reminderTimes?.[0] || '08:00';

      const notif = await NotificationService.sendMedicationReminder({
        patientId,
        patientUserId: req.user?.userId,
        medicationName: activeMed.name,
        dosage: activeMed.dosage,
        reminderTime: scheduledTime,
        patientName: patient?.name || 'Maria Silva',
      });

      return res.json({
        success: true,
        message: 'Lembrete de medicação via FCM enviado com sucesso!',
        data: notif,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Dispara alerta crítico de teste (para médicos)
  async testCriticalReading(req: Request, res: Response) {
    try {
      const { type } = req.body; // 'PRESSURE' | 'GLUCOSE'
      const metricType = type === 'GLUCOSE' ? 'GLUCOSE' : 'PRESSURE';

      let value = '175 / 105 mmHg';
      let message = 'Pressão aferida acima do limiar de urgência (160/100 mmHg). Paciente orientada a repouso e monitoramento.';
      if (metricType === 'GLUCOSE') {
        value = '52 mg/dL';
        message = 'Hipoglicemia severa detectada em jejum. Paciente orientada para ingestão rápida de carboidratos.';
      }

      const notif = await NotificationService.sendCriticalReadingAlert({
        patientId: 'pat-maria',
        patientName: 'Maria Silva',
        metricType,
        value,
        severity: 'CRITICO',
        message,
      });

      return res.json({
        success: true,
        message: 'Alerta crítico para equipe médica disparado com sucesso!',
        data: notif,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  // Retorna configurações do Firebase Cloud Messaging para o cliente
  async getFCMConfig(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        projectId: 'gen-lang-client-0105711766',
        messagingSenderId: '674424279930',
        appId: '1:674424279930:web:a2062cc28c839bf1113cc3',
        registeredTokensCount: NotificationService.getRegisteredTokens().length,
      },
    });
  },
};
