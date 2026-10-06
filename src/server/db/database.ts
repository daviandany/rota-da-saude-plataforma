import pg from 'pg';
import { config } from '../config/index.js';
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

const { Pool } = pg;

// Database Adapter Interface
export interface IDatabase {
  isPostgres: boolean;
  init(): Promise<void>;
  
  // Users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<boolean>;

  // Patients
  getPatientByUserId(userId: string): Promise<Patient | null>;
  getPatientById(id: string): Promise<Patient | null>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: Patient): Promise<Patient>;
  updatePatient(id: string, data: Partial<Patient>): Promise<Patient | null>;

  // Professionals
  getProfessionalByUserId(userId: string): Promise<Professional | null>;
  getProfessionalById(id: string): Promise<Professional | null>;
  createProfessional(professional: Professional): Promise<Professional>;

  // Blood Pressure
  getBloodPressureRecords(patientId: string): Promise<BloodPressureRecord[]>;
  addBloodPressureRecord(record: BloodPressureRecord): Promise<BloodPressureRecord>;

  // Glucose
  getGlucoseRecords(patientId: string): Promise<GlucoseRecord[]>;
  addGlucoseRecord(record: GlucoseRecord): Promise<GlucoseRecord>;

  // Medications
  getMedications(patientId: string): Promise<Medication[]>;
  addMedication(medication: Medication): Promise<Medication>;
  updateMedication(id: string, data: Partial<Medication>): Promise<Medication | null>;

  // Appointments
  getAppointments(patientId?: string): Promise<Appointment[]>;
  addAppointment(appointment: Appointment): Promise<Appointment>;

  // Alerts
  getAlerts(patientId?: string): Promise<ClinicalAlert[]>;
  addAlert(alert: ClinicalAlert): Promise<ClinicalAlert>;
  resolveAlert(id: string): Promise<boolean>;

  // Educational
  getEducationalContent(): Promise<EducationalContent[]>;
}

// Memory implementation with seed data
class InMemoryDatabase implements IDatabase {
  public isPostgres = false;
  private users: User[] = [...initialUsers];
  private professionals: Professional[] = [...initialProfessionals];
  private patients: Patient[] = [...initialPatients];
  private bpRecords: BloodPressureRecord[] = [];
  private glucoseRecords: GlucoseRecord[] = [];
  private medications: Medication[] = [];
  private appointments: Appointment[] = [];
  private alerts: ClinicalAlert[] = [];
  private educational: EducationalContent[] = [...initialEducationalContents];

  async init(): Promise<void> {
    console.log('[DB] In-Memory Persistence Layer initialized with clean dynamic data store.');
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async createUser(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  }

  async getPatientByUserId(userId: string): Promise<Patient | null> {
    return this.patients.find((p) => p.userId === userId) || null;
  }

  async getPatientById(id: string): Promise<Patient | null> {
    return this.patients.find((p) => p.id === id) || null;
  }

  async getAllPatients(): Promise<Patient[]> {
    return [...this.patients];
  }

  async createPatient(patient: Patient): Promise<Patient> {
    this.patients.push(patient);
    return patient;
  }

  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient | null> {
    const idx = this.patients.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.patients[idx] = { ...this.patients[idx], ...data };
    return this.patients[idx];
  }

  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    return this.professionals.find((p) => p.userId === userId) || null;
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    return this.professionals.find((p) => p.id === id) || null;
  }

  async createProfessional(professional: Professional): Promise<Professional> {
    this.professionals.push(professional);
    return professional;
  }

