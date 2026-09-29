import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  FileText,
  Activity,
  Heart,
  Droplet,
  Pill,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Bell,
  Clock,
  Radio,
  Send,
  CheckCircle2,
  Stethoscope,
  BarChart3,
  UserPlus,
  Zap,
  Check,
  Building,
} from 'lucide-react';
import { api } from '../../services/api';
import { Patient, ClinicalAlert, Appointment, Medication } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface WebDoctorDashboardProps {
  onOpenNewAppointment: () => void;
  onOpenAddMedication: (patientId?: string) => void;
  onOpenNotificationCenter: () => void;
  onOpenNewPatient?: () => void;
  onOpenQuickAlert?: () => void;
}

type DoctorWebTab = 'dashboard' | 'patients' | 'alerts' | 'appointments' | 'prescriptions' | 'analytics';

export const WebDoctorDashboard: React.FC<WebDoctorDashboardProps> = ({
  onOpenNewAppointment,
  onOpenAddMedication,
  onOpenNotificationCenter,
  onOpenNewPatient,
  onOpenQuickAlert,
}) => {
  const { testCriticalReading } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'dashboard' | 'patients' | 'alerts' | 'appointments' | 'prescriptions' | 'analytics'
  const [activeTab, setActiveTab] = useState<DoctorWebTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'TODOS' | 'ALTO' | 'MODERADO' | 'BAIXO'>('TODOS');
  const [alertSimulationSuccess, setAlertSimulationSuccess] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const [dashStats, pts, alrts, appts] = await Promise.all([
        api.getDoctorDashboard(),
        api.getDoctorPatients(),
        api.getAlerts(),
        api.getAppointments(),
      ]);

      setStats(dashStats);
      setPatients(pts);
      setAlerts(alrts);
      setAppointments(appts);
    } catch (e) {
      console.error('Failed to load doctor dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleSelectPatient = async (patientId: string) => {
    try {
      const details = await api.getPatientProfile(patientId);
      setSelectedPatient(details);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerSimulatedAlert = async (type: 'PRESSURE' | 'GLUCOSE') => {
    await testCriticalReading(type);
    setAlertSimulationSuccess(
      type === 'PRESSURE'
        ? 'Alerta crítico de Pressão Arterial (175/105 mmHg) disparado via FCM com sucesso!'
        : 'Alerta crítico de Hipoglicemia (52 mg/dL) disparado via FCM com sucesso!'
    );
    setTimeout(() => setAlertSimulationSuccess(null), 4000);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.conditions && p.conditions.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesRisk = riskFilter === 'TODOS' || p.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE ACESSOS RÁPIDOS CLÍNICOS (QUICK ACCESS BAR) */}
      <section aria-label="Acessos Rápidos Clínicos" className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">Acessos Rápidos Médicos:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewAppointment}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Agendar nova consulta médica na UBS"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>+ Consulta</span>
            </button>

            {onOpenNewPatient && (
              <button
                onClick={onOpenNewPatient}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Cadastrar novo paciente no programa Hiperdia"
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>+ Paciente</span>
              </button>
            )}

            <button
              onClick={() => onOpenAddMedication()}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Prescrever medicamento RENAME"
            >
              <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>+ Prescrição</span>
            </button>

            {onOpenQuickAlert && (
              <button
                onClick={onOpenQuickAlert}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Emitir alerta clínico prioritário"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>+ Alerta Clínico</span>
              </button>
            )}

            <button
              onClick={() => handleTriggerSimulatedAlert('PRESSURE')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
              title="Simular disparo de alerta crítico de PA via FCM"
            >
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span>Simular Crise PA</span>
            </button>

            <button
              onClick={onOpenNotificationCenter}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
              title="Abrir Central de Push Notifications FCM"
            >
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>Push FCM</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE ABAS PRINCIPAIS (TABS NAVIGATION) */}
      <nav aria-label="Navegação do Médico em Abas" className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-900 rounded-2xl overflow-x-auto border border-slate-300/60 dark:border-slate-800">
        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('dashboard');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard' && !selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão Geral & Triagem</span>
        </button>

        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('patients');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'patients' || selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Pacientes</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {patients.length}
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('alerts');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'alerts' && !selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Alertas Críticos</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
            {alerts.length}
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('appointments');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'appointments' && !selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda de Consultas</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('prescriptions');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'prescriptions' && !selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Farmácia & Prescrições</span>
        </button>

        <button
          onClick={() => {
            setSelectedPatient(null);
            setActiveTab('analytics');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics' && !selectedPatient
              ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Indicadores Previne Brasil</span>
        </button>
      </nav>

      {/* Alert Simulation Feedback */}
      {alertSimulationSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{alertSimulationSuccess}</span>
          </div>
        </div>
      )}

      {/* Full Patient Dossier (when patient is selected from any tab) */}
      {selectedPatient ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {/* Dossier Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                title="Voltar à lista de pacientes"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img
                src={selectedPatient.patient.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={selectedPatient.patient.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedPatient.patient.name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      selectedPatient.patient.riskLevel === 'ALTO'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : selectedPatient.patient.riskLevel === 'MODERADO'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    Risco {selectedPatient.patient.riskLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{selectedPatient.patient.age} anos</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPatient.patient.gender === 'F' ? 'Feminino' : 'Masculino'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Cartão SUS: {selectedPatient.patient.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddMedication(selectedPatient.patient.id)}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Pill className="w-4 h-4" />
                <span>Prescrever Remédio</span>
              </button>
              <button
                onClick={onOpenNewAppointment}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Retorno</span>
              </button>
            </div>
          </div>

          {/* Dossier Content Grid: 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                  Aferições Recentes no Prontuário
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Última PA Registrada</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedPatient.latestPressure?.value || '120/80'} mmHg
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Última Glicemia</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedPatient.latestGlucose?.value || '108'} mg/dL
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Histórico de acompanhamento clínico regular. Paciente com boa adesão terapêutica na Unidade Básica.
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Diagnóstico & Condições
                </h4>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedPatient.patient.conditions?.map((c: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium">
                      {c}
                    </span>
                  ))}
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Equipe de Referência
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  UBS Dr. Manoel de Abreu · Equipe ESF 04<br />
                  ACS: Maria Aparecida dos Santos
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* ABA 1: VISÃO GERAL & TRIAGEM (NÃO ACUMULA TUDO!)                          */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Clinical KPI Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Consultas Hoje */}
                <div
                  onClick={() => setActiveTab('appointments')}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Consultas Hoje</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {stats?.consultasHoje || appointments.length || '8'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">pacientes</span>
                  </div>
                  <div className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <span>Ver agenda do dia</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Card 2: Alertas Críticos */}
                <div
                  onClick={() => setActiveTab('alerts')}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Alertas de Risco</span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      {alerts.length || stats?.alertasAtivos || '15'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">prioritários</span>
                  </div>
                  <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <span>Acessar triagem</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Card 3: Pacientes Monitorados */}
                <div
                  onClick={() => setActiveTab('patients')}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Pacientes Vinculados</span>
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {patients.length || stats?.pacientesTotal || '128'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">cadastrados</span>
                  </div>
                  <div className="mt-2 text-[11px] text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1">
                    <span>Gerenciar prontuários</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Card 4: Taxa de Controle Clínico */}
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Controle Clínico</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {stats?.atendimentosTaxa || '82%'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">na meta SUS</span>
                  </div>
                  <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Índices dentro dos parâmetros
                  </div>
                </div>
              </div>

              {/* Overview Split: Priority Triage (Top 3) & Agenda Snapshot (Next 3) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left (7 cols): High Priority Triage Feed */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Fila de Triagem Prioritária (Resumo)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ver todos ({alerts.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {alerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{alert.patientName}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                                {alert.metricType === 'PRESSURE' ? 'PA Severa' : 'Glicemia'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">{alert.message}</p>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Aferição: {alert.valueRecorded || 'Crítica'} · {new Date(alert.triggeredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (alert.patientId) handleSelectPatient(alert.patientId);
                            else setActiveTab('patients');
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shrink-0"
                        >
                          Prontuário
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right (5 cols): Today's Consultations Snapshot */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Agenda Hoje (UBS Manoel de Abreu)</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ver agenda</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {appointments.slice(0, 3).map((appt) => (
                      <div
                        key={appt.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{appt.patientName}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(appt.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {appt.appointmentType.includes('RETORNO') ? 'Retorno' : 'Rotina'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                          Confirmada
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={onOpenNewAppointment}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Agendar Próximo Paciente</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: GESTÃO DE PACIENTES                                                */}
          {/* ========================================================================= */}
          {activeTab === 'patients' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Pacientes Cadastrados na ESF ({filteredPatients.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estratificação de risco cardiovascular e prontuário ambulatorial.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar paciente ou condição..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Filter */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                    {(['TODOS', 'ALTO', 'MODERADO', 'BAIXO'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setRiskFilter(lvl)}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          riskFilter === lvl
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {lvl === 'TODOS' ? 'Todos' : `Risco ${lvl}`}
                      </button>
                    ))}
                  </div>

                  {onOpenNewPatient && (
                    <button
                      onClick={onOpenNewPatient}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Cadastrar Paciente</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold">
                    <tr className="border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Paciente</th>
                      <th className="py-3 px-4">Idade / Sexo</th>
                      <th className="py-3 px-4">Diagnóstico</th>
                      <th className="py-3 px-4">Estratificação de Risco</th>
                      <th className="py-3 px-4">Ações Clínicas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPatients.map((pt) => (
                      <tr key={pt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={pt.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                              alt={pt.name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{pt.name}</div>
                              <div className="text-[10px] text-slate-400">Cartão SUS: {pt.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {pt.age} anos · {pt.gender === 'F' ? 'F' : 'M'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {pt.conditions?.join(', ') || 'Hipertensão Arterial'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              pt.riskLevel === 'ALTO'
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : pt.riskLevel === 'MODERADO'
                                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            Risco {pt.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectPatient(pt.id)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition"
                            >
                              Ver Prontuário
                            </button>
                            <button
                              onClick={() => onOpenAddMedication(pt.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                            >
                              Prescrever
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: ALERTAS CRÍTICOS                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'alerts' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>Central de Alertas e Crises Clínicas ({alerts.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Notificações automáticas de pressão severa (&gt; 160/100 mmHg) e hipo/hiperglicemia.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTriggerSimulatedAlert('PRESSURE')}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition"
                  >
                    + Simular Alerta PA (175/105)
                  </button>
                  <button
                    onClick={() => handleTriggerSimulatedAlert('GLUCOSE')}
                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition"
                  >
                    + Simular Hipo (52 mg/dL)
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{al.patientName}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                            {al.metricType === 'PRESSURE' ? 'Crise Hipertensiva' : 'Descompensação Glicêmica'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{al.message}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Registro: {al.valueRecorded} · {new Date(al.triggeredAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (al.patientId) handleSelectPatient(al.patientId);
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition"
                      >
                        Prontuário
                      </button>
                      <button
                        onClick={onOpenNewAppointment}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Agendar Encaixe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: AGENDA DE CONSULTAS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'appointments' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Agenda Ambulatorial · UBS Dr. Manoel de Abreu
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Consultas agendadas para acompanhamento de Hipertensão e Diabetes (Hiperdia).
                  </p>
                </div>

                <button
                  onClick={onOpenNewAppointment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Consulta</span>
                </button>
              </div>

              <div className="space-y-3">
                {appointments.map((ap) => (
                  <div
                    key={ap.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{ap.patientName}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(ap.scheduledFor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · Consultório 03
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">
                        {ap.appointmentType.includes('RETORNO') ? 'Retorno Hiperdia' : 'Primeira Consulta'}
                      </span>
                      <button
                        onClick={() => {
                          if (ap.patientId) handleSelectPatient(ap.patientId);
                        }}
                        className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        Prontuário
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 5: FARMÁCIA & PRESCRIÇÕES SUS (RENAME)                                  */}
          {/* ========================================================================= */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Formulário RENAME e Prescrições da Equipe
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Relação Nacional de Medicamentos Essenciais disponíveis na Farmácia Básica Municipal.
                  </p>
                </div>

                <button
                  onClick={() => onOpenAddMedication()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Emitir Nova Prescrição</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Losartana Potássica', dose: '50 mg', cat: 'Anti-hipertensivo (BRA)', estoque: 'Disponível na UBS' },
                  { name: 'Hidroclorotiazida', dose: '25 mg', cat: 'Diurético Tiazídico', estoque: 'Disponível na UBS' },
                  { name: 'Enalapril Maleato', dose: '10 mg / 20 mg', cat: 'Anti-hipertensivo (iECA)', estoque: 'Disponível na UBS' },
                  { name: 'Anlodipino Besilato', dose: '5 mg', cat: 'Bloqueador Canal Cálcio', estoque: 'Disponível na UBS' },
                  { name: 'Metformina Cloridrato', dose: '500 mg / 850 mg', cat: 'Antidiabético Oral', estoque: 'Disponível na UBS' },
                  { name: 'Glibenclamida', dose: '5 mg', cat: 'Sulfonilureia', estoque: 'Disponível na UBS' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        {item.dose}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.cat}</p>
                    <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{item.estoque}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 6: INDICADORES PREVINE BRASIL & SUS                                   */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Indicadores de Desempenho do Previne Brasil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Metas pactuadas de acompanhamento clínico e financiamento da Atenção Primária.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Proporção de Hipertensos com PA Aferida
                  </span>
                  <div className="text-2xl font-black text-teal-700 dark:text-teal-300">88%</div>
                  <p className="text-[11px] text-emerald-600 font-bold">Meta MS superada (&gt; 50%)</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Proporção de Diabéticos com HbA1c Solicitada
                  </span>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-300">79%</div>
                  <p className="text-[11px] text-blue-600 font-bold">Semestre atual em conformidade</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Adesão aos Lembretes Digitais (FCM)
                  </span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">92%</div>
                  <p className="text-[11px] text-emerald-600 font-bold">Canal push ativo e responsivo</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
