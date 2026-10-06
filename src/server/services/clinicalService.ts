import { getDatabase } from '../db/database.js';
import {
  BloodPressureRecord,
  GlucoseRecord,
  GlucoseMoment,
  ClinicalAlert,
} from '../domain/entities.js';
import { NotificationService } from './notificationService.js';

export class ClinicalService {
  static async ensurePatient(
    patientId?: string,
    fallbackUser?: { userId?: string; name?: string; email?: string }
  ) {
    const db = await getDatabase();
    let patient = patientId ? await db.getPatientById(patientId) : undefined;

    if (!patient && fallbackUser?.userId) {
      patient = await db.getPatientByUserId(fallbackUser.userId);
    }

    if (!patient && patientId) {
      // Caso o ID enviado seja na verdade o userId
      patient = await db.getPatientByUserId(patientId);
    }

    if (!patient && fallbackUser?.email) {
      const u = await db.getUserByEmail(fallbackUser.email);
      if (u) {
        patient = await db.getPatientByUserId(u.id);
      }
    }

    if (!patient) {
      // Auto-cria o prontuário do paciente caso o container Serverless tenha reiniciado
      const newPatientId = patientId || 'pat-' + (fallbackUser?.userId || Date.now());
      patient = await db.createPatient({
        id: newPatientId,
        userId: fallbackUser?.userId || 'u-' + Date.now(),
        name: fallbackUser?.name || 'Paciente',
        email: fallbackUser?.email || 'paciente@rotadasaude.gov.br',
        age: 55,
        gender: 'Não especificado',
        conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
        riskLevel: 'MODERADO',
        healthcareUnit: 'UBS Dr. Manoel de Abreu',
        adherenceRate: 94,
        phone: '(11) 98765-4321',
        createdAt: new Date().toISOString(),
      });
    }

    return patient;
  }

  static async getPatientSummary(
    patientId: string,
    fallbackUser?: { userId?: string; name?: string; email?: string }
  ) {
    const db = await getDatabase();
    const patient = await this.ensurePatient(patientId, fallbackUser);
    const resolvedPatientId = patient.id;

    const bpRecords = await db.getBloodPressureRecords(resolvedPatientId);
    const glucoseRecords = await db.getGlucoseRecords(resolvedPatientId);
    const medications = await db.getMedications(resolvedPatientId);
    const appointments = await db.getAppointments(resolvedPatientId);
    const alerts = await db.getAlerts(resolvedPatientId);

    const latestBP = bpRecords[0]
      ? {
          systolic: bpRecords[0].systolic,
          diastolic: bpRecords[0].diastolic,
          pulse: bpRecords[0].pulse,
          statusText: bpRecords[0].statusText || (bpRecords[0].systolic < 130 && bpRecords[0].diastolic < 85 ? 'Controlada' : 'Atenção'),
          recordedAt: bpRecords[0].recordedAt,
        }
      : null;

    const latestGlucose = glucoseRecords[0]
      ? {
          value: glucoseRecords[0].glucoseValue,
          moment: glucoseRecords[0].moment,
          statusText: glucoseRecords[0].statusText || (glucoseRecords[0].glucoseValue < 100 ? 'Normal' : 'Alterada'),
          recordedAt: glucoseRecords[0].recordedAt,
        }
      : null;

    const activeMeds = medications.filter((m) => m.status === 'ATIVO');
    const nextMedication = activeMeds[0]
      ? {
          name: activeMeds[0].name,
          dosage: activeMeds[0].dosage,
          time: activeMeds[0].reminderTimes[0] || '08:00',
        }
      : null;

    const upcomingAppointments = appointments.filter(
      (a) => new Date(a.scheduledFor).getTime() >= Date.now() - 86400000
    );
    const nextAppointment = upcomingAppointments[0]
      ? {
          date: upcomingAppointments[0].scheduledFor,
          clinic: upcomingAppointments[0].clinicName,
          doctor: upcomingAppointments[0].doctorName,
          type: upcomingAppointments[0].appointmentType,
        }
      : null;

    // Calculate health status compliance index
    let inTargetCount = 0;
    const totalSample = Math.min(10, bpRecords.length + glucoseRecords.length);
    if (totalSample > 0) {
      bpRecords.slice(0, 5).forEach((r) => {
        if (r.systolic <= 135 && r.diastolic <= 85) inTargetCount++;
      });
      glucoseRecords.slice(0, 5).forEach((g) => {
        if (g.glucoseValue >= 70 && g.glucoseValue <= 140) inTargetCount++;
      });
    }
    const healthStatusPercent = totalSample > 0 ? Math.round((inTargetCount / totalSample) * 100) : 80;

    return {
      patient,
      latestBP,
      latestGlucose,
      nextMedication,
      nextAppointment,
      healthStatus: {
        percentage: healthStatusPercent || 80,
        message: 'Parabéns! Seus índices estão dentro da meta.',
        adherenceRate: patient.adherenceRate || 85,
      },
      pendingAlertsCount: alerts.filter((a) => a.status === 'PENDENTE').length,
    };
  }

