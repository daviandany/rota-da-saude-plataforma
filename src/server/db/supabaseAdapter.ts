import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabase } from './database.js';
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
} from '../domain/entities.js';
import {
  initialUsers,
  initialProfessionals,
  initialPatients,
  initialBloodPressure,
  initialGlucose,
  initialMedications,
  initialAppointments,
  initialAlerts,
  initialEducationalContents,
} from './seedData.js';

export class SupabaseAdapter implements IDatabase {
  public isPostgres = true;
  private client: SupabaseClient | null = null;
  private isReady = false;
  // Local fallback memory cache when Supabase RLS blocks unauthenticated or service writes
  private localUsers: Map<string, User> = new Map(initialUsers.map((u) => [u.id, u]));
  private localPatients: Map<string, Patient> = new Map(initialPatients.map((p) => [p.id, p]));
  private localProfessionals: Map<string, Professional> = new Map(
    initialProfessionals.map((p) => [p.id, p])
  );
  private localBP: Map<string, BloodPressureRecord> = new Map();
  private localGlucose: Map<string, GlucoseRecord> = new Map();
  private localMedications: Map<string, Medication> = new Map();
  private localAppointments: Map<string, Appointment> = new Map();
  private localAlerts: Map<string, ClinicalAlert> = new Map();

