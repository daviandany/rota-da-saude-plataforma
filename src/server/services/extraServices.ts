import { getDatabase } from '../db/database';
import { Medication, Appointment, ClinicalAlert } from '../domain/entities';

export class MedicationService {
  static async getByPatient(patientId: string) {
    const db = await getDatabase();
    return db.getMedications(patientId);
  }

  static async add(data: {
    patientId: string;
    name: string;
    dosage: string;
    frequency: string;
    reminderTimes: string[];
    notes?: string;
  }) {
    const db = await getDatabase();
    const newMed: Medication = {
      id: 'med-' + Date.now(),
      patientId: data.patientId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      reminderTimes: data.reminderTimes || ['08:00'],
      status: 'ATIVO',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    return db.addMedication(newMed);
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
