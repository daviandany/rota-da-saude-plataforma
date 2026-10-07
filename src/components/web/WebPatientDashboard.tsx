import React, { useState, useEffect } from 'react';
import {
  Heart,
  Droplet,
  Pill,
  Calendar,
  Download,
  PlusCircle,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Bell,
  Radio,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Share2,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  Flame,
  PhoneCall,
  MapPin,
  Info,
  Check,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { PatientSummary, BloodPressureRecord, GlucoseRecord, Medication, Appointment } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { generateMedicalReportPDF } from '../../utils/pdfGenerator';

interface WebPatientDashboardProps {
  onOpenPressureModal: () => void;
  onOpenGlucoseModal: () => void;
  onOpenAddMedication: () => void;
  onOpenNotificationCenter: () => void;
  onOpenSymptomModal?: () => void;
  onOpenEmergencyModal?: () => void;
  onOpenScheduleAppointment?: () => void;
}

type PatientWebTab = 'dashboard' | 'measurements' | 'medications' | 'appointments' | 'reports' | 'education';

export const WebPatientDashboard: React.FC<WebPatientDashboardProps> = ({
  onOpenPressureModal,
  onOpenGlucoseModal,
  onOpenAddMedication,
  onOpenNotificationCenter,
  onOpenSymptomModal,
  onOpenEmergencyModal,
  onOpenScheduleAppointment,
}) => {
  const { testMedicationReminder } = useNotifications();
  const { user } = useAuth();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [pressureHistory, setPressureHistory] = useState<BloodPressureRecord[]>([]);
  const [glucoseHistory, setGlucoseHistory] = useState<GlucoseRecord[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Web Tab: Not leaving everything in the dashboard!
  const [activeTab, setActiveTab] = useState<PatientWebTab>('dashboard');
  const [graphMetric, setGraphMetric] = useState<'pressure' | 'glucose'>('pressure');
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [measurementFilter, setMeasurementFilter] = useState<'ALL' | 'PRESSURE' | 'GLUCOSE' | 'CRITICAL'>('ALL');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [testReminderSent, setTestReminderSent] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentPatientId = user?.profileId || user?.id;
      const [sum, hist, meds, appts] = await Promise.all([
        api.getSummary(currentPatientId),
        api.getHistory(currentPatientId, timeframe),
        api.getMedications(currentPatientId),
        api.getAppointments(currentPatientId),
      ]);

      setSummary(sum);
      setPressureHistory(hist.pressureRecords || []);
      setGlucoseHistory(hist.glucoseRecords || []);
      setMedications(meds);
      setAppointments(appts);
    } catch (e) {
      console.error('Failed to load patient web data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe, user?.id, user?.profileId]);

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const reportData = await api.getReport();
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      generateMedicalReportPDF({
        ...reportData,
        period: {
          startDate: thirtyDaysAgo.toLocaleDateString('pt-BR'),
          endDate: today.toLocaleDateString('pt-BR'),
        },
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      await testMedicationReminder();
      setTestReminderSent(true);
      setTimeout(() => setTestReminderSent(false), 3500);
    } catch (e) {
      console.error('Failed to test reminder:', e);
    }
  };

  // Filtered measurement history for measurements tab
  const combinedReadings = [
    ...pressureHistory.map((p) => ({
      id: p.id,
      type: 'PRESSURE' as const,
      date: new Date(p.recordedAt),
      primaryValue: `${p.systolic}/${p.diastolic} mmHg`,
      secondaryValue: `Pulso: ${p.pulse} bpm`,
      statusText: p.statusText || (p.systolic < 130 && p.diastolic < 85 ? 'Controlada' : p.systolic >= 140 ? 'Elevada' : 'Atenção'),
      isCritical: p.isCritical || p.systolic >= 140 || p.diastolic >= 90,
      notes: p.notes,
    })),
    ...glucoseHistory.map((g) => ({
      id: g.id,
      type: 'GLUCOSE' as const,
      date: new Date(g.recordedAt),
      primaryValue: `${g.glucoseValue} mg/dL`,
      secondaryValue: g.moment ? g.moment.replace('_', ' ') : 'Em jejum',
      statusText: g.statusText || (g.glucoseValue < 100 ? 'Normal' : g.glucoseValue < 140 ? 'Alterada' : 'Elevada'),
      isCritical: g.isCritical || g.glucoseValue < 70 || g.glucoseValue > 180,
      notes: g.notes,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredReadings = combinedReadings.filter((item) => {
    if (measurementFilter === 'PRESSURE') return item.type === 'PRESSURE';
    if (measurementFilter === 'GLUCOSE') return item.type === 'GLUCOSE';
    if (measurementFilter === 'CRITICAL') return item.isCritical;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE ACESSOS RÁPIDOS (QUICK ACCESS BAR) */}
      <section aria-label="Acessos Rápidos" className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">Acessos Rápidos:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenPressureModal}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Registrar aferição de pressão arterial"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-600 dark:text-rose-400" />
              <span>+ Pressão</span>
            </button>

            <button
              onClick={onOpenGlucoseModal}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Registrar teste de glicemia capilar"
            >
              <Droplet className="w-3.5 h-3.5 fill-teal-500/20 text-teal-600 dark:text-teal-400" />
              <span>+ Glicemia</span>
            </button>

            <button
              onClick={onOpenAddMedication}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Adicionar novo remédio à prescrição"
            >
              <Pill className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>+ Medicamento</span>
            </button>

            {onOpenScheduleAppointment && (
              <button
                onClick={onOpenScheduleAppointment}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Agendar consulta médica na UBS"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>+ Consulta</span>
              </button>
            )}

            {onOpenSymptomModal && (
              <button
                onClick={onOpenSymptomModal}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                title="Registrar sintomas ou mal-estar"
              >
                <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Sintomas</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Baixar Relatório Médico consolidado em PDF"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{downloadingPDF ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            {onOpenEmergencyModal && (
              <button
                onClick={onOpenEmergencyModal}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 ml-auto sm:ml-0"
                title="Canal de Emergência para Crise Hipertensiva"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>SOS 192</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. BARRA DE ABAS PRINCIPAIS (TABS NAVIGATION) */}
      <nav aria-label="Navegação em Abas" className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-900 rounded-2xl overflow-x-auto border border-slate-300/60 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('measurements')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'measurements'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Histórico & Gráficos</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {pressureHistory.length + glucoseHistory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('medications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'medications'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medicamentos</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {medications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas & UBS</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Relatórios & Documentos</span>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'education'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Guia de Saúde & Emergência</span>
        </button>
      </nav>

      {/* Feedback Messages */}
      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Relatório médico em PDF gerado com sucesso! Arquivo oficial pronto para a consulta médica.</span>
          </div>
        </div>
      )}

      {testReminderSent && (
        <div className="p-3.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Notificação de lembrete enviada via Firebase Cloud Messaging com sucesso!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: VISÃO GERAL (DASHBOARD LIMPA - NÃO ACUMULA TUDO!)                   */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-teal-700/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300 mb-1">
                  <span>Portal Web SUS</span>
                  <span aria-hidden="true">·</span>
                  <span>Programa Hiperdia Municipal</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                  Olá, {summary?.patient?.name || user?.name || 'Cidadão'}!
                </h1>
                <p className="text-xs lg:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
                  Seus dados clínicos estão sincronizados em tempo real com {summary?.patient?.healthcareUnit || user?.profile?.healthcareUnit || 'sua Unidade Básica de Saúde'}. Utilize as abas acima para navegar pelos detalhes.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-teal-950/60 border border-teal-500/40 rounded-2xl p-3 text-right">
                  <span className="text-[11px] text-teal-300 font-bold block">Status do Acompanhamento</span>
                  <span className="text-sm font-black text-emerald-300">
                    {summary?.patient?.riskLevel ? `Risco ${summary.patient.riskLevel}` : 'Acompanhamento Ativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Última Pressão */}
            <div
              onClick={() => setActiveTab('measurements')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Pressão Arterial</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {summary?.latestBP ? `${summary.latestBP.systolic}/${summary.latestBP.diastolic}` : 'Sem registro'}
                </span>
                {summary?.latestBP && <span className="text-xs font-bold text-slate-400">mmHg</span>}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {summary?.latestBP?.recordedAt ? new Date(summary.latestBP.recordedAt).toLocaleDateString('pt-BR') : 'Clique para registrar'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  {summary?.latestBP?.statusText || 'Pendente'}
                </span>
              </div>
            </div>

            {/* Card 2: Última Glicemia */}
            <div
              onClick={() => setActiveTab('measurements')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Glicemia Capilar</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <Droplet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {summary?.latestGlucose ? summary.latestGlucose.value : 'Sem registro'}
                </span>
                {summary?.latestGlucose && <span className="text-xs font-bold text-slate-400">mg/dL</span>}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {summary?.latestGlucose?.moment ? String(summary.latestGlucose.moment).replace('_', ' ') : 'Clique para registrar'}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  {summary?.latestGlucose?.statusText || 'Pendente'}
                </span>
              </div>
            </div>

            {/* Card 3: Próximo Medicamento */}
            <div
              onClick={() => setActiveTab('medications')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Próximo Medicamento</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                {summary?.nextMedication ? `${summary.nextMedication.name} ${summary.nextMedication.dosage}` : 'Nenhum medicamento'}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {summary?.nextMedication ? 'Horário da dose' : 'Clique para prescrever'}
                </span>
                {summary?.nextMedication && (
                  <span className="text-teal-800 dark:text-teal-300 font-black flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    {summary.nextMedication.time}
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Aderência Mensal */}
            <div
              onClick={() => setActiveTab('medications')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold">Aderência Terapêutica</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-700 dark:text-teal-400 tracking-tight">
                  {summary?.healthStatus.percentage || 92}%
                </span>
                <span className="text-xs font-bold text-slate-400">no mês</span>
              </div>
              <div className="mt-2.5">
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                    style={{ width: `${summary?.healthStatus.percentage || 92}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Gateways: Clean portals into dedicated tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gateway 1: Resumo Clínico & Gráfico */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curva Clínica Recente</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Pressão média: 122/81 mmHg nos últimos 7 dias</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Estável
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Seus últimos 6 registros de pressão sistólica e diastólica permaneceram dentro da meta recomendada pelo Ministério da Saúde (&lt; 130/80 mmHg).
                </p>

                {/* Mini Visual Preview */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Última aferição:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {pressureHistory[0] ? `${pressureHistory[0].systolic}/${pressureHistory[0].diastolic} mmHg` : '120/80 mmHg'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Hoje às 08:30</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Ver análise e gráficos completos:</span>
                <button
                  onClick={() => setActiveTab('measurements')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <span>Acessar Histórico & Gráficos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gateway 2: Resumo de Medicamentos & Próxima Consulta */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Plano Terapêutico Ativo</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{medications.length} medicamentos prescritos na ESF</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    Aderência 92%
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {medications.slice(0, 2).map((med) => (
                    <div
                      key={med.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{med.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">({med.dosage})</span>
                      </div>
                      <span className="text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md text-[11px]">
                        {med.reminderTimes[0] || '14:00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Ver posologia e horários completos:</span>
                <button
                  onClick={() => setActiveTab('medications')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <span>Gerenciar Medicamentos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: HISTÓRICO & GRÁFICOS (DETALHADO E COMPLETO)                         */}
      {/* ========================================================================= */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header controls: Segmented tabs for metric & timeframe */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Curva de Monitoramento e Histórico de Medições
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acompanhamento gráfico conforme as Diretrizes Brasileiras de Hipertensão Arterial.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setGraphMetric('pressure')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      graphMetric === 'pressure'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Pressão Arterial (PA)
                  </button>
                  <button
                    onClick={() => setGraphMetric('glucose')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      graphMetric === 'glucose'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Glicemia Capilar
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Período:</span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      onClick={() => setTimeframe('7d')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        timeframe === '7d'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      7 dias
                    </button>
                    <button
                      onClick={() => setTimeframe('30d')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                        timeframe === '30d'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      30 dias
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Desktop Chart Area */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {graphMetric === 'pressure'
                      ? 'Evolução da Pressão Sistólica e Diastólica (mmHg)'
                      : 'Curva de Glicemia Capilar (mg/dL)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {graphMetric === 'pressure'
                      ? 'Faixa alvo recomendada: Sistólica < 130 mmHg · Diastólica < 80 mmHg'
                      : 'Faixa alvo em jejum: 70 a 99 mg/dL · Pós-prandial: até 140 mg/dL'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  {graphMetric === 'pressure' ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-slate-600 dark:text-slate-300">Sistólica</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 dark:text-slate-300">Diastólica</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-teal-600" />
                      <span className="text-slate-600 dark:text-slate-300">Glicemia</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="h-64 w-full bg-slate-50/70 dark:bg-slate-950/70 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-end relative overflow-hidden">
                {/* Horizontal reference lines */}
                <div className="absolute inset-x-4 top-8 border-b border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>{graphMetric === 'pressure' ? '140 mmHg (Limite Hipertensão)' : '140 mg/dL (Limite Pós-prandial)'}</span>
                </div>
                <div className="absolute inset-x-4 top-24 border-b border-dashed border-emerald-300 dark:border-emerald-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex justify-between">
                  <span>{graphMetric === 'pressure' ? '120/80 mmHg (Meta Ótima SUS)' : '100 mg/dL (Meta Jejum)'}</span>
                </div>

                {/* SVG Curve */}
                <svg className="w-full h-44 overflow-visible" viewBox="0 0 700 160">
                  {graphMetric === 'pressure' ? (
                    <>
                      <path
                        d="M 50 80 Q 150 40 250 55 T 450 70 T 650 50"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 50 120 Q 150 100 250 110 T 450 115 T 650 105"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="80" r="4" fill="#f43f5e" />
                      <circle cx="250" cy="55" r="4" fill="#f43f5e" />
                      <circle cx="450" cy="70" r="4" fill="#f43f5e" />
                      <circle cx="650" cy="50" r="4" fill="#f43f5e" />

                      <circle cx="50" cy="120" r="4" fill="#3b82f6" />
                      <circle cx="250" cy="110" r="4" fill="#3b82f6" />
                      <circle cx="450" cy="115" r="4" fill="#3b82f6" />
                      <circle cx="650" cy="105" r="4" fill="#3b82f6" />
                    </>
                  ) : (
                    <>
                      <path
                        d="M 50 100 Q 150 60 250 80 T 450 65 T 650 75"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="100" r="4" fill="#0d9488" />
                      <circle cx="250" cy="80" r="4" fill="#0d9488" />
                      <circle cx="450" cy="65" r="4" fill="#0d9488" />
                      <circle cx="650" cy="75" r="4" fill="#0d9488" />
                    </>
                  )}
                </svg>

                <div className="flex justify-between text-[11px] font-semibold text-slate-400 pt-2 px-6 border-t border-slate-200/80 dark:border-slate-800 mt-2">
                  <span>Início do período</span>
                  <span>Meio da semana</span>
                  <span>Ontem</span>
                  <span>Hoje</span>
                </div>
              </div>
            </div>

            {/* History Table with Filters */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Histórico Completo de Leituras
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {filteredReadings.length} registros cadastrados no sistema
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setMeasurementFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        measurementFilter === 'ALL'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setMeasurementFilter('PRESSURE')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        measurementFilter === 'PRESSURE'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Pressão
                    </button>
                    <button
                      onClick={() => setMeasurementFilter('GLUCOSE')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        measurementFilter === 'GLUCOSE'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Glicemia
                    </button>
                    <button
                      onClick={() => setMeasurementFilter('CRITICAL')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        measurementFilter === 'CRITICAL'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Alteradas
                    </button>
                  </div>

                  <button
                    onClick={onOpenPressureModal}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Aferir</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold">
                    <tr className="border-b border-slate-200/80 dark:border-slate-800">
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Medição</th>
                      <th className="py-3 px-4">Parâmetro</th>
                      <th className="py-3 px-4">Classificação</th>
                      <th className="py-3 px-4">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReadings.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold">
                          {rec.type === 'PRESSURE' ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <Heart className="w-3 h-3" /> Pressão
                            </span>
                          ) : (
                            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                              <Droplet className="w-3 h-3" /> Glicemia
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {rec.date.toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                          {rec.primaryValue}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {rec.secondaryValue}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              !rec.isCritical
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {rec.statusText}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {rec.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: MEDICAMENTOS & PLANO TERAPÊUTICO                                   */}
      {/* ========================================================================= */}
      {activeTab === 'medications' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Plano Terapêutico e Medicamentos Prescritos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Medicamentos padronizados pelo SUS (RENAME) e acompanhados pela equipe da UBS.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleTestReminder}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  title="Testar recebimento do push notification no navegador"
                >
                  <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Testar Alarme Push</span>
                </button>

                <button
                  onClick={onOpenAddMedication}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Adicionar Medicamento</span>
                </button>
              </div>
            </div>

            {/* Medications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        Ativo na ESF
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {med.name} {med.dosage}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{med.frequency}</p>

                    <div className="mt-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Horários programados:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {med.reminderTimes.map((time, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded text-[11px] font-bold border border-teal-200 dark:border-teal-800"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Farmácia Básica SUS</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">Disponível na UBS</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Farmácia Popular SUS Banner */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-xs text-teal-900 dark:text-teal-200">
                <span className="font-bold block">Programa Farmácia Popular do Brasil:</span>
                Medicamentos para hipertensão e diabetes têm gratuidade de 100%. Apresente sua receita médica da UBS e documento com foto em qualquer farmácia credenciada.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CONSULTAS & UBS DR. MANOEL DE ABREU                                 */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Consultas Agendadas e Equipe de Saúde da Família (ESF)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acompanhamento periódico na sua Unidade Básica de Saúde de referência.
                </p>
              </div>
              {onOpenScheduleAppointment && (
                <button
                  onClick={onOpenScheduleAppointment}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>+ Agendar Consulta</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Consultations List */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Próximos Atendimentos ({appointments.length})
                </h3>

                {appointments.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      Nenhuma consulta agendada no momento
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Mantenha seu acompanhamento do Hiperdia em dia. Agende uma consulta de rotina ou retorno com a equipe da UBS.
                    </p>
                    {onOpenScheduleAppointment && (
                      <button
                        onClick={onOpenScheduleAppointment}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Agendar Minha Consulta</span>
                      </button>
                    )}
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {appt.doctorName || 'Equipe de Saúde da Família'}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {appt.appointmentType.includes('RETORNO') || appt.appointmentType === 'FOLLOW_UP' ? 'Retorno Clínico' : 'Consulta Rotina'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {appt.clinicName || user?.profile?.healthcareUnit || 'UBS de Referência'}
                          </p>

                          <div className="mt-2.5 flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(appt.scheduledFor).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(appt.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {appt.notes && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-xs">{appt.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleDownloadPDF}
                          className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Levar Relatório</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* UBS Details Card */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950 text-white border border-teal-700/40">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-teal-400" />
                    <h4 className="text-sm font-bold text-white">
                      {user?.profile?.healthcareUnit || 'UBS Dr. Manoel de Abreu'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unidade de Saúde da Família e Atenção Primária à Saúde.<br />
                    Atendimento: Segunda a Sexta, das 07h às 18h
                  </p>

                  <div className="mt-4 pt-3 border-t border-teal-800/80 text-xs space-y-1.5 text-teal-200">
                    <div>Telefone: {user?.profile?.phone || '(11) 3456-7890'}</div>
                    <div>Sala de Curativos e PA: 07h - 17h30</div>
                    <div>Farmácia Básica: 08h - 17h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: RELATÓRIOS & DOCUMENTOS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="pb-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Relatório Médico Oficial em PDF
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Documento padronizado com médias de PA, controle glicêmico e histórico de receitas.
                </p>
              </div>

              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPDF ? 'Gerando PDF...' : 'Baixar Documento em PDF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Período Consolidado</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">Últimos 30 Dias</div>
                <p className="text-[11px] text-slate-400 mt-1">Média de 2 aferições/dia</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pressão Média no Período</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">122 / 81 mmHg</div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">94% das leituras na meta</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aderência aos Medicamentos</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">92% de Adesão</div>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">Lembretes diários ativos</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                O que levar para sua consulta na UBS:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Este Relatório Médico em PDF impresso ou salvo no smartphone.</li>
                <li>Documento de identificação com foto e Cartão Nacional do SUS.</li>
                <li>Caixas ou receitas atuais de todos os medicamentos em uso contínuo.</li>
                <li>Exames laboratoriais recentes (Creatinina, Potássio, Hemograma, HbA1c).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 6: GUIA DE SAÚDE & EMERGÊNCIA SAMU 192                                 */}
      {/* ========================================================================= */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          {/* Emergency Alert Banner */}
          <div className="p-6 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-rose-900 dark:text-rose-200">
                    Protocolo de Emergência · SAMU 192
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                    Crise Hipertensiva
                  </span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 max-w-2xl leading-relaxed">
                  Se sua pressão estiver maior que <strong>180/120 mmHg</strong> acompanhada de dor no peito, falta de ar, dor de cabeça súbita intensa, visão turva ou dormência, procure atendimento imediato ou ligue 192.
                </p>
              </div>
            </div>

            {onOpenEmergencyModal && (
              <button
                onClick={onOpenEmergencyModal}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Abrir Protocolo de Emergência</span>
              </button>
            )}
          </div>

          {/* Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Alimentação e Redução de Sódio</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                A Organização Mundial da Saúde (OMS) orienta consumo máximo de 5 gramas de sal (2g de sódio) por dia. Evite temperos prontos em cubo, embutidos e ultraprocessados. Prefira ervas naturais como alho, alecrim e orégano.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Atividade Física Regular</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Praticar 150 minutos semanais de atividade física moderada (como caminhadas leves) reduz a pressão arterial sistólica em até 8 mmHg e melhora a sensibilidade à insulina.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