  static async recordBloodPressure(
    data: {
      patientId: string;
      systolic: number;
      diastolic: number;
      pulse: number;
      recordedAt?: string;
      notes?: string;
    },
    fallbackUser?: { userId?: string; name?: string; email?: string }
  ) {
    const db = await getDatabase();
    const patient = await this.ensurePatient(data.patientId, fallbackUser);
    data.patientId = patient.id;

    let isCritical = false;
    let statusText = 'Normal';
    let alertSeverity: 'CRITICO' | 'ATENCAO' | null = null;
    let alertTitle = '';
    let alertMsg = '';

    if (data.systolic >= 160 || data.diastolic >= 100) {
      isCritical = true;
      statusText = 'Crítica';
      alertSeverity = 'CRITICO';
      alertTitle = 'Situação crítica: Pressão arterial muito alta';
      alertMsg = `Pressão de ${data.systolic}/${data.diastolic} mmHg indica pico hipertensivo. Repouse por 15 minutos e meça novamente. Se persistir ou houver sintomas, procure atendimento médico.`;
    } else if (data.systolic >= 140 || data.diastolic >= 90) {
      statusText = 'Atenção';
      alertSeverity = 'ATENCAO';
      alertTitle = 'Atenção: Pressão arterial acima do ideal';
      alertMsg = `Pressão aferida em ${data.systolic}/${data.diastolic} mmHg. Reforce seus cuidados com o sal e tome seus medicamentos nos horários corretos.`;
    } else if (data.systolic < 90 || data.diastolic < 60) {
      statusText = 'Baixa';
      alertSeverity = 'ATENCAO';
      alertTitle = 'Atenção: Hipotensão detectada';
      alertMsg = `Pressão em ${data.systolic}/${data.diastolic} mmHg está abaixo do usual. Hidrate-se e evite levantar bruscamente.`;
    }

    const record: BloodPressureRecord = {
      id: 'bp-' + Date.now(),
      patientId: data.patientId,
      systolic: data.systolic,
      diastolic: data.diastolic,
      pulse: data.pulse || 72,
      recordedAt: data.recordedAt || new Date().toISOString(),
      notes: data.notes || '',
      isCritical,
      statusText,
      createdAt: new Date().toISOString(),
    };

    await db.addBloodPressureRecord(record);

    if (alertSeverity) {
      const alert: ClinicalAlert = {
        id: 'alt-' + Date.now(),
        patientId: data.patientId,
        patientName: patient.name,
        patientAge: patient.age,
        patientConditions: patient.conditions,
        severity: alertSeverity,
        title: alertTitle,
        message: alertMsg,
        valueRecorded: `${data.systolic} / ${data.diastolic} mmHg`,
        metricType: 'PRESSURE',
        status: 'PENDENTE',
        triggeredAt: new Date().toISOString(),
      };
      await db.addAlert(alert);

      // Disparar Notificação Push FCM para a equipe médica em caso de leituras críticas
      if (alertSeverity === 'CRITICO' || isCritical) {
        await NotificationService.sendCriticalReadingAlert({
          patientId: data.patientId,
          patientName: patient.name,
          metricType: 'PRESSURE',
          value: `${data.systolic}/${data.diastolic} mmHg`,
          severity: alertSeverity || 'CRITICO',
          message: alertMsg,
        });
      }
    }

    return record;
  }

