-- =========================================================================
-- ROTA DA SAÚDE: HIPERTENSÃO & DIABETES
-- SCRIPT SQL COMPLETO PARA SUPABASE (POSTGRESQL + FIREBASE AUTH UID + RLS)
-- =========================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNÇÃO HELPER DE IDENTIDADE FIREBASE AUTH (UID ALFANUMÉRICO COMO TEXT)
-- Extrai o UID do Firebase a partir do JWT (sub / user_id) ou do cabeçalho x-firebase-uid
CREATE OR REPLACE FUNCTION public.firebase_uid()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'), ''),
    NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_id'), ''),
    NULLIF((NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'x-firebase-uid'), '')
  );
$$;

-- =========================================================================
-- TABELAS DO SISTEMA (TODAS COM user_id TEXT PARA O UID DO FIREBASE AUTH)
-- =========================================================================

-- 1. Tabela de Usuários (Autenticação e Perfil Base)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'firebase-auth',
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'PROFESSIONAL', 'ADMIN')) DEFAULT 'PATIENT',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Pacientes (Cadastro Clínico Hiperdia - UserProfileModal / NewPatientModal)
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER NOT NULL DEFAULT 50,
    gender TEXT NOT NULL DEFAULT 'Não informado',
    conditions TEXT[] NOT NULL DEFAULT ARRAY['HAS']::TEXT[],
    risk_level TEXT NOT NULL CHECK (risk_level IN ('BAIXO', 'MODERADO', 'ALTO')) DEFAULT 'MODERADO',
    healthcare_unit TEXT NOT NULL DEFAULT 'UBS de Referência',
    avatar_url TEXT,
    adherence_rate INTEGER DEFAULT 90,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Profissionais de Saúde (Médicos / Enfermeiros - UserProfileModal)
CREATE TABLE IF NOT EXISTS public.professionals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    crm TEXT NOT NULL,
    specialty TEXT NOT NULL DEFAULT 'Medicina de Família e Comunidade',
    healthcare_unit TEXT NOT NULL DEFAULT 'UBS de Referência',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Aferições de Pressão Arterial (RegisterPressureModal)
CREATE TABLE IF NOT EXISTS public.blood_pressure_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    pulse INTEGER NOT NULL DEFAULT 72,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    status_text TEXT NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Aferições de Glicemia Capilar (RegisterGlucoseModal)
CREATE TABLE IF NOT EXISTS public.glucose_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    glucose_value INTEGER NOT NULL,
    moment TEXT NOT NULL CHECK (moment IN ('EM_JEJUM', 'ANTES_ALMOCO', 'APOS_ALMOCO', 'ANTES_JANTAR', 'APOS_JANTAR', 'AO_DORMIR')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    status_text TEXT NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela de Medicamentos e Prescrições (AddMedicationModal & PatientMedications)
CREATE TABLE IF NOT EXISTS public.medications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    reminder_times TEXT[] NOT NULL DEFAULT ARRAY['08:00']::TEXT[],
    status TEXT NOT NULL CHECK (status IN ('ATIVO', 'SUSPENSO', 'CONCLUIDO')) DEFAULT 'ATIVO',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela de Consultas e Agendamentos na UBS (ScheduleAppointmentModal & NewAppointmentModal)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    professional_id TEXT,
    patient_name TEXT NOT NULL DEFAULT 'Paciente',
    patient_age INTEGER,
    patient_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    doctor_name TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    appointment_type TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('AGENDADA', 'REALIZADA', 'CANCELADA')) DEFAULT 'AGENDADA',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabela de Registro Diário de Sintomas e Bem-Estar (RegisterSymptomModal)
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    severity TEXT NOT NULL CHECK (severity IN ('BAIXA', 'MEDIA', 'ALTA')) DEFAULT 'BAIXA',
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Tabela de Alertas Clínicos e Triagem de Risco (DoctorQuickAlertModal & Alertas Automáticos)
CREATE TABLE IF NOT EXISTS public.clinical_alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER,
    patient_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    severity TEXT NOT NULL CHECK (severity IN ('CRITICO', 'ATENCAO', 'INFO')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    value_recorded TEXT,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('PRESSURE', 'GLUCOSE', 'GENERAL')) DEFAULT 'GENERAL',
    status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'RESOLVIDO')) DEFAULT 'PENDENTE',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Tabela de Tokens FCM e Notificações Push (NotificationCenterModal)
CREATE TABLE IF NOT EXISTS public.notification_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT COALESCE(public.firebase_uid(), 'system'),
    token TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'PROFESSIONAL')) DEFAULT 'PATIENT',
    platform TEXT NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Tabela de Conteúdos Educativos (Mitos e Verdades)
CREATE TABLE IF NOT EXISTS public.educational_contents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MITO', 'VERDADE')),
    category TEXT NOT NULL CHECK (category IN ('DIABETES', 'PRESSAO', 'GERAL')),
    explanation TEXT NOT NULL,
    source TEXT
);

-- =========================================================================
-- GARANTIA DE COLUNA user_id TEXT EM TABELAS PREEXISTENTES
-- =========================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.blood_pressure_records ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.glucose_records ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';
ALTER TABLE public.clinical_alerts ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'system';

-- =========================================================================
-- ÍNDICES DE PERFORMANCE (POR user_id E patient_id)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON public.professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_bp_user_id ON public.blood_pressure_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bp_patient_date ON public.blood_pressure_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_glucose_user_id ON public.glucose_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_glucose_patient_date ON public.glucose_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_id ON public.symptom_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.clinical_alerts(user_id, status);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_contents ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- POLÍTICAS DE SEGURANÇA (RLS POLICIES) BASEADAS EM user_id = firebase_uid()
-- =========================================================================

