import { getDatabase } from '../db/database.js';
import { RiskLevel } from '../domain/entities.js';
import { ClinicalService } from './clinicalService.js';

export class DoctorService {
  static async getDashboardStats() {
    const db = await getDatabase();
    const patients = await db.getAllPatients();
    const alerts = await db.getAlerts();
    const appointments = await db.getAppointments();

    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICO' && a.status === 'PENDENTE');

    const totalPatients = patients.length;
    const altoCount = patients.filter((p) => p.riskLevel === 'ALTO').length;
    const modCount = patients.filter((p) => p.riskLevel === 'MODERADO').length;
    const baixoCount = patients.filter((p) => p.riskLevel === 'BAIXO').length;

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const consultasHojeCount = appointments.filter((a) => a.scheduledFor && a.scheduledFor.startsWith(todayDateStr)).length;

    return {
      consultasHoje: consultasHojeCount,
      alertasCriticos: criticalAlerts.length,
      pacientesCadastrados: totalPatients,
      atendimentosTaxa: totalPatients > 0 ? `${Math.round(((totalPatients - altoCount) / totalPatients) * 100)}%` : '100%',
      distribuicaoRisco: {
        total: totalPatients,
        alto: { percent: totalPatients ? Math.round((altoCount / totalPatients) * 100) : 0, count: altoCount },
        moderado: { percent: totalPatients ? Math.round((modCount / totalPatients) * 100) : 0, count: modCount },
        baixo: { percent: totalPatients ? Math.round((baixoCount / totalPatients) * 100) : 0, count: baixoCount },
      },
      recentCriticalAlerts: criticalAlerts.slice(0, 5),
      appointmentsCount: appointments.length,
      realPatientsSample: patients,
    };
  }

  static async getPatients(options?: { search?: string; risk?: string }) {
    const db = await getDatabase();
    let patients = await db.getAllPatients();

    if (options?.search) {
      const q = options.search.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.conditions.some((c) => c.toLowerCase().includes(q)) ||
          p.email.toLowerCase().includes(q)
      );
    }

    if (options?.risk && options.risk !== 'TODOS') {
      const riskNormalized = options.risk.toUpperCase();
      patients = patients.filter((p) => p.riskLevel === riskNormalized);
    }

    // Attach latest measurement snapshot for doctor patient cards
    const enriched = await Promise.all(
      patients.map(async (p) => {
        const bp = await db.getBloodPressureRecords(p.id);
        const gluc = await db.getGlucoseRecords(p.id);
        return {
          ...p,
          latestBP: bp[0] ? `${bp[0].systolic}/${bp[0].diastolic}` : '120/80',
          latestGlucose: gluc[0] ? `${gluc[0].glucoseValue} mg/dL` : '98 mg/dL',
          lastMeasuredAt: bp[0]?.recordedAt || gluc[0]?.recordedAt || p.createdAt,
        };
      })
    );

    return enriched;
  }

  static async getPatientProfile(patientId: string) {
    const db = await getDatabase();
    const patient = await ClinicalService.ensurePatient(patientId);
    const resolvedId = patient.id;

    const bpRecords = await db.getBloodPressureRecords(resolvedId);
    const glucoseRecords = await db.getGlucoseRecords(resolvedId);
    const medications = await db.getMedications(resolvedId);
    const appointments = await db.getAppointments(resolvedId);
    const alerts = await db.getAlerts(resolvedId);

    return {
      patient,
      latestBP: bpRecords[0] || null,
      latestGlucose: glucoseRecords[0] || null,
      historyBP: bpRecords,
      historyGlucose: glucoseRecords,
      medications,
      appointments,
      alerts,
    };
  }

  static async createPatient(payload: {
    id?: string;
    name: string;
    email?: string;
    age?: number;
    gender?: string;
    conditions?: string[];
    riskLevel?: RiskLevel;
    healthcareUnit?: string;
    phone?: string;
    systolic?: number;
    diastolic?: number;
    glucoseValue?: number;
  }) {
    const db = await getDatabase();
    const cleanEmail =
      payload.email?.trim().toLowerCase() ||
      `${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.${Date.now().toString(36).slice(-4)}@paciente.rotadasaude.gov.br`;

    const patientId = payload.id || 'pat-' + Date.now();
    const userId = 'u-' + patientId.replace(/^pat-/, '');

    // Cria também o registro de usuário correspondente no banco de dados para que o paciente exista de forma alinhada
    const existingUser = await db.getUserByEmail(cleanEmail);
    if (!existingUser) {
      await db.createUser({
        id: userId,
        email: cleanEmail,
        passwordHash: '$2a$10$demoPatientHash',
        name: payload.name.trim(),
        role: 'PATIENT',
        createdAt: new Date().toISOString(),
      });
    }

    const newPatient = await db.createPatient({
      id: patientId,
      userId: existingUser?.id || userId,
      name: payload.name.trim(),
      email: cleanEmail,
      age: Number(payload.age || 55),
      gender: payload.gender || 'Não informado',
      conditions: payload.conditions && payload.conditions.length > 0 ? payload.conditions : ['HAS'],
      riskLevel: payload.riskLevel || 'MODERADO',
      healthcareUnit: payload.healthcareUnit || 'UBS Dr. Manoel de Abreu',
      adherenceRate: 90,
      phone: payload.phone || '(11) 98765-4321',
      createdAt: new Date().toISOString(),
    });

    if (payload.systolic && payload.diastolic) {
      await ClinicalService.recordBloodPressure({
        patientId: newPatient.id,
        systolic: Number(payload.systolic),
        diastolic: Number(payload.diastolic),
        pulse: 74,
        recordedAt: new Date().toISOString(),
        notes: 'Aferição inicial registrada pelo médico no cadastramento ambulatorial.',
      });
    }

    if (payload.glucoseValue) {
      await ClinicalService.recordGlucose({
        patientId: newPatient.id,
        glucoseValue: Number(payload.glucoseValue),
        moment: 'EM_JEJUM',
        recordedAt: new Date().toISOString(),
        notes: 'Glicemia inicial registrada pelo médico.',
      });
    }

    return newPatient;
  }
}
