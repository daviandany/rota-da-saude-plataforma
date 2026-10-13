import { getDatabase } from '../db/database.js';
import { Medication, Appointment, ClinicalAlert } from '../domain/entities.js';

export class MedicationService {
  static async getByPatient(patientId: string) {
    const db = await getDatabase();
    return db.getMedications(patientId);
  }

  static async getAll() {
    const db = await getDatabase();
    if (db.getAllMedications) {
      return db.getAllMedications();
    }
    const patients = await db.getAllPatients();
    const lists = await Promise.all(patients.map((p) => db.getMedications(p.id)));
    const map = new Map<string, Medication>();
    lists.flat().forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }

  static async add(data: {
    patientId: string;
    patientName?: string;
    patientEmail?: string;
    name: string;
    dosage: string;
    frequency: string;
    reminderTimes: string[];
    notes?: string;
    addedByRole?: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN';
    prescribedBy?: string;
  }) {
    const db = await getDatabase();
    const patient = await db.getPatientById(data.patientId);
    const newMed: Medication = {
      id: 'med-' + Date.now(),
      patientId: data.patientId,
      patientName: data.patientName || patient?.name || 'Paciente SUS',
      patientEmail: data.patientEmail || patient?.email || undefined,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      reminderTimes: data.reminderTimes || ['08:00'],
      status: 'ATIVO',
      notes: data.notes,
      addedByRole: data.addedByRole || 'PATIENT',
      prescribedBy: data.prescribedBy,
      createdAt: new Date().toISOString(),
    };
    return db.addMedication(newMed);
  }

  static async update(
    medicationId: string,
    data: {
      name?: string;
      dosage?: string;
      frequency?: string;
      reminderTimes?: string[];
      notes?: string;
      status?: 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO';
    },
    actorRole?: 'PATIENT' | 'PROFESSIONAL' | 'ADMIN'
  ) {
    const db = await getDatabase();
    return db.updateMedication(medicationId, data);
  }

  static async delete(medicationId: string) {
    const db = await getDatabase();
    return db.deleteMedication(medicationId);
  }

  static async updateStatus(medicationId: string, status: 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO') {
    const db = await getDatabase();
    return db.updateMedication(medicationId, { status });
  }
}

export class AppointmentService {
  static async getByPatientOrAll(patientId?: string) {
    const db = await getDatabase();
    return db.getAppointments(patientId);
  }

  static async create(data: {
    patientId: string;
    professionalId?: string;
    patientName: string;
    patientAge?: number;
    patientConditions?: string[];
    appointmentType: string;
    scheduledFor: string;
    clinicName: string;
    doctorName: string;
    notes?: string;
  }) {
    const db = await getDatabase();
    const app: Appointment = {
      id: 'app-' + Date.now(),
      patientId: data.patientId,
      professionalId: data.professionalId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientConditions: data.patientConditions,
      appointmentType: data.appointmentType,
      scheduledFor: data.scheduledFor,
      clinicName: data.clinicName,
      doctorName: data.doctorName,
      status: 'AGENDADA',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    return db.addAppointment(app);
  }
}

export class AlertService {
  static async getAlerts(patientId?: string, severity?: string) {
    const db = await getDatabase();
    let alerts = await db.getAlerts(patientId);
    if (severity && severity !== 'TODOS') {
      const sevNorm = severity.toUpperCase();
      alerts = alerts.filter((a) => a.severity === sevNorm);
    }
    return alerts;
  }

  static async create(data: {
    patientId: string;
    patientName: string;
    patientAge?: number;
    patientConditions?: string[];
    severity: 'CRITICO' | 'ATENCAO' | 'INFO';
    title: string;
    message: string;
    valueRecorded?: string;
    metricType?: 'PRESSURE' | 'GLUCOSE' | 'MEDICATION';
  }) {
    const db = await getDatabase();
    const patient = await db.getPatientById(data.patientId);
    const alert: ClinicalAlert = {
      id: 'alt-' + Date.now(),
      patientId: data.patientId,
      patientName: patient?.name || data.patientName || 'Paciente',
      patientAge: patient?.age || data.patientAge || 55,
      patientConditions: patient?.conditions || data.patientConditions || ['HAS'],
      severity: data.severity || 'ATENCAO',
      title: data.title,
      message: data.message,
      valueRecorded: data.valueRecorded || 'Avaliação Médica',
      metricType: data.metricType || 'PRESSURE',
      status: 'PENDENTE',
      triggeredAt: new Date().toISOString(),
    };
    return db.addAlert(alert);
  }

  static async resolve(alertId: string) {
    const db = await getDatabase();
    return db.resolveAlert(alertId);
  }
}

export class ContentService {
  static async getEducational(category?: string, type?: string) {
    const db = await getDatabase();
    let items = await db.getEducationalContent();
    if (category && category !== 'TODOS') {
      items = items.filter((c) => c.category === category.toUpperCase());
    }
    if (type && type !== 'TODOS') {
      items = items.filter((c) => c.type === type.toUpperCase());
    }
    return items;
  }
}