  static async recordGlucose(
    data: {
      patientId: string;
      glucoseValue: number;
      moment: GlucoseMoment;
      recordedAt?: string;
      notes?: string;
    },
    fallbackUser?: { userId?: string; name?: string; email?: string }
  ) {
    const db = await getDatabase();
    const patient = await this.ensurePatient(data.patientId, fallbackUser);
    data.patientId = patient.id;

    let isCritical = false;
    let statusText = 'Normal';
    let alertSeverity: 'CRITICO' | 'ATENCAO' | null = null;
    let alertTitle = '';
    let alertMsg = '';

    const isFasting = data.moment === 'EM_JEJUM';

    if (data.glucoseValue < 70) {
      isCritical = true;
      statusText = 'Crítica (Hipoglicemia)';
      alertSeverity = 'CRITICO';
      alertTitle = 'Situação crítica: Hipoglicemia';
      alertMsg = `Glicemia de ${data.glucoseValue} mg/dL é baixa. Consuma imediatamente 15g de carboidrato simples (ex: 1 copo de suco ou 1 colher de mel) e meça novamente em 15 minutos.`;
    } else if (data.glucoseValue >= 200) {
      isCritical = true;
      statusText = 'Crítica (Hiperglicemia)';
      alertSeverity = 'CRITICO';
      alertTitle = 'Situação crítica: Glicemia muito alta';
      alertMsg = `Glicemia registrada em ${data.glucoseValue} mg/dL está muito acima do recomendado. Hidrate-se e contate sua equipe de saúde se houver sintomas.`;
    } else if ((isFasting && data.glucoseValue >= 115) || (!isFasting && data.glucoseValue >= 140)) {
      statusText = 'Atenção';
      alertSeverity = 'ATENCAO';
      alertTitle = 'Atenção: Sua glicemia está acima do ideal';
      alertMsg = `Glicemia de ${data.glucoseValue} mg/dL no momento selecionado (${data.moment.replace(/_/g, ' ')}). Reforce o controle alimentar.`;
    }

    const record: GlucoseRecord = {
      id: 'glu-' + Date.now(),
      patientId: data.patientId,
      glucoseValue: data.glucoseValue,
      moment: data.moment,
      recordedAt: data.recordedAt || new Date().toISOString(),
      notes: data.notes || '',
      isCritical,
      statusText,
      createdAt: new Date().toISOString(),
    };

    await db.addGlucoseRecord(record);

    if (alertSeverity) {
      const alert: ClinicalAlert = {
        id: 'alt-' + Date.now(),
        patientId: data.patientId,
        patientName: patient.name,
        patientAge: patient.age,
        patientConditions: patient.conditions,
        severity: alertSeverity,
        title: alertTitle,
        message: alertMsg,
        valueRecorded: `${data.glucoseValue} mg/dL`,
        metricType: 'GLUCOSE',
        status: 'PENDENTE',
        triggeredAt: new Date().toISOString(),
      };
      await db.addAlert(alert);

      // Disparar Notificação Push FCM para a equipe médica em caso de leituras críticas
      if (alertSeverity === 'CRITICO' || isCritical) {
        await NotificationService.sendCriticalReadingAlert({
          patientId: data.patientId,
          patientName: patient.name,
          metricType: 'GLUCOSE',
          value: `${data.glucoseValue} mg/dL`,
          severity: alertSeverity || 'CRITICO',
          message: alertMsg,
        });
      }
    }

    return record;
  }

  static async getHistory(patientId: string, timeframe: '7d' | '30d' | '90d' | '1y' = '7d') {
    const db = await getDatabase();
    const allBP = await db.getBloodPressureRecords(patientId);
    const allGlucose = await db.getGlucoseRecords(patientId);

    const now = new Date().getTime();
    let daysCutoff = 7;
    if (timeframe === '30d') daysCutoff = 30;
    else if (timeframe === '90d') daysCutoff = 90;
    else if (timeframe === '1y') daysCutoff = 365;

    const cutoffTime = now - daysCutoff * 86400000;

    const filteredBP = allBP.filter((r) => new Date(r.recordedAt).getTime() >= cutoffTime);
    const filteredGlucose = allGlucose.filter((r) => new Date(r.recordedAt).getTime() >= cutoffTime);

    // Calculate averages
    const avgSystolic = filteredBP.length
      ? Math.round(filteredBP.reduce((acc, c) => acc + c.systolic, 0) / filteredBP.length)
      : 120;
    const avgDiastolic = filteredBP.length
      ? Math.round(filteredBP.reduce((acc, c) => acc + c.diastolic, 0) / filteredBP.length)
      : 80;
    const avgGlucose = filteredGlucose.length
      ? Math.round(filteredGlucose.reduce((acc, c) => acc + c.glucoseValue, 0) / filteredGlucose.length)
      : 98;

    return {
      timeframe,
      pressureRecords: allBP, // Return full list for table/drilldown
      glucoseRecords: allGlucose,
      chartPressure: filteredBP.length > 0 ? filteredBP : allBP.slice(0, 10),
      chartGlucose: filteredGlucose.length > 0 ? filteredGlucose : allGlucose.slice(0, 10),
      stats: {
        avgSystolic,
        avgDiastolic,
        avgGlucose,
        totalMeasurements: filteredBP.length + filteredGlucose.length,
      },
    };
  }
}
