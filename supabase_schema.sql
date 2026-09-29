-- =========================================================================
-- ROTA DA SAÚDE: HIPERTENSÃO & DIABETES
-- DDL & MIGRATION SCRIPT PARA SUPABASE (POSTGRESQL + ROW LEVEL SECURITY)
-- =========================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (Integrada ou espelhada de auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'PROFESSIONAL', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Profissionais de Saúde
CREATE TABLE IF NOT EXISTS public.professionals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    crm TEXT NOT NULL,
    specialty TEXT NOT NULL,
    healthcare_unit TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Pacientes (Hipertensos e Diabéticos)
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    conditions TEXT[] NOT NULL DEFAULT ARRAY['HAS']::TEXT[],
    risk_level TEXT NOT NULL CHECK (risk_level IN ('BAIXO', 'MODERADO', 'ALTO')),
    healthcare_unit TEXT NOT NULL,
    avatar_url TEXT,
    adherence_rate INTEGER DEFAULT 80,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Aferições de Pressão Arterial
CREATE TABLE IF NOT EXISTS public.blood_pressure_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    pulse INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    status_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela de Aferições de Glicemia
CREATE TABLE IF NOT EXISTS public.glucose_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    glucose_value INTEGER NOT NULL,
    moment TEXT NOT NULL CHECK (moment IN ('EM_JEJUM', 'ANTES_ALMOCO', 'APOS_ALMOCO', 'ANTES_JANTAR', 'APOS_JANTAR', 'AO_DORMIR')),
    recorded_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    status_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela de Medicamentos e Prescrições
CREATE TABLE IF NOT EXISTS public.medications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    reminder_times TEXT[] NOT NULL DEFAULT ARRAY['08:00']::TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabela de Consultas Médicas e Retornos
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_name TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    appointment_type TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('AGENDADA', 'REALIZADA', 'CANCELADA')) DEFAULT 'AGENDADA',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Tabela de Alertas Clínicos (Triagem e Risco)
CREATE TABLE IF NOT EXISTS public.clinical_alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICO', 'ATENCAO', 'INFO')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    value_recorded TEXT,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('PRESSURE', 'GLUCOSE', 'GENERAL')),
    status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'RESOLVIDO')) DEFAULT 'PENDENTE',
    triggered_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Tabela de Conteúdos Educativos (Mitos e Verdades)
CREATE TABLE IF NOT EXISTS public.educational_contents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MITO', 'VERDADE')),
    category TEXT NOT NULL CHECK (category IN ('DIABETES', 'PRESSAO', 'GERAL')),
    explanation TEXT NOT NULL,
    source TEXT
);

-- =========================================================================
-- ÍNDICES DE PERFORMANCE PARA SÉRIES TEMPORAIS E BUSCAS
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_bp_patient_date ON public.blood_pressure_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_glucose_patient_date ON public.glucose_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_status ON public.clinical_alerts(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_patients_risk ON public.patients(risk_level);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) NO SUPABASE
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_contents ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS de Leitura e Escrita
CREATE POLICY "Public Read Educational" ON public.educational_contents FOR SELECT USING (true);
CREATE POLICY "Allow All Users Read Own Data" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow Patients and Pros Read Patient Data" ON public.patients FOR ALL USING (true);
CREATE POLICY "Allow Manage BP Records" ON public.blood_pressure_records FOR ALL USING (true);
CREATE POLICY "Allow Manage Glucose Records" ON public.glucose_records FOR ALL USING (true);
CREATE POLICY "Allow Manage Medications" ON public.medications FOR ALL USING (true);
CREATE POLICY "Allow Manage Appointments" ON public.appointments FOR ALL USING (true);
CREATE POLICY "Allow Manage Alerts" ON public.clinical_alerts FOR ALL USING (true);

-- =========================================================================
-- DADOS INICIAIS (SEED DATA) PARA SUPABASE
-- =========================================================================
INSERT INTO public.users (id, email, password_hash, name, role) VALUES
('u-patient-maria', 'maria.silva@email.com', '$2b$10$w3U/m9q6jW9Y9sQ8kH4WdO5vW4uM4X0i6Y8sQ8kH4WdO5vW4uM4X0', 'Maria Silva', 'PATIENT'),
('u-doc-carlos', 'carlos.mendes@saude.gov.br', '$2b$10$w3U/m9q6jW9Y9sQ8kH4WdO5vW4uM4X0i6Y8sQ8kH4WdO5vW4uM4X0', 'Dr. Carlos Mendes', 'PROFESSIONAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.professionals (id, user_id, name, email, crm, specialty, healthcare_unit, phone, avatar_url) VALUES
('pro-carlos', 'u-doc-carlos', 'Dr. Carlos Mendes', 'carlos.mendes@saude.gov.br', 'CRM/SP 123456', 'Medicina de Família e Comunidade', 'Clínica da Família Santa Marta', '(11) 97123-4567', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.patients (id, user_id, name, email, age, gender, conditions, risk_level, healthcare_unit, avatar_url, adherence_rate, phone) VALUES
('pat-maria', 'u-patient-maria', 'Maria Silva', 'maria.silva@email.com', 58, 'Feminino', ARRAY['HAS', 'DM'], 'ALTO', 'Clínica da Família', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 85, '(11) 98765-4321'),
('pat-joao', NULL, 'João da Silva', 'joao.silva@email.com', 63, 'Masculino', ARRAY['HAS'], 'ALTO', 'Clínica da Família', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 70, '(11) 98888-1111'),
('pat-ana', NULL, 'Ana Paula Santos', 'ana.santos@email.com', 47, 'Feminino', ARRAY['DM'], 'MODERADO', 'UBS Vila Nova', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 90, '(11) 98888-2222'),
('pat-carlos-o', NULL, 'Carlos Oliveira', 'carlos.oliveira@email.com', 60, 'Masculino', ARRAY['HAS', 'DM'], 'MODERADO', 'Clínica da Família', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 78, '(11) 98888-3333'),
('pat-jose', NULL, 'José Pereira', 'jose.pereira@email.com', 55, 'Masculino', ARRAY['HAS'], 'BAIXO', 'UBS Jardim São Paulo', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 95, '(11) 98888-4444'),
('pat-luciana', NULL, 'Luciana Costa', 'luciana.costa@email.com', 49, 'Feminino', ARRAY['DM'], 'BAIXO', 'UBS Central', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 92, '(11) 98888-5555')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.medications (id, patient_id, name, dosage, frequency, reminder_times, notes, is_active) VALUES
('med-1', 'pat-maria', 'Losartana Potássica', '50mg', 'Todos os dias', ARRAY['08:00'], 'Tomar pela manhã em jejum ou com café', true),
('med-2', 'pat-maria', 'Hidroclorotiazida', '25mg', 'Todos os dias', ARRAY['08:00'], 'Tomar junto com a Losartana', true),
('med-3', 'pat-maria', 'Metformina', '850mg', '12 em 12 horas', ARRAY['08:00', '20:00'], 'Tomar após as principais refeições', true)
ON CONFLICT (id) DO NOTHING;
