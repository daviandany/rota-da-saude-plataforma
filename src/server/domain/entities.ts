export type UserRole = 'PATIENT' | 'PROFESSIONAL' | 'ADMIN';

export type RiskLevel = 'BAIXO' | 'MODERADO' | 'ALTO';

export type AlertSeverity = 'CRITICO' | 'ATENCAO' | 'INFO';

export type GlucoseMoment =
  | 'EM_JEJUM'
  | 'ANTES_ALMOCO'
  | 'APOS_ALMOCO'
  | 'ANTES_JANTAR'
  | 'APOS_JANTAR'
  | 'AO_DORMIR';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  conditions: string[]; // e.g. ['HAS', 'DM']
  riskLevel: RiskLevel;
  healthcareUnit: string;
  avatarUrl?: string;
  adherenceRate: number; // e.g. 85%
  phone?: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  userId: string;
  name: string;
  email: string;
  crm: string;
  specialty: string;
  healthcareUnit: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface BloodPressureRecord {
  id: string;
  patientId: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  recordedAt: string; // ISO
  notes?: string;
  isCritical: boolean;
  statusText?: string; // 'Normal', 'Elevada', 'Hipertensão Estágio 1', 'Crítica'
  createdAt: string;
}

export interface GlucoseRecord {
  id: string;
  patientId: string;
  glucoseValue: number; // mg/dL
  moment: GlucoseMoment;
  recordedAt: string; // ISO
  notes?: string;
  isCritical: boolean;
  statusText?: string; // 'Normal', 'Atenção', 'Crítica'
  createdAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderTimes: string[]; // e.g. ['08:00', '20:00']
  status: 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO';
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId?: string;
  patientName: string;
  patientConditions?: string[];
  patientAge?: number;
  appointmentType: string;
  scheduledFor: string;
  clinicName: string;
  doctorName: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  notes?: string;
  createdAt: string;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientConditions?: string[];
  severity: AlertSeverity;
  title: string;
  message: string;
  valueRecorded?: string;
  metricType: 'PRESSURE' | 'GLUCOSE' | 'MEDICATION';
  status: 'PENDENTE' | 'RESOLVIDO';
  triggeredAt: string;
}

export interface EducationalContent {
  id: string;
  type: 'MITO' | 'VERDADE';
  category: 'DIABETES' | 'PRESSAO' | 'TODOS';
  title: string;
  statement: string;
  explanation: string;
  source?: string;
}
