import { getDatabase } from '../db/database.js';
export class MedicationService {
    static async getByPatient(patientId) {
        const db = await getDatabase();
        return db.getMedications(patientId);
    }
    static async add(data) {
        const db = await getDatabase();
        const newMed = {
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
    static async updateStatus(medicationId, status) {
        const db = await getDatabase();
        return db.updateMedication(medicationId, { status });
    }
}
export class AppointmentService {
    static async getByPatientOrAll(patientId) {
        const db = await getDatabase();
        return db.getAppointments(patientId);
    }
    static async create(data) {
        const db = await getDatabase();
        const app = {
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
    static async getAlerts(patientId, severity) {
        const db = await getDatabase();
        let alerts = await db.getAlerts(patientId);
        if (severity && severity !== 'TODOS') {
            const sevNorm = severity.toUpperCase();
            alerts = alerts.filter((a) => a.severity === sevNorm);
        }
        return alerts;
    }
    static async resolve(alertId) {
        const db = await getDatabase();
        return db.resolveAlert(alertId);
    }
}
export class ContentService {
    static async getEducational(category, type) {
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
