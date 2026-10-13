import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { ClinicalService } from '../services/clinicalService.js';
import { DoctorService } from '../services/doctorService.js';
import { MedicationService, AppointmentService, AlertService, ContentService } from '../services/extraServices.js';
import { getDatabase } from '../db/database.js';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password, name, role, patientId } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
      }
      const result = await AuthService.login(email, password, name, role, patientId);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async register(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado.' });
      }
      const me = await AuthService.getMe(req.user.userId, req.user.profileId);
      return res.json({ success: true, user: me });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado.' });
      }
      const result = await AuthService.updateProfile(req.user.userId, req.body, req.user.profileId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async switchPatient(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado.' });
      }
      const result = await AuthService.switchActivePatient(req.user.userId, req.body);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async googleFirebaseLogin(req: Request, res: Response) {
    try {
      const { uid, email, name, customPatientName, patientId, photoURL, role, idToken } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ success: false, error: 'UID e e-mail Firebase Google são obrigatórios.' });
      }
      const result = await AuthService.loginWithFirebaseGoogle({
        uid,
        email,
        name: name || email.split('@')[0],
        customPatientName,
        patientId,
        photoURL,
        role: role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT',
        idToken,
      });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'O e-mail cadastrado é obrigatório.' });
      }
      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const result = await AuthService.requestPasswordReset(email, origin);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async verifyResetToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Token de recuperação não fornecido.' });
      }
      const result = await AuthService.verifyResetToken(token);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async resetPassword(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const clinicalController = {
  async getSummary(req: Request, res: Response) {
    try {
      const patientId = (req.query.patientId as string) || req.user?.profileId || req.user?.userId || '';
      const summary = await ClinicalService.getPatientSummary(patientId, req.user);
      return res.json({ success: true, data: summary });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async recordPressure(req: Request, res: Response) {
    try {
      const patientId = req.body.patientId || req.user?.profileId || req.user?.userId || '';
      const { systolic, diastolic, pulse, recordedAt, notes } = req.body;

      if (!systolic || !diastolic) {
        return res.status(400).json({ success: false, error: 'Sistólica e diastólica são obrigatórias.' });
      }

      const record = await ClinicalService.recordBloodPressure(
        {
          patientId,
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          pulse: Number(pulse || 72),
          recordedAt,
          notes,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        message: 'Aferição de pressão arterial salva com sucesso.',
        data: record,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async recordGlucose(req: Request, res: Response) {
    try {
      const patientId = req.body.patientId || req.user?.profileId || req.user?.userId || '';
      const { glucoseValue, moment, recordedAt, notes } = req.body;

      if (!glucoseValue || !moment) {
        return res.status(400).json({ success: false, error: 'Valor da glicose e momento são obrigatórios.' });
      }

      const record = await ClinicalService.recordGlucose(
        {
          patientId,
          glucoseValue: Number(glucoseValue),
          moment,
          recordedAt,
          notes,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        message: 'Glicemia registrada com sucesso.',
        data: record,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const patient = await ClinicalService.ensurePatient(
        (req.query.patientId as string) || req.user?.profileId,
        req.user
      );
      const timeframe = (req.query.timeframe as '7d' | '30d' | '90d' | '1y') || '7d';

      const history = await ClinicalService.getHistory(patient.id, timeframe);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const doctorController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const stats = await DoctorService.getDashboardStats();
      return res.json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getPatients(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const risk = req.query.risk as string;
      const patients = await DoctorService.getPatients({ search, risk });
      return res.json({ success: true, data: patients });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getPatientProfile(req: Request, res: Response) {
    try {
      const patientId = req.params.patientId || (req.query.patientId as string);
      const profile = await DoctorService.getPatientProfile(patientId);
      return res.json({ success: true, data: profile });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async createPatient(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'O nome do paciente é obrigatório.' });
      }
      const created = await DoctorService.createPatient(req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const medicationController = {
  async getMedications(req: Request, res: Response) {
    try {
      const explicitPatientId = req.query.patientId as string | undefined;
      const isDoctor = req.user?.role === 'PROFESSIONAL';

      if (isDoctor && !explicitPatientId) {
        // Médicos visualizam todas as prescrições de todos os pacientes do sistema
        const allMeds = await MedicationService.getAll();
        return res.json({ success: true, data: allMeds });
      }

      const fallback =
        explicitPatientId || isDoctor
          ? { profileId: explicitPatientId }
          : req.user;
      const patient = await ClinicalService.ensurePatient(
        explicitPatientId || req.user?.profileId,
        fallback
      );
      const meds = await MedicationService.getByPatient(patient.id);
      return res.json({ success: true, data: meds });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async addMedication(req: Request, res: Response) {
    try {
      const {
        patientId,
        patientName,
        patientEmail,
        name,
        dosage,
        frequency,
        reminderTimes,
        notes,
        addedByRole,
        prescribedBy,
      } = req.body;
      const isDoctorActor = req.user?.role === 'PROFESSIONAL' || addedByRole === 'PROFESSIONAL';
      const fallback =
        patientId || isDoctorActor
          ? {
              profileId: patientId,
              name: patientName,
              email: patientEmail,
            }
          : req.user;

      const patient = await ClinicalService.ensurePatient(
        patientId || req.user?.profileId,
        fallback
      );
      const role = isDoctorActor ? 'PROFESSIONAL' : req.user?.role || addedByRole || 'PATIENT';
      const med = await MedicationService.add({
        patientId: patient.id,
        patientName: patientName || patient?.name,
        patientEmail: patientEmail || patient?.email,
        name,
        dosage,
        frequency,
        reminderTimes: reminderTimes || ['08:00'],
        notes,
        addedByRole: role,
        prescribedBy:
          role === 'PROFESSIONAL'
            ? prescribedBy || req.user?.name || 'Médico da Equipe ESF'
            : undefined,
      });
      return res.status(201).json({ success: true, data: med });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateMedication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const explicitPatientId = req.body.patientId as string | undefined;
      const fallback =
        explicitPatientId || req.user?.role === 'PROFESSIONAL'
          ? { profileId: explicitPatientId }
          : req.user;
      const patient = await ClinicalService.ensurePatient(
        explicitPatientId || req.user?.profileId,
        fallback
      );
      const existingMeds = await MedicationService.getByPatient(patient.id);
      const targetMed = existingMeds.find((m) => m.id === id);

      if (targetMed && req.user?.role === 'PATIENT' && targetMed.addedByRole === 'PROFESSIONAL') {
        return res.status(403).json({
          success: false,
          error: 'Medicamentos prescritos pelo médico não podem ser editados pelo paciente.',
        });
      }

      const { name, dosage, frequency, reminderTimes, notes, status } = req.body;
      const updated = await MedicationService.update(
        id,
        {
          name,
          dosage,
          frequency,
          reminderTimes,
          notes,
          status,
        },
        req.user?.role
      );
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async deleteMedication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const isDoctor = req.user?.role === 'PROFESSIONAL';

      // Paciente só pode excluir se o medicamento tiver sido adicionado por ele
      if (!isDoctor) {
        const patient = await ClinicalService.ensurePatient(req.user?.profileId, req.user);
        const userMeds = await MedicationService.getByPatient(patient.id);
        const target = userMeds.find((m) => m.id === id);
        if (target && target.addedByRole === 'PROFESSIONAL') {
          return res.status(403).json({
            success: false,
            error: 'Medicamentos prescritos pelo médico não podem ser excluídos pelo paciente.',
          });
        }
      }

      const success = await MedicationService.delete(id);
      return res.json({ success: true, message: 'Medicamento removido com sucesso.' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await MedicationService.updateStatus(id, status);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const appointmentController = {
  async getAppointments(req: Request, res: Response) {
    try {
      let patientId = req.query.patientId as string | undefined;
      if (!patientId && req.user?.role === 'PATIENT') {
        const patient = await ClinicalService.ensurePatient(req.user?.profileId, req.user);
        patientId = patient.id;
      }
      const appointments = await AppointmentService.getByPatientOrAll(patientId);
      return res.json({ success: true, data: appointments });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async createAppointment(req: Request, res: Response) {
    try {
      const {
        patientId,
        patientName,
        patientConditions,
        patientAge,
        appointmentType,
        scheduledFor,
        clinicName,
        doctorName,
        notes,
      } = req.body;

      const fallback =
        patientId || req.user?.role === 'PROFESSIONAL'
          ? { profileId: patientId, name: patientName }
          : req.user;
      const patient = await ClinicalService.ensurePatient(
        patientId || req.user?.profileId,
        fallback
      );
      const targetPatientId = patient.id;
      const pName = patientName || patient.name || req.user?.name || 'Paciente';
      const pConditions = patientConditions || patient.conditions || [];
      const pAge = patientAge || patient.age || 45;
      const pUnit = clinicName || patient.healthcareUnit || 'UBS de Referência';

      const app = await AppointmentService.create({
        patientId: targetPatientId,
        patientName: pName,
        patientConditions: pConditions,
        patientAge: pAge,
        appointmentType: appointmentType || 'Consulta de Rotina Hiperdia',
        scheduledFor: scheduledFor || new Date(Date.now() + 86400000 * 3).toISOString(),
        clinicName: pUnit,
        doctorName: doctorName || 'Equipe de Saúde da Família',
        notes: notes || 'Consulta agendada no sistema.',
      });

      return res.status(201).json({ success: true, data: app });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const alertController = {
  async getAlerts(req: Request, res: Response) {
    try {
      let patientId = req.query.patientId as string | undefined;
      if (!patientId && req.user?.role === 'PATIENT') {
        const patient = await ClinicalService.ensurePatient(req.user?.profileId, req.user);
        patientId = patient.id;
      }
      const severity = req.query.severity as string;
      const alerts = await AlertService.getAlerts(patientId, severity);
      return res.json({ success: true, data: alerts });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async createAlert(req: Request, res: Response) {
    try {
      const { patientId, patientName, severity, title, message, valueRecorded, metricType } = req.body;
      if (!title || !message) {
        return res.status(400).json({ success: false, error: 'Título e mensagem do alerta são obrigatórios.' });
      }
      const alert = await AlertService.create({
        patientId: patientId || 'pat-maria',
        patientName: patientName || 'Maria Silva',
        severity: severity || 'ATENCAO',
        title,
        message,
        valueRecorded,
        metricType: metricType || 'PRESSURE',
      });
      return res.status(201).json({ success: true, data: alert });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async resolve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ok = await AlertService.resolve(id);
      return res.json({ success: ok });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const contentController = {
  async getEducational(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const type = req.query.type as string;
      const content = await ContentService.getEducational(category, type);
      return res.json({ success: true, data: content });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const reportController = {
  async generateReport(req: Request, res: Response) {
    try {
      const patient = await ClinicalService.ensurePatient(
        (req.query.patientId as string) || req.user?.profileId,
        req.user
      );
      const patientId = patient.id;
      const startDate = (req.query.startDate as string) || '2025-01-01';
      const endDate = (req.query.endDate as string) || '2025-06-07';

      const db = await getDatabase();
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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export { notificationController } from './notificationController.js';

