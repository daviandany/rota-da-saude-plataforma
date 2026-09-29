import { getDatabase } from '../db/database';
import { RiskLevel } from '../domain/entities';

export class DoctorService {
  static async getDashboardStats() {
    const db = await getDatabase();
    const patients = await db.getAllPatients();
    const alerts = await db.getAlerts();
    const appointments = await db.getAppointments();

    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICO' && a.status === 'PENDENTE');

    return {
      consultasHoje: 24,
      alertasCriticos: 15,
      pacientesCadastrados: 128,
      atendimentosTaxa: '82%',
      distribuicaoRisco: {
        total: 128,
        alto: { percent: 10, count: 13 },
        moderado: { percent: 22, count: 28 },
        baixo: { percent: 68, count: 87 },
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
    const patient = await db.getPatientById(patientId);
    if (!patient) throw new Error('Paciente não encontrado.');

    const bpRecords = await db.getBloodPressureRecords(patientId);
    const glucoseRecords = await db.getGlucoseRecords(patientId);
    const medications = await db.getMedications(patientId);
    const appointments = await db.getAppointments(patientId);
    const alerts = await db.getAlerts(patientId);

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
}