-- 1. Policies para public.users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 2. Policies para public.patients
DROP POLICY IF EXISTS "patients_select_own" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own" ON public.patients;
DROP POLICY IF EXISTS "patients_update_own" ON public.patients;
DROP POLICY IF EXISTS "patients_delete_own" ON public.patients;

CREATE POLICY "patients_select_own" ON public.patients FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "patients_insert_own" ON public.patients FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "patients_update_own" ON public.patients FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "patients_delete_own" ON public.patients FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 3. Policies para public.professionals
DROP POLICY IF EXISTS "professionals_select_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete_own" ON public.professionals;

CREATE POLICY "professionals_select_own" ON public.professionals FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "professionals_insert_own" ON public.professionals FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "professionals_update_own" ON public.professionals FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "professionals_delete_own" ON public.professionals FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 4. Policies para public.blood_pressure_records
DROP POLICY IF EXISTS "bp_select_own" ON public.blood_pressure_records;
DROP POLICY IF EXISTS "bp_insert_own" ON public.blood_pressure_records;
DROP POLICY IF EXISTS "bp_update_own" ON public.blood_pressure_records;
DROP POLICY IF EXISTS "bp_delete_own" ON public.blood_pressure_records;

CREATE POLICY "bp_select_own" ON public.blood_pressure_records FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "bp_insert_own" ON public.blood_pressure_records FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "bp_update_own" ON public.blood_pressure_records FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "bp_delete_own" ON public.blood_pressure_records FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 5. Policies para public.glucose_records
DROP POLICY IF EXISTS "glucose_select_own" ON public.glucose_records;
DROP POLICY IF EXISTS "glucose_insert_own" ON public.glucose_records;
DROP POLICY IF EXISTS "glucose_update_own" ON public.glucose_records;
DROP POLICY IF EXISTS "glucose_delete_own" ON public.glucose_records;

CREATE POLICY "glucose_select_own" ON public.glucose_records FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "glucose_insert_own" ON public.glucose_records FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "glucose_update_own" ON public.glucose_records FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "glucose_delete_own" ON public.glucose_records FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 6. Policies para public.medications
DROP POLICY IF EXISTS "medications_select_own" ON public.medications;
DROP POLICY IF EXISTS "medications_insert_own" ON public.medications;
DROP POLICY IF EXISTS "medications_update_own" ON public.medications;
DROP POLICY IF EXISTS "medications_delete_own" ON public.medications;

CREATE POLICY "medications_select_own" ON public.medications FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "medications_insert_own" ON public.medications FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "medications_update_own" ON public.medications FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "medications_delete_own" ON public.medications FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 7. Policies para public.appointments
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_own" ON public.appointments;

CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "appointments_insert_own" ON public.appointments FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "appointments_update_own" ON public.appointments FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "appointments_delete_own" ON public.appointments FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 8. Policies para public.symptom_logs
DROP POLICY IF EXISTS "symptom_logs_select_own" ON public.symptom_logs;
DROP POLICY IF EXISTS "symptom_logs_insert_own" ON public.symptom_logs;
DROP POLICY IF EXISTS "symptom_logs_update_own" ON public.symptom_logs;
DROP POLICY IF EXISTS "symptom_logs_delete_own" ON public.symptom_logs;

CREATE POLICY "symptom_logs_select_own" ON public.symptom_logs FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "symptom_logs_insert_own" ON public.symptom_logs FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "symptom_logs_update_own" ON public.symptom_logs FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "symptom_logs_delete_own" ON public.symptom_logs FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 9. Policies para public.clinical_alerts
DROP POLICY IF EXISTS "alerts_select_own" ON public.clinical_alerts;
DROP POLICY IF EXISTS "alerts_insert_own" ON public.clinical_alerts;
DROP POLICY IF EXISTS "alerts_update_own" ON public.clinical_alerts;
DROP POLICY IF EXISTS "alerts_delete_own" ON public.clinical_alerts;

CREATE POLICY "alerts_select_own" ON public.clinical_alerts FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "alerts_insert_own" ON public.clinical_alerts FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "alerts_update_own" ON public.clinical_alerts FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "alerts_delete_own" ON public.clinical_alerts FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 10. Policies para public.notification_tokens
DROP POLICY IF EXISTS "tokens_select_own" ON public.notification_tokens;
DROP POLICY IF EXISTS "tokens_insert_own" ON public.notification_tokens;
DROP POLICY IF EXISTS "tokens_update_own" ON public.notification_tokens;
DROP POLICY IF EXISTS "tokens_delete_own" ON public.notification_tokens;

CREATE POLICY "tokens_select_own" ON public.notification_tokens FOR SELECT USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "tokens_insert_own" ON public.notification_tokens FOR INSERT WITH CHECK (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "tokens_update_own" ON public.notification_tokens FOR UPDATE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');
CREATE POLICY "tokens_delete_own" ON public.notification_tokens FOR DELETE USING (user_id = public.firebase_uid() OR public.firebase_uid() IS NULL OR public.firebase_uid() = 'system');

-- 11. Policies para public.educational_contents
DROP POLICY IF EXISTS "educational_select_all" ON public.educational_contents;
CREATE POLICY "educational_select_all" ON public.educational_contents FOR SELECT USING (true);
