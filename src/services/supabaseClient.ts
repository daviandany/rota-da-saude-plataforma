import { getAuth } from 'firebase/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  BloodPressureRecord,
  GlucoseRecord,
  Medication,
  Appointment,
  ClinicalAlert,
  Patient,
} from '../types';

export { supabase, isSupabaseConfigured };

/**
 * Helper para obter o UID alfanumérico atual do Firebase Auth (com fallback seguro para sessão ativa)
 */
export function getCurrentFirebaseUid(fallbackUserId?: string): string {
  const fbUser = getAuth().currentUser;
  if (fbUser?.uid) return fbUser.uid;
  if (fallbackUserId) return fallbackUserId;
  const savedUserId = localStorage.getItem('active_user_id');
  if (savedUserId) return savedUserId;
  return localStorage.getItem('firebase_uid_hint') || 'u-anonymous';
}

// =========================================================================
// FUNÇÕES ASSÍNCRONAS DE SALVAMENTO E LEITURA NO SUPABASE (COM TRY/CATCH)
// =========================================================================

/**
 * 1. Salvar / Atualizar Perfil Cadastral do Paciente ou Profissional (UserProfileModal)
 */
export async function saveUserProfileToSupabase(formData: {
  id?: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'PROFESSIONAL';
  age?: number;
  gender?: string;
  conditions?: string[];
  riskLevel?: 'BAIXO' | 'MODERADO' | 'ALTO';
  healthcareUnit?: string;
  phone?: string;
  crm?: string;
  specialty?: string;
  avatarUrl?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    if (formData.role === 'PATIENT') {
      const patientId = formData.id || `pat-${userId}`;
      const { data, error } = await supabase
        .from('patients')
        .upsert(
          {
            id: patientId,
            user_id: userId,
            name: formData.name,
            email: formData.email,
            age: Number(formData.age || 55),
            gender: formData.gender || 'Não informado',
            conditions: formData.conditions || ['HAS'],
            risk_level: formData.riskLevel || 'MODERADO',
            healthcare_unit: formData.healthcareUnit || 'UBS de Referência',
            phone: formData.phone || null,
            avatar_url: formData.avatarUrl || null,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const profId = formData.id || `prof-${userId}`;
      const { data, error } = await supabase
        .from('professionals')
        .upsert(
          {
            id: profId,
            user_id: userId,
            name: formData.name,
            email: formData.email,
            crm: formData.crm || 'CRM/SP 000000',
            specialty: formData.specialty || 'Medicina de Família e Comunidade',
            healthcare_unit: formData.healthcareUnit || 'UBS de Referência',
            phone: formData.phone || null,
            avatar_url: formData.avatarUrl || null,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar perfil do usuário:', error.message || error);
    throw error;
  }
}

/**
 * 2. Salvar Aferição de Pressão Arterial (RegisterPressureModal)
 */
export async function saveBloodPressureToSupabase(formData: {
  id?: string;
  patientId?: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  recordedAt?: string;
  notes?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const systolic = Number(formData.systolic);
    const diastolic = Number(formData.diastolic);
    const isCritical = systolic >= 160 || diastolic >= 100 || systolic < 90 || diastolic < 60;
    const statusText =
      systolic >= 160 || diastolic >= 100
        ? 'Crítica'
        : systolic >= 140 || diastolic >= 90
        ? 'Atenção'
        : 'Normal';

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .upsert(
        [
          {
            id: formData.id || `bp-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId || `pat-${userId}`,
            systolic,
            diastolic,
            pulse: Number(formData.pulse || 72),
            recorded_at: formData.recordedAt || new Date().toISOString(),
            notes: formData.notes || null,
            is_critical: isCritical,
            status_text: statusText,
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar pressão arterial:', error.message || error);
    throw error;
  }
}

/**
 * 3. Salvar Aferição de Glicemia Capilar (RegisterGlucoseModal)
 */
export async function saveGlucoseToSupabase(formData: {
  id?: string;
  patientId?: string;
  glucoseValue: number;
  moment: 'EM_JEJUM' | 'ANTES_ALMOCO' | 'APOS_ALMOCO' | 'ANTES_JANTAR' | 'APOS_JANTAR' | 'AO_DORMIR' | string;
  recordedAt?: string;
  notes?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const val = Number(formData.glucoseValue);
    const isCritical = val < 70 || val >= 200;
    const statusText =
      val < 70
        ? 'Crítica (Hipoglicemia)'
        : val >= 200
        ? 'Crítica (Hiperglicemia)'
        : val >= 140
        ? 'Atenção'
        : 'Normal';

    const { data, error } = await supabase
      .from('glucose_records')
      .upsert(
        [
          {
            id: formData.id || `glu-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId || `pat-${userId}`,
            glucose_value: val,
            moment: formData.moment,
            recorded_at: formData.recordedAt || new Date().toISOString(),
            notes: formData.notes || null,
            is_critical: isCritical,
            status_text: statusText,
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar glicemia:', error.message || error);
    throw error;
  }
}

/**
 * 4. Salvar Medicamento / Prescrição (AddMedicationModal)
 */
export async function saveMedicationToSupabase(formData: {
  id?: string;
  patientId?: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderTimes: string[];
  notes?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('medications')
      .upsert(
        [
          {
            id: formData.id || `med-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId || `pat-${userId}`,
            name: formData.name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            reminder_times: formData.reminderTimes || ['08:00'],
            status: 'ATIVO',
            is_active: true,
            notes: formData.notes || null,
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar medicamento:', error.message || error);
    throw error;
  }
}

/**
 * 5. Salvar Consulta / Agendamento na UBS (ScheduleAppointmentModal & NewAppointmentModal)
 */
export async function saveAppointmentToSupabase(formData: {
  id?: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientConditions?: string[];
  doctorName: string;
  clinicName: string;
  scheduledFor: string;
  appointmentType: string;
  notes?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('appointments')
      .upsert(
        [
          {
            id: formData.id || `app-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId || `pat-${userId}`,
            patient_name: formData.patientName || 'Paciente',
            patient_age: formData.patientAge || 55,
            patient_conditions: formData.patientConditions || ['HAS'],
            doctor_name: formData.doctorName,
            clinic_name: formData.clinicName,
            scheduled_for: formData.scheduledFor,
            appointment_type: formData.appointmentType,
            status: 'AGENDADA',
            notes: formData.notes || null,
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao agendar consulta:', error.message || error);
    throw error;
  }
}

/**
 * 6. Salvar Registro Diário de Sintomas e Bem-Estar (RegisterSymptomModal)
 */
export async function saveSymptomLogToSupabase(formData: {
  id?: string;
  patientId?: string;
  symptoms: string[];
  severity: 'BAIXA' | 'MEDIA' | 'ALTA';
  notes?: string;
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('symptom_logs')
      .upsert(
        [
          {
            id: formData.id || `sym-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId || `pat-${userId}`,
            symptoms: formData.symptoms,
            severity: formData.severity,
            notes: formData.notes || null,
            recorded_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar sintomas:', error.message || error);
    throw error;
  }
}

/**
 * 7. Salvar Alerta Clínico / Triagem Rápida (DoctorQuickAlertModal)
 */
export async function saveClinicalAlertToSupabase(formData: {
  id?: string;
  patientId: string;
  patientName: string;
  severity: 'CRITICO' | 'ATENCAO' | 'INFO';
  title: string;
  message: string;
  valueRecorded?: string;
  metricType?: 'PRESSURE' | 'GLUCOSE' | 'GENERAL';
  fallbackUserId?: string;
}) {
  try {
    const userId = getCurrentFirebaseUid(formData.fallbackUserId);
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('clinical_alerts')
      .upsert(
        [
          {
            id: formData.id || `alt-${Date.now()}`,
            user_id: userId,
            patient_id: formData.patientId,
            patient_name: formData.patientName,
            severity: formData.severity,
            title: formData.title,
            message: formData.message,
            value_recorded: formData.valueRecorded || null,
            metric_type: formData.metricType || 'GENERAL',
            status: 'PENDENTE',
            triggered_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar alerta clínico:', error.message || error);
    throw error;
  }
}

// =========================================================================
// FUNÇÕES DE LEITURA DIRETA DO SUPABASE PARA SINCRONIZAÇÃO EM TEMPO REAL
// =========================================================================

export async function fetchBloodPressureFromSupabase(patientId?: string): Promise<BloodPressureRecord[]> {
  if (!supabase || !patientId) return [];
  try {
    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      systolic: d.systolic,
      diastolic: d.diastolic,
      pulse: d.pulse,
      recordedAt: d.recorded_at,
      notes: d.notes,
      isCritical: d.is_critical,
      statusText: d.status_text,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchGlucoseFromSupabase(patientId?: string): Promise<GlucoseRecord[]> {
  if (!supabase || !patientId) return [];
  try {
    const { data, error } = await supabase
      .from('glucose_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false });
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      glucoseValue: d.glucose_value,
      moment: d.moment,
      recordedAt: d.recorded_at,
      notes: d.notes,
      isCritical: d.is_critical,
      statusText: d.status_text,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchMedicationsFromSupabase(patientId?: string): Promise<Medication[]> {
  if (!supabase || !patientId) return [];
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      name: d.name,
      dosage: d.dosage,
      frequency: d.frequency,
      reminderTimes: d.reminder_times || ['08:00'],
      status: (d.status || (d.is_active ? 'ATIVO' : 'SUSPENSO')) as 'ATIVO' | 'SUSPENSO' | 'CONCLUIDO',
      notes: d.notes,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchAppointmentsFromSupabase(
  patientId?: string,
  allowAllForDoctor: boolean = false
): Promise<Appointment[]> {
  if (!supabase) return [];
  if (!patientId && !allowAllForDoctor) return [];
  try {
    let query = supabase.from('appointments').select('*').order('scheduled_for', { ascending: true });
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      patientName: d.patient_name || 'Paciente',
      patientAge: d.patient_age,
      patientConditions: d.patient_conditions || [],
      doctorName: d.doctor_name,
      clinicName: d.clinic_name,
      scheduledFor: d.scheduled_for,
      appointmentType: d.appointment_type,
      notes: d.notes,
      status: d.status,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchPatientsFromSupabase(): Promise<Patient[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('patients').select('*').order('name');
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      name: d.name,
      email: d.email,
      age: d.age,
      gender: d.gender,
      conditions: d.conditions || ['HAS'],
      riskLevel: d.risk_level,
      healthcareUnit: d.healthcare_unit,
      avatarUrl: d.avatar_url,
      adherenceRate: d.adherence_rate,
      phone: d.phone,
      createdAt: d.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchAlertsFromSupabase(patientId?: string): Promise<ClinicalAlert[]> {
  if (!supabase) return [];
  try {
    let query = supabase.from('clinical_alerts').select('*').order('triggered_at', { ascending: false });
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      patientId: d.patient_id,
      patientName: d.patient_name,
      patientAge: d.patient_age,
      patientConditions: d.patient_conditions || [],
      severity: d.severity,
      title: d.title,
      message: d.message,
      valueRecorded: d.value_recorded,
      metricType: d.metric_type,
      status: d.status,
      triggeredAt: d.triggered_at,
    }));
  } catch {
    return [];
  }
}
