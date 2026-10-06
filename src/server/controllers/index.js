import { AuthService } from '../services/authService.js';
import { ClinicalService } from '../services/clinicalService.js';
import { DoctorService } from '../services/doctorService.js';
import { MedicationService, AppointmentService, AlertService, ContentService } from '../services/extraServices.js';
import { getDatabase } from '../db/database.js';
export const authController = {
    async login(req, res) {
        try {
            const { email, password, name, role } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
            }
            const result = await AuthService.login(email, password, name, role);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async register(req, res) {
        try {
            const { email, password, name, role, age, gender, crm, conditions } = req.body;
            if (!email || !password || !name || !role) {
                return res.status(400).json({ success: false, error: 'Campos obrigatórios não preenchidos.' });
            }
            const result = await AuthService.register({
                email,
                password,
                name,
                role,
                age,
                gender,
                crm,
                conditions,
            });
            return res.status(201).json({ success: true, ...result });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async getMe(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Não autenticado.' });
            }
            const me = await AuthService.getMe(req.user.userId);
            return res.json({ success: true, user: me });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Não autenticado.' });
            }
            const result = await AuthService.updateProfile(req.user.userId, req.body);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async googleFirebaseLogin(req, res) {
        try {
            const { uid, email, name, photoURL, role, idToken } = req.body;
            if (!uid || !email) {
                return res.status(400).json({ success: false, error: 'UID e e-mail Firebase Google são obrigatórios.' });
            }
            const result = await AuthService.loginWithFirebaseGoogle({
                uid,
                email,
                name: name || email.split('@')[0],
                photoURL,
                role: role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
                idToken,
            });
            return res.json({ success: true, ...result });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, error: 'O e-mail cadastrado é obrigatório.' });
            }
            const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
            const result = await AuthService.requestPasswordReset(email, origin);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async verifyResetToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, error: 'Token de recuperação não fornecido.' });
            }
            const result = await AuthService.verifyResetToken(token);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Token e nova senha são obrigatórios.',
                });
            }
            const result = await AuthService.resetPassword(token, newPassword);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const clinicalController = {
    async getSummary(req, res) {
        try {
            const patientId = req.query.patientId || req.user?.profileId;
            if (!patientId) {
                return res.status(400).json({ success: false, error: 'ID do paciente não informado.' });
            }
            const summary = await ClinicalService.getPatientSummary(patientId);
            return res.json({ success: true, data: summary });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async recordPressure(req, res) {
        try {
            const patientId = req.body.patientId || req.user?.profileId;
            const { systolic, diastolic, pulse, recordedAt, notes } = req.body;
            if (!systolic || !diastolic) {
                return res.status(400).json({ success: false, error: 'Sistólica e diastólica são obrigatórias.' });
            }
            const record = await ClinicalService.recordBloodPressure({
                patientId,
                systolic: Number(systolic),
                diastolic: Number(diastolic),
                pulse: Number(pulse || 72),
                recordedAt,
                notes,
            });
            return res.status(201).json({
                success: true,
                message: 'Aferição de pressão arterial salva com sucesso.',
                data: record,
            });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async recordGlucose(req, res) {
        try {
            const patientId = req.body.patientId || req.user?.profileId;
            const { glucoseValue, moment, recordedAt, notes } = req.body;
            if (!glucoseValue || !moment) {
                return res.status(400).json({ success: false, error: 'Valor da glicose e momento são obrigatórios.' });
            }
            const record = await ClinicalService.recordGlucose({
                patientId,
                glucoseValue: Number(glucoseValue),
                moment,
                recordedAt,
                notes,
            });
            return res.status(201).json({
                success: true,
                message: 'Glicemia registrada com sucesso.',
                data: record,
            });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async getHistory(req, res) {
        try {
            const patientId = req.query.patientId || req.user?.profileId;
            const timeframe = req.query.timeframe || '7d';
            if (!patientId) {
                return res.status(400).json({ success: false, error: 'ID do paciente não especificado.' });
            }
            const history = await ClinicalService.getHistory(patientId, timeframe);
            return res.json({ success: true, data: history });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const doctorController = {
    async getDashboard(req, res) {
        try {
            const stats = await DoctorService.getDashboardStats();
            return res.json({ success: true, data: stats });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async getPatients(req, res) {
        try {
            const search = req.query.search;
            const risk = req.query.risk;
            const patients = await DoctorService.getPatients({ search, risk });
            return res.json({ success: true, data: patients });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async getPatientProfile(req, res) {
        try {
            const patientId = req.params.patientId || req.query.patientId;
            const profile = await DoctorService.getPatientProfile(patientId);
            return res.json({ success: true, data: profile });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const medicationController = {
    async getMedications(req, res) {
        try {
            const patientId = req.query.patientId || req.user?.profileId || 'pat-maria';
            const meds = await MedicationService.getByPatient(patientId);
            return res.json({ success: true, data: meds });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async addMedication(req, res) {
        try {
            const patientId = req.body.patientId || req.user?.profileId;
            const { name, dosage, frequency, reminderTimes, notes } = req.body;
            const med = await MedicationService.add({
                patientId,
                name,
                dosage,
                frequency,
                reminderTimes: reminderTimes || ['08:00'],
                notes,
            });
            return res.status(201).json({ success: true, data: med });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await MedicationService.updateStatus(id, status);
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const appointmentController = {
    async getAppointments(req, res) {
        try {
            const patientId = req.query.patientId ||
                (req.user?.role === 'PATIENT' ? req.user?.profileId : undefined);
            const appointments = await AppointmentService.getByPatientOrAll(patientId);
            return res.json({ success: true, data: appointments });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async createAppointment(req, res) {
        try {
            const { patientId, patientName, patientConditions, patientAge, appointmentType, scheduledFor, clinicName, doctorName, notes, } = req.body;
            const db = await getDatabase();
            const targetPatientId = patientId || req.user?.profileId || ('pat-' + Date.now());
            let pName = patientName;
            let pConditions = patientConditions;
            let pAge = patientAge;
            let pUnit = clinicName;
            if (targetPatientId) {
                const patient = await db.getPatientById(targetPatientId);
                if (patient) {
                    pName = pName || patient.name;
                    pConditions = pConditions || patient.conditions;
                    pAge = pAge || patient.age;
                    pUnit = pUnit || patient.healthcareUnit;
                }
            }
            const app = await AppointmentService.create({
                patientId: targetPatientId,
                patientName: pName || req.user?.name || 'Paciente',
                patientConditions: pConditions || [],
                patientAge: pAge || 45,
                appointmentType: appointmentType || 'Consulta de Rotina Hiperdia',
                scheduledFor: scheduledFor || new Date(Date.now() + 86400000 * 3).toISOString(),
                clinicName: pUnit || 'UBS de Referência',
                doctorName: doctorName || 'Equipe de Saúde da Família',
                notes: notes || 'Consulta agendada no sistema.',
            });
            return res.status(201).json({ success: true, data: app });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const alertController = {
    async getAlerts(req, res) {
        try {
            const patientId = req.query.patientId;
            const severity = req.query.severity;
            const alerts = await AlertService.getAlerts(patientId, severity);
            return res.json({ success: true, data: alerts });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
    async resolve(req, res) {
        try {
            const { id } = req.params;
            const ok = await AlertService.resolve(id);
            return res.json({ success: ok });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const contentController = {
    async getEducational(req, res) {
        try {
            const category = req.query.category;
            const type = req.query.type;
            const content = await ContentService.getEducational(category, type);
            return res.json({ success: true, data: content });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export const reportController = {
    async generateReport(req, res) {
        try {
            const patientId = req.query.patientId || req.user?.profileId || 'pat-maria';
            const startDate = req.query.startDate || '2025-01-01';
            const endDate = req.query.endDate || '2025-06-07';
            const db = await getDatabase();
            const patient = await db.getPatientById(patientId);
            const bpRecords = await db.getBloodPressureRecords(patientId);
            const glucoseRecords = await db.getGlucoseRecords(patientId);
            const meds = await db.getMedications(patientId);
            const appointments = await db.getAppointments(patientId);
            const reportData = {
                patient,
                period: { startDate, endDate },
                generatedAt: new Date().toISOString(),
                summary: {
                    totalBloodPressureLogs: bpRecords.length,
                    totalGlucoseLogs: glucoseRecords.length,
                    adherenceRate: patient?.adherenceRate || 85,
                    activeMedicationsCount: meds.filter((m) => m.status === 'ATIVO').length,
                    nextAppointmentDate: appointments[0]?.scheduledFor,
                },
                bloodPressureRecords: bpRecords,
                glucoseRecords: glucoseRecords,
                medications: meds,
                appointments: appointments,
            };
            return res.json({ success: true, data: reportData });
        }
        catch (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
    },
};
export { notificationController } from './notificationController.js';