  async getBloodPressureRecords(patientId: string): Promise<BloodPressureRecord[]> {
    return this.bpRecords
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  async addBloodPressureRecord(record: BloodPressureRecord): Promise<BloodPressureRecord> {
    this.bpRecords.unshift(record);
    return record;
  }

  async getGlucoseRecords(patientId: string): Promise<GlucoseRecord[]> {
    return this.glucoseRecords
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  async addGlucoseRecord(record: GlucoseRecord): Promise<GlucoseRecord> {
    this.glucoseRecords.unshift(record);
    return record;
  }

  async getMedications(patientId: string): Promise<Medication[]> {
    return this.medications.filter((m) => m.patientId === patientId);
  }

  async addMedication(medication: Medication): Promise<Medication> {
    this.medications.push(medication);
    return medication;
  }

  async updateMedication(id: string, data: Partial<Medication>): Promise<Medication | null> {
    const idx = this.medications.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.medications[idx] = { ...this.medications[idx], ...data };
    return this.medications[idx];
  }

  async getAppointments(patientId?: string): Promise<Appointment[]> {
    if (patientId) {
      return this.appointments
        .filter((a) => a.patientId === patientId)
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    }
    return [...this.appointments].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }

  async addAppointment(appointment: Appointment): Promise<Appointment> {
    this.appointments.push(appointment);
    return appointment;
  }

  async getAlerts(patientId?: string): Promise<ClinicalAlert[]> {
    if (patientId) {
      return this.alerts
        .filter((a) => a.patientId === patientId)
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
    }
    return [...this.alerts].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  async addAlert(alert: ClinicalAlert): Promise<ClinicalAlert> {
    this.alerts.unshift(alert);
    return alert;
  }

  async resolveAlert(id: string): Promise<boolean> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'RESOLVIDO';
      return true;
    }
    return false;
  }

  async getEducationalContent(): Promise<EducationalContent[]> {
    return [...this.educational];
  }
}

// PostgreSQL Implementation
class PostgresDatabase implements IDatabase {
  public isPostgres = true;
  private pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  async init(): Promise<void> {
    console.log('[DB] Connecting to PostgreSQL and verifying tables...');
    // Create tables if they do not exist
    await this.pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(20) NOT NULL,
        conditions TEXT[] NOT NULL DEFAULT '{}',
        risk_level VARCHAR(20) NOT NULL,
        healthcare_unit VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        adherence_rate INT DEFAULT 85,
        phone VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS professionals (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        crm VARCHAR(50) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        healthcare_unit VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blood_pressure_records (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL,
        systolic INT NOT NULL,
        diastolic INT NOT NULL,
        pulse INT NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        is_critical BOOLEAN DEFAULT FALSE,
        status_text VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS glucose_records (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL,
        glucose_value INT NOT NULL,
        moment VARCHAR(50) NOT NULL,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        is_critical BOOLEAN DEFAULT FALSE,
        status_text VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medications (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        reminder_times TEXT[] NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL,
        professional_id VARCHAR(64),
        patient_name VARCHAR(255) NOT NULL,
        patient_conditions TEXT[],
        patient_age INT,
        appointment_type VARCHAR(100) NOT NULL,
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        clinic_name VARCHAR(255) NOT NULL,
        doctor_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'AGENDADA',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clinical_alerts (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        patient_age INT,
        patient_conditions TEXT[],
        severity VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        value_recorded VARCHAR(100),
        metric_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS educational_contents (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        statement TEXT NOT NULL,
        explanation TEXT NOT NULL,
        source VARCHAR(255)
      );
    `);

    // Check if seeded, if empty insert initial seed data
    const userCountRes = await this.pool.query('SELECT count(*) FROM users');
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      console.log('[DB] Seeding PostgreSQL database with initial medical data...');
      for (const u of initialUsers) {
        await this.createUser(u);
      }
      for (const p of initialPatients) {
        await this.createPatient(p);
      }
      for (const p of initialProfessionals) {
        await this.pool.query(
          `INSERT INTO professionals (id, user_id, name, email, crm, specialty, healthcare_unit, avatar_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [p.id, p.userId, p.name, p.email, p.crm, p.specialty, p.healthcareUnit, p.avatarUrl, p.createdAt]
        );
      }
      for (const bp of initialBloodPressure) {
        await this.addBloodPressureRecord(bp);
      }
      for (const g of initialGlucose) {
        await this.addGlucoseRecord(g);
      }
      for (const m of initialMedications) {
        await this.addMedication(m);
      }
      for (const a of initialAppointments) {
        await this.addAppointment(a);
      }
      for (const al of initialAlerts) {
        await this.addAlert(al);
      }
      for (const ed of initialEducationalContents) {
        await this.pool.query(
          `INSERT INTO educational_contents (id, type, category, title, statement, explanation, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ed.id, ed.type, ed.category, ed.title, ed.statement, ed.explanation, ed.source]
        );
      }
      console.log('[DB] PostgreSQL seeded successfully.');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
    };
  }

  async createUser(user: User): Promise<User> {
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.email, user.passwordHash, user.name, user.role, user.createdAt]
    );
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const res = await this.pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async getPatientByUserId(userId: string): Promise<Patient | null> {
    const res = await this.pool.query('SELECT * FROM patients WHERE user_id = $1', [userId]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      age: r.age,
      gender: r.gender,
      conditions: r.conditions,
      riskLevel: r.risk_level,
      healthcareUnit: r.healthcare_unit,
      avatarUrl: r.avatar_url,
      adherenceRate: r.adherence_rate,
      phone: r.phone,
      createdAt: r.created_at,
    };
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const res = await this.pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      age: r.age,
      gender: r.gender,
      conditions: r.conditions,
      riskLevel: r.risk_level,
      healthcareUnit: r.healthcare_unit,
      avatarUrl: r.avatar_url,
      adherenceRate: r.adherence_rate,
      phone: r.phone,
      createdAt: r.created_at,
    };
  }

  async getAllPatients(): Promise<Patient[]> {
    const res = await this.pool.query('SELECT * FROM patients ORDER BY name ASC');
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      age: r.age,
      gender: r.gender,
      conditions: r.conditions,
      riskLevel: r.risk_level,
      healthcareUnit: r.healthcare_unit,
      avatarUrl: r.avatar_url,
      adherenceRate: r.adherence_rate,
      phone: r.phone,
      createdAt: r.created_at,
    }));
  }

  async createPatient(p: Patient): Promise<Patient> {
    await this.pool.query(
      `INSERT INTO patients (id, user_id, name, email, age, gender, conditions, risk_level, healthcare_unit, avatar_url, adherence_rate, phone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        p.id,
        p.userId,
        p.name,
        p.email,
        p.age,
        p.gender,
        p.conditions,
        p.riskLevel,
        p.healthcareUnit,
        p.avatarUrl,
        p.adherenceRate,
        p.phone,
        p.createdAt,
      ]
    );
    return p;
  }

  async updatePatient(id: string, data: Partial<Patient>): Promise<Patient | null> {
    const current = await this.getPatientById(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    await this.pool.query(
      `UPDATE patients SET name = $1, age = $2, risk_level = $3, adherence_rate = $4, conditions = $5 WHERE id = $6`,
      [updated.name, updated.age, updated.riskLevel, updated.adherenceRate, updated.conditions, id]
    );
    return updated;
  }

  async getProfessionalByUserId(userId: string): Promise<Professional | null> {
    const res = await this.pool.query('SELECT * FROM professionals WHERE user_id = $1', [userId]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      crm: r.crm,
      specialty: r.specialty,
      healthcareUnit: r.healthcare_unit,
      avatarUrl: r.avatar_url,
      createdAt: r.created_at,
    };
  }

  async getProfessionalById(id: string): Promise<Professional | null> {
    const res = await this.pool.query('SELECT * FROM professionals WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      crm: r.crm,
      specialty: r.specialty,
      healthcareUnit: r.healthcare_unit,
      avatarUrl: r.avatar_url,
      createdAt: r.created_at,
    };
  }

  async createProfessional(p: Professional): Promise<Professional> {
    await this.pool.query(
      `INSERT INTO professionals (id, user_id, name, email, crm, specialty, healthcare_unit, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        p.id,
        p.userId,
        p.name,
        p.email,
        p.crm,
        p.specialty,
        p.healthcareUnit,
        p.avatarUrl || null,
        p.createdAt || new Date().toISOString(),
      ]
    );
    return p;
  }

  async getBloodPressureRecords(patientId: string): Promise<BloodPressureRecord[]> {
    const res = await this.pool.query(
      'SELECT * FROM blood_pressure_records WHERE patient_id = $1 ORDER BY recorded_at DESC',
      [patientId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse,
      recordedAt: r.recorded_at,
      notes: r.notes,
      isCritical: r.is_critical,
      statusText: r.status_text,
      createdAt: r.created_at,
    }));
  }

  async addBloodPressureRecord(bp: BloodPressureRecord): Promise<BloodPressureRecord> {
    await this.pool.query(
      `INSERT INTO blood_pressure_records (id, patient_id, systolic, diastolic, pulse, recorded_at, notes, is_critical, status_text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        bp.id,
        bp.patientId,
        bp.systolic,
        bp.diastolic,
        bp.pulse,
        bp.recordedAt,
        bp.notes,
        bp.isCritical,
        bp.statusText,
        bp.createdAt,
      ]
    );
    return bp;
  }

  async getGlucoseRecords(patientId: string): Promise<GlucoseRecord[]> {
    const res = await this.pool.query(
      'SELECT * FROM glucose_records WHERE patient_id = $1 ORDER BY recorded_at DESC',
      [patientId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      glucoseValue: r.glucose_value,
      moment: r.moment,
      recordedAt: r.recorded_at,
      notes: r.notes,
      isCritical: r.is_critical,
      statusText: r.status_text,
      createdAt: r.created_at,
    }));
  }

  async addGlucoseRecord(g: GlucoseRecord): Promise<GlucoseRecord> {
    await this.pool.query(
      `INSERT INTO glucose_records (id, patient_id, glucose_value, moment, recorded_at, notes, is_critical, status_text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        g.id,
        g.patientId,
        g.glucoseValue,
        g.moment,
        g.recordedAt,
        g.notes,
        g.isCritical,
        g.statusText,
        g.createdAt,
      ]
    );
    return g;
  }

  async getMedications(patientId: string): Promise<Medication[]> {
    const res = await this.pool.query('SELECT * FROM medications WHERE patient_id = $1', [patientId]);
    return res.rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      name: r.name,
      dosage: r.dosage,
      frequency: r.frequency,
      reminderTimes: r.reminder_times,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async addMedication(m: Medication): Promise<Medication> {
    await this.pool.query(
      `INSERT INTO medications (id, patient_id, name, dosage, frequency, reminder_times, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [m.id, m.patientId, m.name, m.dosage, m.frequency, m.reminderTimes, m.status, m.notes, m.createdAt]
    );
    return m;
  }

  async updateMedication(id: string, data: Partial<Medication>): Promise<Medication | null> {
    const res = await this.pool.query('SELECT * FROM medications WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const current = res.rows[0];
    const status = data.status || current.status;
    await this.pool.query('UPDATE medications SET status = $1 WHERE id = $2', [status, id]);
    return { ...current, status };
  }

  async getAppointments(patientId?: string): Promise<Appointment[]> {
    const query = patientId
      ? 'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY scheduled_for ASC'
      : 'SELECT * FROM appointments ORDER BY scheduled_for ASC';
    const params = patientId ? [patientId] : [];
    const res = await this.pool.query(query, params);
    return res.rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      professionalId: r.professional_id,
      patientName: r.patient_name,
      patientConditions: r.patient_conditions,
      patientAge: r.patient_age,
      appointmentType: r.appointment_type,
      scheduledFor: r.scheduled_for,
      clinicName: r.clinic_name,
      doctorName: r.doctor_name,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  async addAppointment(a: Appointment): Promise<Appointment> {
    await this.pool.query(
      `INSERT INTO appointments (id, patient_id, professional_id, patient_name, patient_conditions, patient_age, appointment_type, scheduled_for, clinic_name, doctor_name, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        a.id,
        a.patientId,
        a.professionalId,
        a.patientName,
        a.patientConditions,
        a.patientAge,
        a.appointmentType,
        a.scheduledFor,
        a.clinicName,
        a.doctorName,
        a.status,
        a.notes,
        a.createdAt,
      ]
    );
    return a;
  }

  async getAlerts(patientId?: string): Promise<ClinicalAlert[]> {
    const query = patientId
      ? 'SELECT * FROM clinical_alerts WHERE patient_id = $1 ORDER BY triggered_at DESC'
      : 'SELECT * FROM clinical_alerts ORDER BY triggered_at DESC';
    const params = patientId ? [patientId] : [];
    const res = await this.pool.query(query, params);
    return res.rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      patientAge: r.patient_age,
      patientConditions: r.patient_conditions,
      severity: r.severity,
      title: r.title,
      message: r.message,
      valueRecorded: r.value_recorded,
      metricType: r.metric_type,
      status: r.status,
      triggeredAt: r.triggered_at,
    }));
  }

  async addAlert(al: ClinicalAlert): Promise<ClinicalAlert> {
    await this.pool.query(
      `INSERT INTO clinical_alerts (id, patient_id, patient_name, patient_age, patient_conditions, severity, title, message, value_recorded, metric_type, status, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        al.id,
        al.patientId,
        al.patientName,
        al.patientAge,
        al.patientConditions,
        al.severity,
        al.title,
        al.message,
        al.valueRecorded,
        al.metricType,
        al.status,
        al.triggeredAt,
      ]
    );
    return al;
  }

  async resolveAlert(id: string): Promise<boolean> {
    const res = await this.pool.query("UPDATE clinical_alerts SET status = 'RESOLVIDO' WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async getEducationalContent(): Promise<EducationalContent[]> {
    const res = await this.pool.query('SELECT * FROM educational_contents ORDER BY id ASC');
    return res.rows.map((r) => ({
      id: r.id,
      type: r.type,
      category: r.category,
      title: r.title,
      statement: r.statement,
      explanation: r.explanation,
      source: r.source,
    }));
  }
}

import { SupabaseAdapter } from './supabaseAdapter.js';

// Database Singleton Factory with Auto-Detection & Fallback
let databaseInstance: IDatabase;

export async function getDatabase(): Promise<IDatabase> {
  if (databaseInstance) return databaseInstance;

  // 1. Try Supabase REST/SDK if configured
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('xyzcompany.supabase.co')) {
    try {
      const supaDb = new SupabaseAdapter(supabaseUrl, supabaseServiceKey);
      await supaDb.init();
      console.log('[DB] Conectado com sucesso ao Supabase (Cloud PostgreSQL).');
      databaseInstance = supaDb;
      return databaseInstance;
    } catch (err: any) {
      console.warn('[DB] Tentativa de conexão via Supabase SDK falhou:', err.message);
    }
  }

  // 2. Try PostgreSQL Connection String (Direct or Supabase PG Pooler)
  const dbUrl = config.database.url;
  if (dbUrl && !dbUrl.includes('localhost')) {
    try {
      const pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 3000,
        ssl: dbUrl.includes('neon') || dbUrl.includes('supabase') || dbUrl.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Quick test query
      const client = await pool.connect();
      client.release();

      const pgDb = new PostgresDatabase(pool);
      await pgDb.init();
      console.log('[DB] Successfully connected to PostgreSQL instance.');
      databaseInstance = pgDb;
      return databaseInstance;
    } catch (err: any) {
      console.warn('[DB] PostgreSQL connection attempt failed:', err.message);
      console.warn('[DB] Falling back to robust in-memory database with preloaded seed data.');
    }
  }

  // 3. Default robust in-memory persistence
  const memoryDb = new InMemoryDatabase();
  await memoryDb.init();
  databaseInstance = memoryDb;
  return databaseInstance;
}
