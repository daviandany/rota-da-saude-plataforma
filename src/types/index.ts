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
  name: string;
  role: UserRole;
  profileId: string;
  avatarUrl?: string;
  isGoogleAuth?: boolean;
  firebaseUid?: string;
  profile?: any;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  conditions: string[];
  riskLevel: RiskLevel;
  healthcareUnit: string;
  avatarUrl?: string;
  adherenceRate: number;
  phone?: string;
  latestBP?: string;
  latestGlucose?: string;
  lastMeasuredAt?: string;
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
}

export interface BloodPressureRecord {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  recordedAt: string;
  notes?: string;
  isCritical: boolean;
  statusText?: string;
}

export interface GlucoseRecord {
  id: string;
  patientId: string;
  glucoseValue: number;
  moment: GlucoseMoment;
  recordedAt: string;
  notes?: string;
  isCritical: boolean;
  statusText?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderTimes: string[];
  status: 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO';
  notes?: string;
  addedByRole?: UserRole;
  prescribedBy?: string;
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

export interface PatientSummary {
  patient: Patient;
  latestBP?: {
    systolic: number;
    diastolic: number;
    pulse: number;
    statusText: string;
    recordedAt: string;
  } | null;
  latestGlucose?: {
    value: number;
    moment: GlucoseMoment;
    statusText: string;
    recordedAt: string;
  } | null;
  nextMedication?: {
    name: string;
    dosage: string;
    time: string;
  } | null;
  nextAppointment?: {
    date: string;
    clinic: string;
    doctor: string;
    type: string;
  } | null;
  healthStatus: {
    percentage: number;
    message: string;
    adherenceRate: number;
  };
  pendingAlertsCount: number;
}
