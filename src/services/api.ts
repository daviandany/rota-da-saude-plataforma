import axios from 'axios';
import { getAuth } from 'firebase/auth';
import './firebase';
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

// Token armazenado e sincronizado com o AuthContext
let authContextToken: string | null = localStorage.getItem('token');

export function setAuthToken(token: string | null) {
  authContextToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getAuthToken(): string | null {
  return authContextToken || localStorage.getItem('token');
}

// Instância central do Axios para todas as chamadas de API ao backend
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: obtém o token de getAuth().currentUser?.getIdToken() (com fallback para o token do AuthContext) e adiciona o header Authorization: Bearer <token>
apiClient.interceptors.request.use(
  async (config) => {
    const firebaseToken = await getAuth().currentUser?.getIdToken();
    const token = firebaseToken || getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: padroniza mensagens de erro vindas do backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Erro na comunicação com o servidor';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Auth
  async login(
    email: string,
    password: string,
    name?: string,
    role?: string
  ): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post('/auth/login', { email, password, name, role });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(payload: any): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post('/auth/register', payload);
    if (data.token) {
      setAuthToken(data.token);
    }
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
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  async verifyResetToken(token: string): Promise<{
    success: boolean;
    valid: boolean;
    email: string;
    userName: string;
  }> {
    const { data } = await apiClient.post('/auth/verify-reset-token', { token });
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    email: string;
  }> {
    const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  async loginGoogleFirebase(payload: {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    role: string;
  }): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post('/auth/google-firebase', payload);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get('/auth/me');
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
    const { data } = await apiClient.put('/auth/profile', payload);
    return data;
  },

  // Clinical (Patient)
  async getSummary(patientId?: string): Promise<PatientSummary> {
    const { data } = await apiClient.get('/clinical/summary', {
      params: patientId ? { patientId } : undefined,
    });
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
    const { data } = await apiClient.post('/clinical/pressure', payload);
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
    const { data } = await apiClient.post('/clinical/glucose', payload);
    const record = data.data;

    try {
      await FirestoreClinicalService.recordGlucose(record);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return record;
  },

  async getHistory(patientId?: string, timeframe: string = '7d'): Promise<any> {
    const { data } = await apiClient.get('/clinical/history', {
      params: { ...(patientId ? { patientId } : {}), timeframe },
    });
    return data.data;
  },

  // Medications
  async getMedications(patientId?: string): Promise<Medication[]> {
    const { data } = await apiClient.get('/medications', {
      params: patientId ? { patientId } : undefined,
    });
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
    const { data } = await apiClient.post('/medications', payload);
    const med = data.data;

    try {
      await FirestoreClinicalService.addMedication(med);
    } catch (e) {
      console.warn('[Firestore] Registro local mantido, erro no Firestore:', e);
    }

    return med;
  },

  async updateMedicationStatus(id: string, status: string): Promise<Medication> {
    const { data } = await apiClient.patch(`/medications/${id}/status`, { status });

    try {
      await FirestoreClinicalService.updateMedicationStatus(id, status as any);
    } catch (e) {
      console.warn('[Firestore] Status local mantido, erro no Firestore:', e);
    }

    return data.data;
  },

  // Appointments
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    const { data } = await apiClient.get('/appointments', {
      params: patientId ? { patientId } : undefined,
    });
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
    const { data } = await apiClient.post('/appointments', payload);
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
    const { data } = await apiClient.get('/alerts', {
      params: {
        ...(patientId ? { patientId } : {}),
        ...(severity ? { severity } : {}),
      },
    });
    return data.data;
  },

  async resolveAlert(id: string): Promise<boolean> {
    const { data } = await apiClient.post(`/alerts/${id}/resolve`);
    try {
      await FirestoreClinicalService.resolveClinicalAlert(id);
    } catch (e) {
      console.warn('[Firestore] Alerta resolvido localmente, erro no Firestore:', e);
    }
    return data.success;
  },

  // Educational
  async getEducational(category?: string, type?: string): Promise<EducationalContent[]> {
    const { data } = await apiClient.get('/content/educational', {
      params: {
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
      },
    });
    return data.data;
  },

  // Doctor Portal
  async getDoctorDashboard(): Promise<any> {
    const { data } = await apiClient.get('/doctor/dashboard');
    return data.data;
  },

  async getDoctorPatients(search?: string, risk?: string): Promise<Patient[]> {
    const { data } = await apiClient.get('/doctor/patients', {
      params: {
        ...(search ? { search } : {}),
        ...(risk ? { risk } : {}),
      },
    });
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
    const { data } = await apiClient.get(`/doctor/patients/${patientId}`);
    return data.data;
  },

  // Reports
  async getReport(patientId?: string): Promise<any> {
    const { data } = await apiClient.get('/reports/summary', {
      params: patientId ? { patientId } : undefined,
    });
    return data.data;
  },

  // Health
  async checkHealth(): Promise<any> {
    const { data } = await apiClient.get('/health');
    return data;
  },

  // Firebase Cloud Messaging (FCM) & Push Notifications
  async registerFCMToken(token: string, platform: string = 'web'): Promise<any> {
    const { data } = await apiClient.post('/notifications/register-token', { token, platform });
    return data;
  },

  async getNotifications(): Promise<{ data: any[]; unreadCount: number }> {
    const { data } = await apiClient.get('/notifications');
    return data;
  },

  async markNotificationAsRead(id: string): Promise<any> {
    const { data } = await apiClient.post(`/notifications/${id}/read`);
    return data;
  },

  async markAllNotificationsAsRead(): Promise<any> {
    const { data } = await apiClient.post('/notifications/read-all');
    return data;
  },

  async testMedicationReminder(): Promise<any> {
    const { data } = await apiClient.post('/notifications/test-medication');
    return data;
  },

  async testCriticalReading(type: 'PRESSURE' | 'GLUCOSE' = 'PRESSURE'): Promise<any> {
    const { data } = await apiClient.post('/notifications/test-critical-reading', { type });
    return data;
  },

  async getFCMConfig(): Promise<any> {
    const { data } = await apiClient.get('/notifications/fcm-config');
    return data;
  },
};