  constructor(
    private supabaseUrl: string,
    private serviceKey: string
  ) {
    if (supabaseUrl && serviceKey) {
      this.client = createClient(supabaseUrl, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'x-firebase-uid': 'system',
          },
        },
      });
    }
  }

  async init(): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client não configurado.');
    }
    const { data, error } = await this.client.from('users').select('id').limit(1);
    if (error) {
      throw new Error(`Falha ao conectar na tabela users do Supabase: ${error.message}`);
    }
    this.isReady = true;

    // Auto-seed de dados iniciais caso o banco Supabase esteja recém-criado e vazio
    if (!data || data.length === 0) {
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    if (!this.client) return;
    try {
      for (const u of initialUsers) {
        await this.client.from('users').upsert(
          {
            id: u.id,
            user_id: u.id,
            email: u.email,
            password_hash: u.passwordHash,
            name: u.name,
            role: u.role,
            created_at: u.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const p of initialProfessionals) {
        await this.client.from('professionals').upsert(
          {
            id: p.id,
            user_id: p.userId || p.id,
            name: p.name,
            email: p.email,
            crm: p.crm,
            specialty: p.specialty,
            healthcare_unit: p.healthcareUnit,
            avatar_url: p.avatarUrl,
            created_at: p.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const pat of initialPatients) {
        await this.client.from('patients').upsert(
          {
            id: pat.id,
            user_id: pat.userId || pat.id,
            name: pat.name,
            email: pat.email,
            age: pat.age,
            gender: pat.gender,
            conditions: pat.conditions,
            risk_level: pat.riskLevel,
            healthcare_unit: pat.healthcareUnit,
            avatar_url: pat.avatarUrl,
            adherence_rate: pat.adherenceRate,
            phone: pat.phone,
            created_at: pat.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const bp of initialBloodPressure) {
        await this.client.from('blood_pressure_records').upsert(
          {
            id: bp.id,
            user_id: bp.patientId,
            patient_id: bp.patientId,
            systolic: bp.systolic,
            diastolic: bp.diastolic,
            pulse: bp.pulse,
            recorded_at: bp.recordedAt,
            notes: bp.notes,
            is_critical: bp.isCritical,
            status_text: bp.statusText,
            created_at: bp.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const g of initialGlucose) {
        await this.client.from('glucose_records').upsert(
          {
            id: g.id,
            user_id: g.patientId,
            patient_id: g.patientId,
            glucose_value: g.glucoseValue,
            moment: g.moment,
            recorded_at: g.recordedAt,
            notes: g.notes,
            is_critical: g.isCritical,
            status_text: g.statusText,
            created_at: g.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const m of initialMedications) {
        await this.client.from('medications').upsert(
          {
            id: m.id,
            user_id: m.patientId,
            patient_id: m.patientId,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            reminder_times: m.reminderTimes,
            status: m.status,
            is_active: m.status === 'ATIVO',
            notes: m.notes,
            created_at: m.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const app of initialAppointments) {
        await this.client.from('appointments').upsert(
          {
            id: app.id,
            user_id: app.patientId,
            patient_id: app.patientId,
            professional_id: app.professionalId,
            patient_name: app.patientName,
            patient_age: app.patientAge,
            patient_conditions: app.patientConditions,
            doctor_name: app.doctorName,
            clinic_name: app.clinicName,
            scheduled_for: app.scheduledFor,
            appointment_type: app.appointmentType,
            notes: app.notes,
            status: app.status,
            created_at: app.createdAt,
          },
          { onConflict: 'id' }
        );
      }

      for (const al of initialAlerts) {
        await this.client.from('clinical_alerts').upsert(
          {
            id: al.id,
            user_id: al.patientId,
            patient_id: al.patientId,
            patient_name: al.patientName,
            patient_age: al.patientAge,
            patient_conditions: al.patientConditions,
            severity: al.severity,
            title: al.title,
            message: al.message,
            value_recorded: al.valueRecorded,
            metric_type: al.metricType,
            status: al.status,
            triggered_at: al.triggeredAt,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }

      for (const ed of initialEducationalContents) {
        await this.client.from('educational_contents').upsert(
          {
            id: ed.id,
            user_id: 'system',
            title: ed.title,
            statement: ed.statement,
            type: ed.type,
            category: ed.category,
            explanation: ed.explanation,
            source: ed.source,
          },
          { onConflict: 'id' }
        );
      }
      console.log('[Supabase] Dados clínicos iniciais populados com sucesso.');
    } catch (err: any) {
      console.warn('[Supabase] Aviso ao popular dados iniciais:', err.message);
    }
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    if (this.client) {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .ilike('email', normalized)
        .maybeSingle();

      if (!error && data) {
        const u: User = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          role: data.role,
          createdAt: data.created_at,
        };
        this.localUsers.set(u.id, u);
        return u;
      }
    }

    for (const u of this.localUsers.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const u: User = {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          role: data.role,
          createdAt: data.created_at,
        };
        this.localUsers.set(u.id, u);
        return u;
      }
    }
    return this.localUsers.get(id) || null;
  }

  async createUser(user: User): Promise<User> {
    this.localUsers.set(user.id, user);
    if (!this.client) return user;
    const { error } = await this.client.from('users').upsert(
      {
        id: user.id,
        user_id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        name: user.name,
        role: user.role,
        created_at: user.createdAt,
      },
      { onConflict: 'id' }
    );

    if (error) console.warn('[Supabase] createUser warning:', error.message);
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const existing = this.localUsers.get(userId);
    if (existing) {
      existing.passwordHash = passwordHash;
      this.localUsers.set(userId, existing);
    }
    if (!this.client) return Boolean(existing);
    const { error } = await this.client
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId);
    return !error || Boolean(existing);
  }

  // Patients
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const p: Patient = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          email: data.email,
          age: data.age,
          gender: data.gender,
          conditions: data.conditions || ['HAS'],
          riskLevel: data.risk_level,
          healthcareUnit: data.healthcare_unit,
          avatarUrl: data.avatar_url,
          adherenceRate: data.adherence_rate,
          phone: data.phone,
          createdAt: data.created_at,
        };
        this.localPatients.set(p.id, p);
        return p;
      }
    }
    for (const p of this.localPatients.values()) {
      if (p.userId === userId) return p;
    }
    return null;
  }

  async getPatientById(id: string): Promise<Patient | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('patients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const p: Patient = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          email: data.email,
          age: data.age,
          gender: data.gender,
          conditions: data.conditions || ['HAS'],
          riskLevel: data.risk_level,
          healthcareUnit: data.healthcare_unit,
          avatarUrl: data.avatar_url,
          adherenceRate: data.adherence_rate,
          phone: data.phone,
          createdAt: data.created_at,
        };
        this.localPatients.set(p.id, p);
        return p;
      }
    }
    return this.localPatients.get(id) || null;
  }

  async getAllPatients(): Promise<Patient[]> {
    if (this.client) {
      const { data, error } = await this.client.from('patients').select('*').order('name');
      if (!error && data && data.length > 0) {
        data.forEach((d: any) => {
          this.localPatients.set(d.id, {
            id: d.id,
            userId: d.user_id,
            name: d.name,
            email: d.email,
            age: d.age,
            gender: d.gender,
            conditions: d.conditions || ['HAS'],
            riskLevel: d.risk_level,
            healthcareUnit: d.healthcare_unit,
            avatarUrl: d.avatar_url,
            adherenceRate: d.adherence_rate,
            phone: d.phone,
            createdAt: d.created_at,
          });
        });
      }
    }
    return Array.from(this.localPatients.values());
  }

  async createPatient(patient: Patient): Promise<Patient> {
    this.localPatients.set(patient.id, patient);
    if (!this.client) return patient;
    await this.client.from('patients').upsert(
      {
        id: patient.id,
        user_id: patient.userId || patient.id,
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
      },
      { onConflict: 'id' }
    );
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<Patient>): Promise<Patient | null> {
    const existing = this.localPatients.get(id);
    if (existing) {
      this.localPatients.set(id, { ...existing, ...updateData });
    }
    if (!this.client) return this.localPatients.get(id) || null;
    const dbPatch: Record<string, any> = {};
    if (updateData.name !== undefined) dbPatch.name = updateData.name;
    if (updateData.email !== undefined) dbPatch.email = updateData.email;
    if (updateData.age !== undefined) dbPatch.age = updateData.age;
    if (updateData.gender !== undefined) dbPatch.gender = updateData.gender;
    if (updateData.conditions !== undefined) dbPatch.conditions = updateData.conditions;
    if (updateData.riskLevel !== undefined) dbPatch.risk_level = updateData.riskLevel;
    if (updateData.healthcareUnit !== undefined) dbPatch.healthcare_unit = updateData.healthcareUnit;
    if (updateData.avatarUrl !== undefined) dbPatch.avatar_url = updateData.avatarUrl;
    if (updateData.adherenceRate !== undefined) dbPatch.adherence_rate = updateData.adherenceRate;
    if (updateData.phone !== undefined) dbPatch.phone = updateData.phone;

    await this.client.from('patients').update(dbPatch).eq('id', id);
    return (await this.getPatientById(id)) || this.localPatients.get(id) || null;
  }

  // Professionals
  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        const prof: Professional = {
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
        this.localProfessionals.set(prof.id, prof);
        return prof;
      }
    }
    for (const prof of this.localProfessionals.values()) {
      if (prof.userId === userId) return prof;
    }
    return null;
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('professionals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const prof: Professional = {
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
        this.localProfessionals.set(prof.id, prof);
        return prof;
      }
    }
    return this.localProfessionals.get(id) || null;
  }

  async createProfessional(professional: Professional): Promise<Professional> {
    this.localProfessionals.set(professional.id, professional);
    if (!this.client) return professional;
    await this.client.from('professionals').upsert(
      {
        id: professional.id,
        user_id: professional.userId || professional.id,
        name: professional.name,
        email: professional.email,
        crm: professional.crm,
        specialty: professional.specialty,
        healthcare_unit: professional.healthcareUnit,
        avatar_url: professional.avatarUrl,
        created_at: professional.createdAt,
      },
      { onConflict: 'id' }
    );
    return professional;
  }

  // Blood Pressure
  async getBloodPressureRecords(patientId: string): Promise<BloodPressureRecord[]> {
    if (this.client && patientId) {
      const { data, error } = await this.client
        .from('blood_pressure_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (!error && data) {
        data.forEach((d: any) => {
          this.localBP.set(d.id, {
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
          });
        });
      }
    }

    return Array.from(this.localBP.values())
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  async addBloodPressureRecord(record: BloodPressureRecord): Promise<BloodPressureRecord> {
    this.localBP.set(record.id, record);
    if (!this.client) return record;
    await this.client.from('blood_pressure_records').upsert(
      {
        id: record.id,
        user_id: record.patientId,
        patient_id: record.patientId,
        systolic: record.systolic,
        diastolic: record.diastolic,
        pulse: record.pulse,
        recorded_at: record.recordedAt,
        notes: record.notes,
        is_critical: record.isCritical,
        status_text: record.statusText,
        created_at: record.createdAt,
      },
      { onConflict: 'id' }
    );
    return record;
  }

  // Glucose
  async getGlucoseRecords(patientId: string): Promise<GlucoseRecord[]> {
    if (this.client && patientId) {
      const { data, error } = await this.client
        .from('glucose_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (!error && data) {
        data.forEach((d: any) => {
          this.localGlucose.set(d.id, {
            id: d.id,
            patientId: d.patient_id,
            glucoseValue: d.glucose_value,
            moment: d.moment,
            recordedAt: d.recorded_at,
            notes: d.notes,
            isCritical: d.is_critical,
            statusText: d.status_text,
            createdAt: d.created_at,
          });
        });
      }
    }

    return Array.from(this.localGlucose.values())
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  async addGlucoseRecord(record: GlucoseRecord): Promise<GlucoseRecord> {
    this.localGlucose.set(record.id, record);
    if (!this.client) return record;
    await this.client.from('glucose_records').upsert(
      {
        id: record.id,
        user_id: record.patientId,
        patient_id: record.patientId,
        glucose_value: record.glucoseValue,
        moment: record.moment,
        recorded_at: record.recordedAt,
        notes: record.notes,
        is_critical: record.isCritical,
        status_text: record.statusText,
        created_at: record.createdAt,
      },
      { onConflict: 'id' }
    );
    return record;
  }

  // Medications
  async getMedications(patientId: string): Promise<Medication[]> {
    if (this.client && patientId) {
      const { data, error } = await this.client
        .from('medications')
        .select('*')
        .eq('patient_id', patientId);

      if (!error && data) {
        data.forEach((d: any) => {
          const prev = this.localMedications.get(d.id);
          this.localMedications.set(d.id, {
            id: d.id,
            patientId: d.patient_id,
            name: d.name,
            dosage: d.dosage,
            frequency: d.frequency,
            reminderTimes: d.reminder_times || ['08:00'],
            status: (d.status || (d.is_active ? 'ATIVO' : 'SUSPENSO')) as 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO',
            notes: d.notes,
            addedByRole: d.added_by_role || prev?.addedByRole || (d.notes?.includes('[Prescrito pelo Médico]') ? 'PROFESSIONAL' : 'PATIENT'),
            prescribedBy: d.prescribed_by || prev?.prescribedBy,
            createdAt: d.created_at,
          });
        });
      }
    }

    return Array.from(this.localMedications.values()).filter((m) => m.patientId === patientId);
  }

  async addMedication(medication: Medication): Promise<Medication> {
    this.localMedications.set(medication.id, medication);
    if (!this.client) return medication;
    await this.client.from('medications').upsert(
      {
        id: medication.id,
        user_id: medication.patientId,
        patient_id: medication.patientId,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        reminder_times: medication.reminderTimes,
        status: medication.status,
        notes: medication.notes,
        is_active: medication.status === 'ATIVO',
        created_at: medication.createdAt,
      },
      { onConflict: 'id' }
    );
    return medication;
  }

  async updateMedication(id: string, data: Partial<Medication>): Promise<Medication | null> {
    const existing = this.localMedications.get(id);
    if (existing) {
      this.localMedications.set(id, { ...existing, ...data });
    }
    if (!this.client) return this.localMedications.get(id) || null;
    const patch: Record<string, any> = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      patch.is_active = data.status === 'ATIVO';
    }
    if (data.name !== undefined) patch.name = data.name;
    if (data.dosage !== undefined) patch.dosage = data.dosage;
    if (data.frequency !== undefined) patch.frequency = data.frequency;
    if (data.reminderTimes !== undefined) patch.reminder_times = data.reminderTimes;
    if (data.notes !== undefined) patch.notes = data.notes;

    const { data: updated } = await this.client
      .from('medications')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!updated) return this.localMedications.get(id) || null;
    const prev = this.localMedications.get(id);
    const result: Medication = {
      id: updated.id,
      patientId: updated.patient_id,
      name: updated.name,
      dosage: updated.dosage,
      frequency: updated.frequency,
      reminderTimes: updated.reminder_times || ['08:00'],
      status: (updated.status || (updated.is_active ? 'ATIVO' : 'SUSPENSO')) as 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO',
      notes: updated.notes,
      addedByRole: prev?.addedByRole || 'PATIENT',
      prescribedBy: prev?.prescribedBy,
      createdAt: updated.created_at,
    };
    this.localMedications.set(result.id, result);
    return result;
  }

  // Appointments
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    if (this.client) {
      let query = this.client.from('appointments').select('*').order('scheduled_for', { ascending: true });
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      const { data, error } = await query;
      if (!error && data) {
        data.forEach((d: any) => {
          this.localAppointments.set(d.id, {
            id: d.id,
            patientId: d.patient_id,
            professionalId: d.professional_id,
            patientName: d.patient_name || 'Paciente',
            patientAge: d.patient_age,
            patientConditions: d.patient_conditions || [],
            doctorName: d.doctor_name,
            clinicName: d.clinic_name,
            scheduledFor: d.scheduled_for,
            appointmentType: d.appointment_type,
            notes: d.notes,
            status: d.status,
            createdAt: d.created_at,
          });
        });
      }
    }

    const all = Array.from(this.localAppointments.values());
    const filtered = patientId ? all.filter((a) => a.patientId === patientId) : all;
    return filtered.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  async addAppointment(appointment: Appointment): Promise<Appointment> {
    this.localAppointments.set(appointment.id, appointment);
    if (!this.client) return appointment;
    await this.client.from('appointments').upsert(
      {
        id: appointment.id,
        user_id: appointment.patientId,
        patient_id: appointment.patientId,
        professional_id: appointment.professionalId,
        patient_name: appointment.patientName,
        patient_age: appointment.patientAge,
        patient_conditions: appointment.patientConditions,
        doctor_name: appointment.doctorName,
        clinic_name: appointment.clinicName,
        scheduled_for: appointment.scheduledFor,
        appointment_type: appointment.appointmentType,
        notes: appointment.notes,
        status: appointment.status,
        created_at: appointment.createdAt,
      },
      { onConflict: 'id' }
    );
    return appointment;
  }

  // Alerts
  async getAlerts(patientId?: string): Promise<ClinicalAlert[]> {
    if (this.client) {
      let query = this.client.from('clinical_alerts').select('*').order('triggered_at', { ascending: false });
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      const { data, error } = await query;
      if (!error && data) {
        data.forEach((d: any) => {
          this.localAlerts.set(d.id, {
            id: d.id,
            patientId: d.patient_id,
            patientName: d.patient_name,
            patientAge: d.patient_age,
            patientConditions: d.patient_conditions || [],
            severity: d.severity,
            title: d.title,
            message: d.message,
            valueRecorded: d.value_recorded,
            metricType: d.metric_type,
            status: d.status,
            triggeredAt: d.triggered_at,
          });
        });
      }
    }

    const all = Array.from(this.localAlerts.values());
    const filtered = patientId ? all.filter((a) => a.patientId === patientId) : all;
    return filtered.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  async addAlert(alert: ClinicalAlert): Promise<ClinicalAlert> {
    this.localAlerts.set(alert.id, alert);
    if (!this.client) return alert;
    await this.client.from('clinical_alerts').upsert(
      {
        id: alert.id,
        user_id: alert.patientId,
        patient_id: alert.patientId,
        patient_name: alert.patientName,
        patient_age: alert.patientAge,
        patient_conditions: alert.patientConditions,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        value_recorded: alert.valueRecorded,
        metric_type: alert.metricType,
        status: alert.status,
        triggered_at: alert.triggeredAt,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return alert;
  }

  async resolveAlert(id: string): Promise<boolean> {
    const existing = this.localAlerts.get(id);
    if (existing) {
      existing.status = 'RESOLVIDO';
      this.localAlerts.set(id, existing);
    }
    if (!this.client) return Boolean(existing);
    const { error } = await this.client.from('clinical_alerts').update({ status: 'RESOLVIDO' }).eq('id', id);
    return !error || Boolean(existing);
  }

  // Educational
  async getEducationalContent(): Promise<EducationalContent[]> {
    if (!this.client) return initialEducationalContents;
    const { data, error } = await this.client.from('educational_contents').select('*');
    if (error || !data || data.length === 0) return initialEducationalContents;
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
