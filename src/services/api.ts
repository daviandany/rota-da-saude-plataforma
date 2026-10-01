import {
  User,
  PatientSummary,
  BloodPressureRecord,
  GlucoseRecord,
  Medication,
  Appointment,
  ClinicalAlert,
  EducationalContent,
  Patient,
} from '../types';
import { FirestoreClinicalService } from './firestoreService';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(email: string, password: string, name?: string, role?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha no login');
    return data;
  },

  async register(payload: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha no cadastro');
    return data;
  },

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    resetLink: string;
    previewEmail: {
      to: string;
      userName: string;
      subject: string;
      resetLink: string;
      expiresInMinutes: number;
      sentAt: string;
    };
  }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao solicitar recuperação de senha.');
    return data;
  },

  async verifyResetToken(token: string): Promise<{
    success: boolean;
    valid: boolean;
    email: string;
    userName: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Link de recuperação inválido ou expirado.');
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    email: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao redefinir senha.');
    return data;
  },

  async loginGoogleFirebase(payload: {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    role: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/google-firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na autenticação Google');
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sessão expirada');
    return data.user;
  },

  async updateProfile(payload: {
    name?: string;
    age?: number;
    gender?: string;
    conditions?: string[];
    healthcareUnit?: string;
    phone?: string;
    crm?: string;
    specialty?: string;
    riskLevel?: string;
  }): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados cadastrais');
    return data;
  },

  // Clinical (Patient)
  async getSummary(patientId?: string): Promise<PatientSummary> {
    const query = patientId ? `?patientId=${patientId}` : '';
    const res = await fetch(`${API_BASE}/clinical/summary${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar resumo clínico');
    return data.data;
  },

  async recordPressure(payload: {
    patientId?: string;
    systolic: number;
    diastolic: number;
    pulse: number;
    recordedAt?: string;
    notes?: string;
  }): Promise<BloodPressureRecord> {
    const res = await fetch(`${API_BASE}/clinical/pressure`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar pressão');
    const record = data.data;

    try {
      await FirestoreClinicalService.recordBloodPressure(record);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return record;
  },

  async recordGlucose(payload: {
    patientId?: string;
    glucoseValue: number;
    moment: string;
    recordedAt?: string;
    notes?: string;
  }): Promise<GlucoseRecord> {
    const res = await fetch(`${API_BASE}/clinical/glucose`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar glicemia');
    const record = data.data;

    try {
      await FirestoreClinicalService.recordGlucose(record);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return record;
  },

  async getHistory(patientId?: string, timeframe: string = '7d'): Promise<any> {
    const p = patientId ? `patientId=${patientId}&` : '';
    const res = await fetch(`${API_BASE}/clinical/history?${p}timeframe=${timeframe}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar histórico');
    return data.data;
  },

  // Medications
  async getMedications(patientId?: string): Promise<Medication[]> {
    const query = patientId ? `?patientId=${patientId}` : '';
    const res = await fetch(`${API_BASE}/medications${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar medicamentos');
    return data.data;
  },

  async addMedication(payload: {
    patientId?: string;
    name: string;
    dosage: string;
    frequency: string;
    reminderTimes: string[];
    notes?: string;
  }): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao adicionar medicamento');
    const med = data.data;

    try {
      await FirestoreClinicalService.addMedication(med);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return med;
  },

  async updateMedicationStatus(id: string, status: string): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar medicamento');

    try {
      await FirestoreClinicalService.updateMedicationStatus(id, status as any);
    } catch (e) {
      console.warn('[Firestore] Status local mantido, erro no Firestore:', e);
    }

    return data.data;
  },

  // Appointments
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    const query = patientId ? `?patientId=${patientId}` : '';
    const res = await fetch(`${API_BASE}/appointments${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar consultas');
    let list: Appointment[] = data.data || [];

    if (FirestoreClinicalService.isAuthReady()) {
      try {
        const fsApps = await FirestoreClinicalService.getAppointments(patientId);
        if (fsApps && fsApps.length > 0) {
          const map = new Map<string, Appointment>();
          list.forEach((a) => map.set(a.id, a));
          fsApps.forEach((a) => map.set(a.id, a));
          list = Array.from(map.values()).sort(
            (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          );
        }
      } catch (e) {
        console.warn('[Firestore] Falha ao sincronizar consultas do Firestore:', e);
      }
    }
    return list;
  },

  async createAppointment(payload: any): Promise<Appointment> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao agendar consulta');
    const app = data.data;

    try {
      await FirestoreClinicalService.createAppointment(app);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return app;
  },

  // Alerts
  async getAlerts(patientId?: string, severity?: string): Promise<ClinicalAlert[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (severity) params.append('severity', severity);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/alerts${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar alertas');
    return data.data;
  },

  async resolveAlert(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    try {
      await FirestoreClinicalService.resolveClinicalAlert(id);
    } catch (e) {
      console.warn('[Firestore] Alerta resolvido localmente, erro no Firestore:', e);
    }
    return data.success;
  },

  // Educational
  async getEducational(category?: string, type?: string): Promise<EducationalContent[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/content/educational${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar conteúdos');
    return data.data;
  },

  // Doctor Portal
  async getDoctorDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/doctor/dashboard`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao carregar dashboard médico');
    return data.data;
  },

  async getDoctorPatients(search?: string, risk?: string): Promise<Patient[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (risk) params.append('risk', risk);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/doctor/patients${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    let patients: Patient[] = data.data || [];

    // Mescla pacientes persistidos no Firestore se autenticado
    try {
      if (FirestoreClinicalService.isAuthReady()) {
        const fsPatients = await FirestoreClinicalService.getAllPatients();
        if (fsPatients && fsPatients.length > 0) {
          const map = new Map<string, Patient>();
          patients.forEach((p) => map.set(p.id, p));
          fsPatients.forEach((fp) => map.set(fp.id, { ...map.get(fp.id), ...fp }));
          patients = Array.from(map.values());
        }
      }
    } catch {
      // Ignora erro se sem permissão ou offline
    }

    return patients;
  },

  async getPatientProfile(patientId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/doctor/patients/${patientId}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao buscar prontuário do paciente');
    return data.data;
  },

  // Reports
  async getReport(patientId?: string): Promise<any> {
    const query = patientId ? `?patientId=${patientId}` : '';
    const res = await fetch(`${API_BASE}/reports/summary${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao gerar relatório');
    return data.data;
  },

  // Health
  async checkHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Firebase Cloud Messaging (FCM) & Push Notifications
  async registerFCMToken(token: string, platform: string = 'web'): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/register-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, platform }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar token FCM');
    return data;
  },

  async getNotifications(): Promise<{ data: any[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao obter notificações');
    return data;
  },

  async markNotificationAsRead(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsAsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async testMedicationReminder(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/test-medication`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao testar lembrete de medicação');
    return data;
  },

  async testCriticalReading(type: 'PRESSURE' | 'GLUCOSE' = 'PRESSURE'): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/test-critical-reading`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao testar alerta crítico');
    return data;
  },

  async getFCMConfig(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/fcm-config`);
    return res.json();
  },
};

