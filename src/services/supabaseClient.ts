import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project.supabase.co')
);

// Cliente Supabase configurado para enviar o Firebase UID e ID Token em todas as requisições
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        const currentUser = getAuth().currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken();
      },
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options.headers);
          const currentUser = getAuth().currentUser;
          if (currentUser?.uid) {
            headers.set('x-firebase-uid', currentUser.uid);
          }
          return fetch(url, { ...options, headers });
        },
      },
    })
  : null;

/**
 * Helper para obter o UID alfanumérico atual do Firebase Auth (com fallback seguro para sessão ativa)
 */
export function getCurrentFirebaseUid(fallbackUserId?: string): string {
  const fbUser = getAuth().currentUser;
  if (fbUser?.uid) return fbUser.uid;
  if (fallbackUserId) return fallbackUserId;
  throw new Error('Usuário não autenticado no Firebase Auth.');
}

// =========================================================================
// FUNÇÕES ASSÍNCRONAS DE SALVAMENTO DIRETO NO SUPABASE (COM TRY/CATCH)
// =========================================================================

/**
 * 1. Salvar / Atualizar Perfil Cadastral do Paciente ou Profissional (UserProfileModal)
 */
export async function saveUserProfileToSupabase(formData: {
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
      const { data, error } = await supabase
        .from('patients')
        .upsert(
          {
            id: `pat-${userId}`,
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
      const { data, error } = await supabase
        .from('professionals')
        .upsert(
          {
            id: `prof-${userId}`,
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
      .insert([
        {
          id: `bp-${Date.now()}`,
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
      ])
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
      .insert([
        {
          id: `glu-${Date.now()}`,
          user_id: userId,
          patient_id: formData.patientId || `pat-${userId}`,
          glucose_value: val,
          moment: formData.moment,
          recorded_at: formData.recordedAt || new Date().toISOString(),
          notes: formData.notes || null,
          is_critical: isCritical,
          status_text: statusText,
        },
      ])
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
      .insert([
        {
          id: `med-${Date.now()}`,
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
      ])
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
      .insert([
        {
          id: `app-${Date.now()}`,
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
      ])
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
      .insert([
        {
          id: `sym-${Date.now()}`,
          user_id: userId,
          patient_id: formData.patientId || `pat-${userId}`,
          symptoms: formData.symptoms,
          severity: formData.severity,
          notes: formData.notes || null,
          recorded_at: new Date().toISOString(),
        },
      ])
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
      .insert([
        {
          id: `alt-${Date.now()}`,
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
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[Supabase] Erro ao salvar alerta clínico:', error.message || error);
    throw error;
  }
}
