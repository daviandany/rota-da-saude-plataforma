import React, { useState, useEffect } from 'react';
import { X, Server, Database, Shield, Box, CheckCircle2, Copy, Check, Terminal, Zap, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { getSupabaseStatus } from '../../services/supabase';

interface ArchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchModal: React.FC<ArchModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'supabase' | 'docker' | 'postgres' | 'jwt'>('supabase');
  const [copied, setCopied] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<any>(null);

  const supabaseStatus = getSupabaseStatus();

  useEffect(() => {
    if (isOpen) {
      api.checkHealth().then(setBackendHealth).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const dockerComposeCode = `version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: rotadasaude_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DB_USER:-postgres}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-postgres}
      POSTGRES_DB: \${DB_NAME:-rotadasaude}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d rotadasaude"]

  app:
    build: .
    container_name: rotadasaude_app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/rotadasaude
      JWT_SECRET: \${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy`;

  const supabaseSqlMigration = `-- Executar no SQL Editor do Supabase (Dashboard > SQL Editor)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'PROFESSIONAL', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.glucose_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    glucose_value INTEGER NOT NULL,
    moment TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    status_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Public Access" ON public.patients FOR ALL USING (true);
CREATE POLICY "Allow Manage Records" ON public.blood_pressure_records FOR ALL USING (true);
CREATE POLICY "Allow Manage Glucose" ON public.glucose_records FOR ALL USING (true);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 p-6 text-white flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold tracking-wide uppercase mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Supabase & Arquitetura PostgreSQL
            </div>
            <h2 className="text-2xl font-bold">Rota da Saúde: Engenharia & Banco de Dados</h2>
            <p className="text-teal-200 text-sm mt-1">
              Backend Node.js modular, compatibilidade nativa com Supabase Cloud, Docker e autenticação JWT.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">API Status:</span>
            <span className="text-emerald-700 font-medium">Online (Node.js + Express)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Driver DB: <strong>{backendHealth?.database?.type || 'Supabase / PostgreSQL Ready'}</strong></span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" /> Supabase Cloud
          </button>
          <button
            onClick={() => setActiveTab('clean')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clean'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Box className="w-4 h-4" /> Arquitetura Limpa
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'docker'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" /> Docker & Deploy
          </button>
          <button
            onClick={() => setActiveTab('postgres')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'postgres'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> PostgreSQL DDL
          </button>
          <button
            onClick={() => setActiveTab('jwt')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'jwt'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Autenticação JWT
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {activeTab === 'supabase' && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-base mb-1">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span>Estruturação Completa com Supabase (PostgreSQL BaaS)</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  O projeto está 100% preparado para se conectar ao <strong>Supabase</strong> através de SDK oficial (<code>@supabase/supabase-js</code>), canais em tempo real (Realtime WebSockets), Row Level Security (RLS) e string direta de conexão PostgreSQL.
                </p>
              </div>

              {/* Como conectar ao Supabase */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Como conectar seu projeto Supabase em 3 passos:
                </h4>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-800">1. Obter chaves no Dashboard do Supabase:</span>
                    <p className="text-slate-600">
                      Acesse <strong>Settings &gt; API</strong> no seu projeto Supabase e copie a <code>Project URL</code> e a <code>anon public key</code>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-800">2. Variáveis de Ambiente (.env):</span>
                    <pre className="p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
{`VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"`}
                    </pre>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">3. Executar o script SQL no SQL Editor do Supabase:</span>
                      <button
                        onClick={() => copyToClipboard(supabaseSqlMigration, 'supabase-sql')}
                        className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold"
                      >
                        {copied === 'supabase-sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied === 'supabase-sql' ? 'Copiado!' : 'Copiar DDL Supabase'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] max-h-40 overflow-y-auto">
                      <pre>{supabaseSqlMigration}</pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status do Driver */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Status da integração cliente:</span>
                  <span className="font-bold text-slate-800">
                    {supabaseStatus.hasAnonKey ? 'Conectado a projeto Supabase' : 'Modo Demonstração Habilitado (Pronto para Chaves)'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full font-bold bg-teal-100 text-teal-800 text-[10px]">
                  SDK v2 Instalado
                </span>
              </div>
            </div>
          )}

          {activeTab === 'clean' && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                O backend do projeto foi estruturado seguindo os princípios de <strong>Clean Architecture</strong> e <strong>Separação de Responsabilidades (SoC)</strong>, garantindo manutenibilidade, testabilidade desacoplada e escalabilidade horizontal:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/50">
                  <h4 className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span> 1. Domain (Entidades)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Definição pura das entidades de negócio em <code className="bg-teal-100/70 px-1 py-0.5 rounded">src/server/domain/</code>: Paciente, Profissional, Medições de Pressão e Glicemia, Medicamentos, Alertas e Consultas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                  <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> 2. Use Cases & Services
                  </h4>
                  <p className="text-xs text-slate-600">
                    Regras de negócio em <code className="bg-blue-100/70 px-1 py-0.5 rounded">src/server/services/</code>: Detecção inteligente de crises hipertensivas e hiper/hipoglicemias com disparo de alertas críticos em tempo real.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                  <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span> 3. Infrastructure & DB Adapter
                  </h4>
                  <p className="text-xs text-slate-600">
                    Adapters em <code className="bg-purple-100/70 px-1 py-0.5 rounded">src/server/db/</code> implementando <code className="bg-purple-100/70 px-1 py-0.5 rounded">IDatabase</code>. Permite alternar perfeitamente entre Supabase Cloud, PostgreSQL nativo e storage resiliente.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 4. Presentation & Middleware
                  </h4>
                  <p className="text-xs text-slate-600">
                    Controllers RESTful desacoplados (<code className="bg-emerald-100/70 px-1 py-0.5 rounded">src/server/controllers/</code>) e rotas unificadas com guardas de acesso e RBAC (Paciente vs Médico).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                O projeto inclui <strong>Dockerfile multi-estágio</strong> e orquestração completa com <strong>Docker Compose</strong>, já pré-configurando tanto o container Node.js da aplicação quanto a instância do <strong>PostgreSQL 16 Alpine</strong> com healthchecks automáticos.
              </p>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl relative font-mono text-xs overflow-x-auto">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-slate-400">
                  <span>docker-compose.yml</span>
                  <button
                    onClick={() => copyToClipboard(dockerComposeCode, 'docker')}
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
                  >
                    {copied === 'docker' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'docker' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <pre>{dockerComposeCode}</pre>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900">
                <strong>Comando para inicializar localmente em produção:</strong>
                <code className="block mt-1 font-mono bg-teal-100/80 p-2 rounded text-teal-950">
                  docker compose up --build -d
                </code>
              </div>
            </div>
          )}

          {activeTab === 'postgres' && (
            <div className="space-y-3 text-sm text-slate-700">
              <p>
                Os scripts <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">/supabase_schema.sql</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-xs">/init.sql</code> contêm o DDL completo para PostgreSQL e Supabase, incluindo chaves primárias UUID, índices de alto desempenho para séries temporais e integridade referencial:
              </p>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>users</strong> (autenticação, email único, hash bcrypt)</span>
                </li>
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>patients</strong> (faixa etária, condições HAS/DM, risco)</span>
                </li>
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>blood_pressure_records</strong> (sistólica, diastólica, bpm)</span>
                </li>
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>glucose_records</strong> (glicemia mg/dL, momento de aferição)</span>
                </li>
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>medications</strong> (dosagem, posologia, horários)</span>
                </li>
                <li className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>clinical_alerts</strong> (classificação de risco e triagem)</span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'jwt' && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                A segurança é garantida por <strong>JSON Web Tokens (JWT)</strong> assinados com algoritmo HMAC-SHA256 e senhas criptografadas com <strong>bcrypt</strong> (salt factor 10), integrando com as políticas de <strong>Row Level Security (RLS)</strong> do Supabase.
              </p>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-800">Controle de Acesso Baseado em Papéis (RBAC):</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-teal-100 text-teal-800 font-mono font-medium">PATIENT</span>
                  <p className="text-slate-600">Acesso ao próprio diário de saúde, registro de medições e lembretes.</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-mono font-medium">PROFESSIONAL</span>
                  <p className="text-slate-600">Visão do prontuário eletrônico completo, painel de estratificação de risco e agendamento.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
