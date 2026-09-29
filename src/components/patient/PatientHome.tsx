import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Heart,
  Droplet,
  Pill,
  Calendar,
  Star,
  PlusCircle,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { PatientSummary } from '../../types';

interface PatientHomeProps {
  onOpenPressureModal: () => void;
  onOpenGlucoseModal: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenMenu: () => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  onOpenPressureModal,
  onOpenGlucoseModal,
  onNavigateTab,
  onOpenMenu,
}) => {
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSummary = async () => {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Bar */}
      <div className="px-5 py-3.5 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <button
          onClick={onOpenMenu}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Início</h1>
        <button
          onClick={() => onNavigateTab('alertas')}
          className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition"
          aria-label="Alertas"
        >
          <Bell className="w-5 h-5" />
          {summary && summary.pendingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          )}
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Greeting */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Olá, {summary?.patient.name.split(' ')[0] || 'Maria'}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Como está se sentindo hoje?
            </p>
          </div>
          <span className="text-2xl select-none" role="img" aria-label="happy">
            😊
          </span>
        </div>

        {/* 2 Main Metric Cards: Pressão & Glicemia */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card Pressão */}
          <div
            onClick={onOpenPressureModal}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-400 dark:hover:border-teal-500 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-medium text-[11px]">Pressão arterial</span>
              <Heart className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition fill-teal-600/20" />
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {summary ? `${summary.latestBP.systolic}/${summary.latestBP.diastolic}` : '120/80'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">mmHg</div>
            <div className="mt-2">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                {summary?.latestBP.statusText || 'Normal'}
              </span>
            </div>
          </div>

          {/* Card Glicemia */}
          <div
            onClick={onOpenGlucoseModal}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-500 cursor-pointer transition group"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-medium text-[11px]">Glicemia</span>
              <Droplet className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition fill-sky-600/20" />
            </div>
            <div className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {summary ? summary.latestGlucose.value : '98'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">mg/dL</div>
            <div className="mt-2">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                {summary?.latestGlucose.statusText || 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* 2 Next Action Cards: Próximo Medicamento & Próxima Consulta */}
        <div className="grid grid-cols-2 gap-3">
          {/* Próximo Medicamento */}
          <div
            onClick={() => onNavigateTab('medicamentos')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-teal-300 dark:hover:border-teal-600 transition"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Próximo medicamento
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
              {summary?.nextMedication.name || 'Losartana'} {summary?.nextMedication.dosage || '50mg'}
            </div>
            <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>{summary?.nextMedication.time || '08:00'}</span>
            </div>
          </div>

          {/* Próxima Consulta */}
          <div
            onClick={() => onNavigateTab('medicamentos')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-teal-300 dark:hover:border-teal-600 transition"
          >
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Próxima consulta
            </div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              {summary?.nextAppointment.date
                ? new Date(summary.nextAppointment.date).toLocaleDateString('pt-BR')
                : '22/05/2025'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
              {summary?.nextAppointment.clinic || 'Clínica da Família'}
            </div>
          </div>
        </div>

        {/* Status de Saúde Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Status de saúde
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {summary?.healthStatus.message || 'Parabéns! Seus índices estão dentro da meta.'}
              </div>
            </div>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 ml-2" />
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-teal-700 dark:text-teal-400 mb-1">
              <span>Aderência e metas</span>
              <span>{summary?.healthStatus.percentage || 80}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${summary?.healthStatus.percentage || 80}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick entry reminder & direct trigger */}
        <div className="pt-1">
          <button
            onClick={() => onNavigateTab('medicamentos')}
            className="w-full py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-300" />
            <span>Confirmar que tomou o remédio de hoje</span>
          </button>
        </div>
      </div>
    </div>
  );
};
