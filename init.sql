-- ========================================================
-- Schema Initialization for PostgreSQL: Rota da Saúde
-- Hipertensão & Diabetes - Clean Architecture
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Users (Central Auth Entity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('PATIENT', 'PROFESSIONAL', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Patients Profile
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    conditions TEXT[] NOT NULL DEFAULT '{}', -- e.g. ARRAY['HAS', 'DM']
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('BAIXO', 'MODERADO', 'ALTO')),
    healthcare_unit VARCHAR(255) NOT NULL DEFAULT 'Clínica da Família',
    avatar_url TEXT,
    adherence_rate INT DEFAULT 85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Professionals Profile (Doctors / Nurses)
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crm VARCHAR(50) NOT NULL,
    specialty VARCHAR(100) NOT NULL DEFAULT 'Clínico Geral / Medicina da Família',
    healthcare_unit VARCHAR(255) NOT NULL DEFAULT 'Clínica da Família / Unidade Básica',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Blood Pressure Records
CREATE TABLE IF NOT EXISTS blood_pressure_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    pulse INT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Glucose Records
CREATE TABLE IF NOT EXISTS glucose_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    glucose_value INT NOT NULL,
    measurement_moment VARCHAR(50) NOT NULL, -- 'EM_JEJUM', 'ANTES_ALMOCO', 'APOS_ALMOCO', etc.
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Medications
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    reminder_times TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    appointment_type VARCHAR(100) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AGENDADA',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Clinical Alerts
CREATE TABLE IF NOT EXISTS clinical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('CRITICO', 'ATENCAO', 'INFO')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    value_recorded VARCHAR(100),
    metric_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Educational Content (Mitos e Verdades)
CREATE TABLE IF NOT EXISTS educational_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('MITO', 'VERDADE')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('DIABETES', 'PRESSAO', 'GERAL')),
    title VARCHAR(255) NOT NULL,
    statement TEXT NOT NULL,
    explanation TEXT NOT NULL,
    source VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bp_patient_date ON blood_pressure_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_glucose_patient_date ON glucose_records(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON clinical_alerts(patient_id, severity, status);
CREATE INDEX IF NOT EXISTS idx_meds_patient ON medications(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, scheduled_for ASC);
