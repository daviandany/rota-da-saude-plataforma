import { getDatabase } from '../db/database.js';
import { RiskLevel } from '../domain/entities.js';

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
