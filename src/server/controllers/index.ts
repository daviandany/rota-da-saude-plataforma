import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ClinicalService } from '../services/clinicalService';
import { DoctorService } from '../services/doctorService';
import { MedicationService, AppointmentService, AlertService, ContentService } from '../services/extraServices';
import { getDatabase } from '../db/database';

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
      }
      const result = await AuthService.login(email, password);
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
      const me = await AuthService.getMe(req.user.userId);
      return res.json({ success: true, user: me });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export const clinicalController = {
  async getSummary(req: Request, res: Response) {
    try {
      const patientId = (req.query.patientId as string) || req.user?.profileId;
      if (!patientId) {
        return res.status(400).json({ success: false, error: 'ID do paciente não informado.' });
      }
      const summary = await ClinicalService.getPatientSummary(patientId);
      return res.json({ success: true, data: summary });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async recordPressure(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async recordGlucose(req: Request, res: Response) {
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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const patientId = (req.query.patientId as string) || req.user?.profileId;
      const timeframe = (req.query.timeframe as '7d' | '30d' | '90d' | '1y') || '7d';

      if (!patientId) {
        return res.status(400).json({ success: false, error: 'ID do paciente não especificado.' });
      }

      const history = await ClinicalService.getHistory(patientId, timeframe);
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
};

export const medicationController = {
  async getMedications(req: Request, res: Response) {
    try {
      const patientId = (req.query.patientId as string) || req.user?.profileId || 'pat-maria';
      const meds = await MedicationService.getByPatient(patientId);
      return res.json({ success: true, data: meds });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async addMedication(req: Request, res: Response) {
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
      const patientId = req.query.patientId as string;
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

      const app = await AppointmentService.create({
        patientId: patientId || req.user?.profileId || 'pat-maria',
        patientName: patientName || 'Maria Silva',
        patientConditions: patientConditions || ['HAS', 'DM'],
        patientAge: patientAge || 58,
        appointmentType: appointmentType || 'Consulta de rotina',
        scheduledFor: scheduledFor || new Date(Date.now() + 86400000 * 7).toISOString(),
        clinicName: clinicName || 'Clínica da Família',
        doctorName: doctorName || 'Dr. Carlos Mendes',
        notes,
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
      const patientId = req.query.patientId as string;
      const severity = req.query.severity as string;
      const alerts = await AlertService.getAlerts(patientId, severity);
      return res.json({ success: true, data: alerts });
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
      const patientId = (req.query.patientId as string) || req.user?.profileId || 'pat-maria';
      const startDate = (req.query.startDate as string) || '2025-01-01';
      const endDate = (req.query.endDate as string) || '2025-06-07';

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
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};

export { notificationController } from './notificationController';

