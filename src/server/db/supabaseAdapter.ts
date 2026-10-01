import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from './database';
import {
  User,
  Patient,
  Professional,
  BloodPressureRecord,
  GlucoseRecord,
  Medication,
  Appointment,
  ClinicalAlert,
  EducationalContent,
} from '../domain/entities';

export class SupabaseAdapter implements IDatabase {
  public isPostgres = true;
  private client: SupabaseClient | null = null;
  private isReady = false;

  constructor(
    private supabaseUrl: string,
    private serviceKey: string
  ) {
    if (supabaseUrl && serviceKey) {
      this.client = createClient(supabaseUrl, serviceKey);
    }
  }

  async init(): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client não configurado (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente).');
    }
    const { error } = await this.client.from('users').select('id').limit(1);
    if (error) {
      throw new Error(`Falha ao conectar no Supabase: ${error.message}`);
    }
    this.isReady = true;
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      name: data.name,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async createUser(user: User): Promise<User> {
    if (!this.client) throw new Error('Supabase indisponível');
    const { error } = await this.client.from('users').insert({
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      name: user.name,
      role: user.role,
      created_at: user.createdAt,
    });

    if (error) throw new Error(error.message);
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);
    return !error;
  }

  // Patients
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      age: data.age,
      gender: data.gender,
      conditions: data.conditions,
      riskLevel: data.risk_level,
      healthcareUnit: data.healthcare_unit,
      avatarUrl: data.avatar_url,
      adherenceRate: data.adherence_rate,
      phone: data.phone,
      createdAt: data.created_at,
    };
  }

  async getPatientById(id: string): Promise<Patient | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      age: data.age,
      gender: data.gender,
      conditions: data.conditions,
      riskLevel: data.risk_level,
      healthcareUnit: data.healthcare_unit,
      avatarUrl: data.avatar_url,
      adherenceRate: data.adherence_rate,
      phone: data.phone,
      createdAt: data.created_at,
    };
  }

  async getAllPatients(): Promise<Patient[]> {
    if (!this.client) return [];
    const { data, error } = await this.client.from('patients').select('*').order('name');
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      name: d.name,
      email: d.email,
      age: d.age,
      gender: d.gender,
      conditions: d.conditions,
      riskLevel: d.risk_level,
      healthcareUnit: d.healthcare_unit,
      avatarUrl: d.avatar_url,
      adherenceRate: d.adherence_rate,
      phone: d.phone,
      createdAt: d.created_at,
    }));
  }

  async createPatient(patient: Patient): Promise<Patient> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('patients').insert({
      id: patient.id,
      user_id: patient.userId,
      name: patient.name,
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      conditions: patient.conditions,
      risk_level: patient.riskLevel,
      healthcare_unit: patient.healthcareUnit,
      avatar_url: patient.avatarUrl,
      adherence_rate: patient.adherenceRate,
      phone: patient.phone,
      created_at: patient.createdAt,
    });
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<Patient>): Promise<Patient | null> {
    if (!this.client) return null;
    await this.client.from('patients').update(updateData).eq('id', id);
    return this.getPatientById(id);
  }

  // Professionals
  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('professionals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      crm: data.crm,
      specialty: data.specialty,
      healthcareUnit: data.healthcare_unit,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    if (!this.client) return null;
    const { data, error } = await this.client
      .from('professionals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      crm: data.crm,
      specialty: data.specialty,
      healthcareUnit: data.healthcare_unit,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };
  }

  async createProfessional(professional: Professional): Promise<Professional> {
    if (!this.client) return professional;
    await this.client.from('professionals').insert({
      id: professional.id,
      user_id: professional.userId,
      name: professional.name,
      email: professional.email,
      crm: professional.crm,
      specialty: professional.specialty,
      healthcare_unit: professional.healthcareUnit,
      avatar_url: professional.avatarUrl,
      created_at: professional.createdAt,
    });
    return professional;
  }

  // Blood Pressure
  async getBloodPressureRecords(patientId: string): Promise<BloodPressureRecord[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('blood_pressure_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      systolic: d.systolic,
      diastolic: d.diastolic,
      pulse: d.pulse,
      recordedAt: d.recorded_at,
      notes: d.notes,
      isCritical: d.is_critical,
      statusText: d.status_text,
      createdAt: d.created_at,
    }));
  }

  async addBloodPressureRecord(record: BloodPressureRecord): Promise<BloodPressureRecord> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('blood_pressure_records').insert({
      id: record.id,
      patient_id: record.patientId,
      systolic: record.systolic,
      diastolic: record.diastolic,
      pulse: record.pulse,
      recorded_at: record.recordedAt,
      notes: record.notes,
      is_critical: record.isCritical,
      status_text: record.statusText,
      created_at: record.createdAt,
    });
    return record;
  }

  // Glucose
  async getGlucoseRecords(patientId: string): Promise<GlucoseRecord[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('glucose_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      glucoseValue: d.glucose_value,
      moment: d.moment,
      recordedAt: d.recorded_at,
      notes: d.notes,
      isCritical: d.is_critical,
      statusText: d.status_text,
      createdAt: d.created_at,
    }));
  }

  async addGlucoseRecord(record: GlucoseRecord): Promise<GlucoseRecord> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('glucose_records').insert({
      id: record.id,
      patient_id: record.patientId,
      glucose_value: record.glucoseValue,
      moment: record.moment,
      recorded_at: record.recordedAt,
      notes: record.notes,
      is_critical: record.isCritical,
      status_text: record.statusText,
      created_at: record.createdAt,
    });
    return record;
  }

  // Medications
  async getMedications(patientId: string): Promise<Medication[]> {
    if (!this.client) return [];
    const { data, error } = await this.client
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      name: d.name,
      dosage: d.dosage,
      frequency: d.frequency,
      reminderTimes: d.reminder_times || ['08:00'],
      status: (d.is_active ? 'ATIVO' : 'SUSPENSO') as 'ATIVO' | 'SUSPENSO',
      notes: d.notes,
      createdAt: d.created_at,
    }));
  }

  async addMedication(medication: Medication): Promise<Medication> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('medications').insert({
      id: medication.id,
      patient_id: medication.patientId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      reminder_times: medication.reminderTimes,
      notes: medication.notes,
      is_active: medication.status === 'ATIVO',
      created_at: medication.createdAt,
    });
    return medication;
  }

  async updateMedication(id: string, data: Partial<Medication>): Promise<Medication | null> {
    if (!this.client) return null;
    await this.client.from('medications').update(data).eq('id', id);
    return null;
  }

  // Appointments
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    if (!this.client) return [];
    let query = this.client.from('appointments').select('*').order('scheduled_for', { ascending: true });
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      patientName: d.patient_name || 'Maria Silva',
      doctorName: d.doctor_name,
      clinicName: d.clinic_name,
      scheduledFor: d.scheduled_for,
      appointmentType: d.appointment_type,
      notes: d.notes,
      status: d.status,
      createdAt: d.created_at,
    }));
  }

  async addAppointment(appointment: Appointment): Promise<Appointment> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('appointments').insert({
      id: appointment.id,
      patient_id: appointment.patientId,
      doctor_name: appointment.doctorName,
      clinic_name: appointment.clinicName,
      scheduled_for: appointment.scheduledFor,
      appointment_type: appointment.appointmentType,
      notes: appointment.notes,
      status: appointment.status,
      created_at: appointment.createdAt,
    });
    return appointment;
  }

  // Alerts
  async getAlerts(patientId?: string): Promise<ClinicalAlert[]> {
    if (!this.client) return [];
    let query = this.client.from('clinical_alerts').select('*').order('triggered_at', { ascending: false });
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      patientName: d.patient_name,
      severity: d.severity,
      title: d.title,
      message: d.message,
      valueRecorded: d.value_recorded,
      metricType: d.metric_type,
      status: d.status,
      triggeredAt: d.triggered_at,
    }));
  }

  async addAlert(alert: ClinicalAlert): Promise<ClinicalAlert> {
    if (!this.client) throw new Error('Supabase indisponível');
    await this.client.from('clinical_alerts').insert({
      id: alert.id,
      patient_id: alert.patientId,
      patient_name: alert.patientName,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      value_recorded: alert.valueRecorded,
      metric_type: alert.metricType,
      status: alert.status,
      triggered_at: alert.triggeredAt,
      created_at: new Date().toISOString(),
    });
    return alert;
  }

  async resolveAlert(id: string): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client.from('clinical_alerts').update({ status: 'RESOLVIDO' }).eq('id', id);
    return !error;
  }

  // Educational
  async getEducationalContent(): Promise<EducationalContent[]> {
    if (!this.client) return [];
    const { data, error } = await this.client.from('educational_contents').select('*');
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      statement: d.statement,
      type: d.type,
      category: d.category,
      explanation: d.explanation,
      source: d.source,
    }));
  }
}
