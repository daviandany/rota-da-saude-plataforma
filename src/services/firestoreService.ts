import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  Patient,
  BloodPressureRecord,
  GlucoseRecord,
  Medication,
  Appointment,
  ClinicalAlert,
} from '../types';

export class FirestoreClinicalService {
  // Helper para verificar se há usuário Firebase autenticado
  static isAuthReady(): boolean {
    return !!auth.currentUser;
  }

  // ==========================================
  // PACIENTES (Patients)
  // ==========================================

  static async savePatient(patient: Patient): Promise<Patient> {
    if (!auth.currentUser) return patient;
    const docPath = `patients/${patient.id}`;
    try {
      const patientRef = doc(db, 'patients', patient.id);
      const payload = {
        ...patient,
        updatedAt: new Date().toISOString(),
        _serverTimestamp: serverTimestamp(),
      };
      await setDoc(patientRef, payload, { merge: true });
      return patient;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getPatientById(patientId: string): Promise<Patient | null> {
    if (!auth.currentUser) return null;
    const docPath = `patients/${patientId}`;
    try {
      const snap = await getDoc(doc(db, 'patients', patientId));
      if (!snap.exists()) return null;
      return snap.data() as Patient;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  }

  static async getPatientByUserId(userId: string): Promise<Patient | null> {
    if (!auth.currentUser) return null;
    const colPath = 'patients';
    try {
      const q = query(collection(db, colPath), where('userId', '==', userId));
      const snaps = await getDocs(q);
      if (snaps.empty) return null;
      return snaps.docs[0].data() as Patient;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static async getAllPatients(): Promise<Patient[]> {
    if (!auth.currentUser) return [];
    const colPath = 'patients';
    try {
      const snaps = await getDocs(collection(db, colPath));
      return snaps.docs.map((d) => d.data() as Patient);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static subscribeToPatients(callback: (patients: Patient[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colPath = 'patients';
    return onSnapshot(
      collection(db, colPath),
      (snapshot) => {
        const patients = snapshot.docs.map((d) => d.data() as Patient);
        callback(patients);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );
  }

  // ==========================================
  // REGISTROS DE PRESSÃO ARTERIAL (Blood Pressure)
  // ==========================================

  static async recordBloodPressure(record: BloodPressureRecord): Promise<BloodPressureRecord> {
    if (!auth.currentUser) return record;
    const docPath = `blood_pressure_records/${record.id}`;
    try {
      const recordRef = doc(db, 'blood_pressure_records', record.id);
      const payload = {
        ...record,
        _serverTimestamp: serverTimestamp(),
      };
      await setDoc(recordRef, payload);

      // Atualiza os indicadores recentes no documento do paciente
      if (record.patientId) {
        try {
          const patientRef = doc(db, 'patients', record.patientId);
          await updateDoc(patientRef, {
            latestBP: `${record.systolic}/${record.diastolic} mmHg`,
            lastMeasuredAt: record.recordedAt,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // Não bloqueia a gravação da aferição
        }
      }

      return record;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getBloodPressureRecords(patientId?: string): Promise<BloodPressureRecord[]> {
    if (!auth.currentUser) return [];
    const colPath = 'blood_pressure_records';
    try {
      let q = collection(db, colPath);
      let snaps;
      if (patientId) {
        snaps = await getDocs(query(q, where('patientId', '==', patientId)));
      } else {
        snaps = await getDocs(q);
      }
      const records = snaps.docs.map((d) => d.data() as BloodPressureRecord);
      return records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static subscribeToBloodPressure(
    patientId: string,
    callback: (records: BloodPressureRecord[]) => void
  ): () => void {
    if (!auth.currentUser) return () => {};
    const colPath = 'blood_pressure_records';
    const q = query(collection(db, colPath), where('patientId', '==', patientId));
    return onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => d.data() as BloodPressureRecord);
        records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        callback(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );
  }

  // ==========================================
  // REGISTROS DE GLICEMIA CAPILAR (Glucose)
  // ==========================================

  static async recordGlucose(record: GlucoseRecord): Promise<GlucoseRecord> {
    if (!auth.currentUser) return record;
    const docPath = `glucose_records/${record.id}`;
    try {
      const recordRef = doc(db, 'glucose_records', record.id);
      const payload = {
        ...record,
        _serverTimestamp: serverTimestamp(),
      };
      await setDoc(recordRef, payload);

      // Atualiza os indicadores recentes no documento do paciente
      if (record.patientId) {
        try {
          const patientRef = doc(db, 'patients', record.patientId);
          await updateDoc(patientRef, {
            latestGlucose: `${record.glucoseValue} mg/dL`,
            lastMeasuredAt: record.recordedAt,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // Não bloqueia a gravação da aferição
        }
      }

      return record;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getGlucoseRecords(patientId?: string): Promise<GlucoseRecord[]> {
    if (!auth.currentUser) return [];
    const colPath = 'glucose_records';
    try {
      let snaps;
      if (patientId) {
        snaps = await getDocs(query(collection(db, colPath), where('patientId', '==', patientId)));
      } else {
        snaps = await getDocs(collection(db, colPath));
      }
      const records = snaps.docs.map((d) => d.data() as GlucoseRecord);
      return records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static subscribeToGlucose(
    patientId: string,
    callback: (records: GlucoseRecord[]) => void
  ): () => void {
    if (!auth.currentUser) return () => {};
    const colPath = 'glucose_records';
    const q = query(collection(db, colPath), where('patientId', '==', patientId));
    return onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => d.data() as GlucoseRecord);
        records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
        callback(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, colPath);
      }
    );
  }

  // ==========================================
  // MEDICAMENTOS (Medications)
  // ==========================================

  static async addMedication(medication: Medication): Promise<Medication> {
    if (!auth.currentUser) return medication;
    const docPath = `medications/${medication.id}`;
    try {
      const medRef = doc(db, 'medications', medication.id);
      await setDoc(medRef, {
        ...medication,
        _serverTimestamp: serverTimestamp(),
      });
      return medication;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getMedications(patientId?: string): Promise<Medication[]> {
    if (!auth.currentUser) return [];
    const colPath = 'medications';
    try {
      let snaps;
      if (patientId) {
        snaps = await getDocs(query(collection(db, colPath), where('patientId', '==', patientId)));
      } else {
        snaps = await getDocs(collection(db, colPath));
      }
      return snaps.docs.map((d) => d.data() as Medication);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static async updateMedicationStatus(
    id: string,
    status: 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO'
  ): Promise<boolean> {
    if (!auth.currentUser) return true;
    const docPath = `medications/${id}`;
    try {
      const medRef = doc(db, 'medications', id);
      await updateDoc(medRef, { status });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  // ==========================================
  // CONSULTAS (Appointments)
  // ==========================================

  static async createAppointment(appointment: Appointment): Promise<Appointment> {
    if (!auth.currentUser) return appointment;
    const docPath = `appointments/${appointment.id}`;
    try {
      const appRef = doc(db, 'appointments', appointment.id);
      await setDoc(appRef, {
        ...appointment,
        _serverTimestamp: serverTimestamp(),
      });
      return appointment;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getAppointments(patientId?: string): Promise<Appointment[]> {
    if (!auth.currentUser) return [];
    const colPath = 'appointments';
    try {
      let snaps;
      if (patientId) {
        snaps = await getDocs(query(collection(db, colPath), where('patientId', '==', patientId)));
      } else {
        snaps = await getDocs(collection(db, colPath));
      }
      const list = snaps.docs.map((d) => d.data() as Appointment);
      return list.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  // ==========================================
  // ALERTAS CLÍNICOS (Clinical Alerts)
  // ==========================================

  static async createClinicalAlert(alert: ClinicalAlert): Promise<ClinicalAlert> {
    if (!auth.currentUser) return alert;
    const docPath = `clinical_alerts/${alert.id}`;
    try {
      const alertRef = doc(db, 'clinical_alerts', alert.id);
      await setDoc(alertRef, {
        ...alert,
        _serverTimestamp: serverTimestamp(),
      });
      return alert;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  static async getClinicalAlerts(patientId?: string): Promise<ClinicalAlert[]> {
    if (!auth.currentUser) return [];
    const colPath = 'clinical_alerts';
    try {
      let snaps;
      if (patientId) {
        snaps = await getDocs(query(collection(db, colPath), where('patientId', '==', patientId)));
      } else {
        snaps = await getDocs(collection(db, colPath));
      }
      const list = snaps.docs.map((d) => d.data() as ClinicalAlert);
      return list.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  }

  static async resolveClinicalAlert(alertId: string): Promise<boolean> {
    if (!auth.currentUser) return true;
    const docPath = `clinical_alerts/${alertId}`;
    try {
      const alertRef = doc(db, 'clinical_alerts', alertId);
      await updateDoc(alertRef, { status: 'RESOLVIDO' });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  // ==========================================
  // INICIALIZAÇÃO E SINCRONIZAÇÃO DE DADOS (Seed & Sync)
  // ==========================================

  static async seedFirestoreIfEmpty(user: { id: string; email: string; name: string; role: string; profileId?: string }): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const patientId = user.profileId || (user.role === 'PATIENT' ? 'pat-' + user.id : 'pat-maria');
      const existingPatient = await this.getPatientById(patientId);

      if (!existingPatient && user.role === 'PATIENT') {
        // Inicializa o paciente no Firestore
        const newPatient: Patient = {
          id: patientId,
          userId: user.id,
          name: user.name || 'Paciente Cadastrado',
          email: user.email,
          age: 62,
          gender: 'Feminino',
          conditions: ['Hipertensão Arterial Sistêmica', 'Diabetes Mellitus Tipo 2'],
          riskLevel: 'ALTO',
          healthcareUnit: 'UBS Vila Esperança - Equipe Saúde da Família 04',
          adherenceRate: 88,
          phone: '(11) 98765-4321',
          latestBP: '128/82 mmHg',
          latestGlucose: '115 mg/dL',
          lastMeasuredAt: new Date().toISOString(),
        };
        await this.savePatient(newPatient);

        // Registros clínicos iniciais de base
        const now = Date.now();
        await this.recordBloodPressure({
          id: 'bp-' + (now - 86400000),
          patientId: patientId,
          systolic: 128,
          diastolic: 82,
          pulse: 74,
          recordedAt: new Date(now - 86400000).toISOString(),
          notes: 'Medição matinal em repouso após 10 minutos sentado.',
          isCritical: false,
          statusText: 'Normal',
        });

        await this.recordGlucose({
          id: 'glu-' + (now - 86400000),
          patientId: patientId,
          glucoseValue: 115,
          moment: 'EM_JEJUM',
          recordedAt: new Date(now - 86400000).toISOString(),
          notes: 'Glicemia em jejum de 8 horas.',
          isCritical: false,
          statusText: 'Normal',
        });

        await this.addMedication({
          id: 'med-' + now + '-1',
          patientId: patientId,
          name: 'Losartana Potássica',
          dosage: '50mg',
          frequency: '1x ao dia (pela manhã)',
          reminderTimes: ['08:00'],
          status: 'ATIVO',
          notes: 'Tomar com água antes do café da manhã.',
        });

        await this.addMedication({
          id: 'med-' + now + '-2',
          patientId: patientId,
          name: 'Cloridrato de Metformina',
          dosage: '850mg',
          frequency: '2x ao dia após as refeições',
          reminderTimes: ['08:30', '19:30'],
          status: 'ATIVO',
          notes: 'Tomar durante ou após as principais refeições.',
        });

        await this.createAppointment({
          id: 'app-' + now,
          patientId: patientId,
          patientName: newPatient.name,
          appointmentType: 'Consulta de Acompanhamento Hiperdia',
          scheduledFor: new Date(now + 7 * 86400000).toISOString(),
          clinicName: 'UBS Vila Esperança',
          doctorName: 'Dra. Camila Alencar - Medicina de Família e Comunidade',
          status: 'AGENDADA',
          notes: 'Trazer caderno de anotações de pressão e glicemia.',
        });
      }
    } catch (e) {
      console.warn('[Firestore] Sincronização inicial não executada ou já existente:', e);
    }
  }
}
