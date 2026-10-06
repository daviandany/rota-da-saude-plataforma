export class NotificationService {
    static tokens = new Map();
    // Notificações estritamente do usuário atual (sem mock de outros usuários)
    static notifications = [];
    static listeners = new Set();
    /**
     * Registra ou atualiza um token de dispositivo FCM
     */
    static registerToken(data) {
        const existing = this.tokens.get(data.token);
        const registeredAt = existing ? existing.registeredAt : new Date().toISOString();
        const record = {
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
    static getRegisteredTokens() {
        return Array.from(this.tokens.values());
    }
    /**
     * Dispara notificação push para um usuário específico
     */
    static async sendPushToUser(recipientId, recipientRole, notification) {
        const item = {
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
        const userTokens = Array.from(this.tokens.values()).filter((t) => t.userId === recipientId || t.role === recipientRole);
        console.log(`[FCM PUSH ENVIADO] ${item.title} -> ${userTokens.length} dispositivo(s) FCM encontrados.`);
        return item;
    }
    /**
     * Dispara alerta crítico para todos os Médicos e Profissionais de Saúde
     */
    static async sendCriticalReadingAlert(params) {
        const metricLabel = params.metricType === 'PRESSURE' ? 'Pressão Arterial' : 'Glicemia Capilar';
        const title = `🚨 ALERTA CRÍTICO: ${metricLabel} (${params.patientName})`;
        const body = `${params.patientName} registrou ${params.value} (${params.severity}). ${params.message}`;
        const item = {
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
    static async sendMedicationReminder(params) {
        const name = params.patientName || 'Paciente';
        const title = `💊 Lembrete de Medicamento: ${params.medicationName} ${params.dosage}`;
        const body = `Olá, ${name}! Está no horário (${params.reminderTime}) de tomar sua dose de ${params.medicationName}. Não se esqueça de beber água!`;
        const item = {
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
    static getNotifications(userId, role) {
        if (!userId)
            return [];
        return this.notifications.filter((n) => {
            if (n.recipientId === userId)
                return true;
            if (role === 'PROFESSIONAL' && n.recipientRole === 'PROFESSIONAL' && n.recipientId === 'all-doctors')
                return true;
            return false;
        });
    }
    /**
     * Marca uma notificação como lida
     */
    static markAsRead(id) {
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
    static markAllAsRead(userId, role) {
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
    static clearNotifications() {
        this.notifications = [];
    }
    /**
     * Assina atualizações em tempo real (Observer)
     */
    static subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    static notifyListeners(notif) {
        this.listeners.forEach((fn) => {
            try {
                fn(notif);
            }
            catch (err) {
                console.error('[FCM listener error]', err);
            }
        });
    }
}
