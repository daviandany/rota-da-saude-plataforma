import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Calendar,
  AlertTriangle,
  Users,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';

interface DoctorDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenMenu: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  onNavigateTab,
  onOpenMenu,
  onSelectPatient,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getDoctorDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Header */}
      <div className="px-5 py-3.5 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMenu}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-white">Painel Clínico</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('alertas')}
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition"
            aria-label="Alertas"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </button>
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
            alt="Dr. Carlos Mendes"
            className="w-8 h-8 rounded-full object-cover border border-teal-600"
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Doctor greeting */}
        <div className="pt-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Olá, Dr. Carlos!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Monitoramento em tempo real dos pacientes cadastrados
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Consultas Hoje */}
          <div
            onClick={() => onNavigateTab('consultas')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Consultas hoje</span>
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.consultasHoje || 24}
            </div>
          </div>

          {/* Alertas Críticos */}
          <div
            onClick={() => onNavigateTab('alertas')}
            className="bg-rose-50/40 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-xs cursor-pointer hover:border-rose-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Alertas críticos</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {stats?.alertasCriticos || 15}
            </div>
          </div>

          {/* Pacientes Cadastrados */}
          <div
            onClick={() => onNavigateTab('pacientes')}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pacientes</span>
              <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.pacientesCadastrados || 128}
            </div>
          </div>

          {/* Atendimentos Taxa */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Aderência média</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {stats?.atendimentosTaxa || '82%'}
            </div>
          </div>
        </div>

        {/* Distribuição de Risco */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Distribuição de risco cardiovascular</div>

          {/* Distribuição de Risco Dinâmica */}
          {(() => {
            const totalPts = stats?.pacientesCadastrados || 3;
            const highCount = stats?.riscoDistribuicao?.alto ?? 1;
            const modCount = stats?.riscoDistribuicao?.moderado ?? 1;
            const lowCount = stats?.riscoDistribuicao?.baixo ?? Math.max(0, totalPts - highCount - modCount);
            const sumPts = Math.max(1, highCount + modCount + lowCount);

            const highPct = Math.round((highCount / sumPts) * 100);
            const modPct = Math.round((modCount / sumPts) * 100);
            const lowPct = Math.max(0, 100 - highPct - modPct);

            // Circumference of r=14 is ~88
            const circ = 88;
            const lowDash = (lowPct / 100) * circ;
            const modDash = (modPct / 100) * circ;
            const highDash = (highPct / 100) * circ;

            return (
              <div className="flex items-center justify-between py-2">
                {/* Donut Chart representation */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeDasharray={`${lowDash} 100`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="5"
                      strokeDasharray={`${modDash} 100`}
                      strokeDashoffset={`${-lowDash}`}
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeDasharray={`${highDash} 100`}
                      strokeDashoffset={`${-(lowDash + modDash)}`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-slate-800 dark:text-white leading-none">{totalPts}</span>
                    <span className="text-[9px] text-slate-400 font-medium">pacientes</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">Alto ({highCount})</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{highPct}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">Moderado ({modCount})</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{modPct}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600 dark:text-slate-400">Baixo ({lowCount})</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{lowPct}%</span>
                  </div>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => onNavigateTab('pacientes')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>Ver todos os pacientes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Priority action callout for Doctor */}
        <div className="bg-teal-900 text-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <ShieldAlert className="w-4 h-4" />
            <span>Triagem Clínica Prioritária</span>
          </div>
          <p className="text-xs text-teal-100 leading-relaxed">
            Existem <strong>15 alertas de risco</strong> ativos hoje. Paciente <strong>Maria Silva</strong> e <strong>João da Silva</strong> registraram picos severos e necessitam de conduta médica.
          </p>
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => onSelectPatient('pat-maria')}
              className="py-1.5 px-3 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
            >
              Abrir Prontuário de Maria
            </button>
            <button
              onClick={() => onNavigateTab('alertas')}
              className="py-1.5 px-3 bg-teal-800/80 hover:bg-teal-700 text-teal-200 text-xs font-semibold rounded-lg transition"
            >
              Ver Alertas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
