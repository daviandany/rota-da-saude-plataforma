import React, { useState } from 'react';
import { Calendar, UserPlus, Pill, BellRing, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface DoctorQuickActionsProps {
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenAddMedication: () => void;
  onOpenQuickAlert: () => void;
}

export const DoctorQuickActions: React.FC<DoctorQuickActionsProps> = ({
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenAddMedication,
  onOpenQuickAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full px-3 py-1.5 transition-all">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-lg p-2.5 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Entrada Rápida Clínica
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 hidden xs:inline">
              • Ações imediatas
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isExpanded ? (
              <>
                <span>Ocultar</span>
                <ChevronDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Abrir</span>
                <ChevronUp className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Buttons grid */}
        {isExpanded && (
          <div className="grid grid-cols-4 gap-2 pt-0.5">
            {/* Nova Consulta */}
            <button
              type="button"
              onClick={onOpenNewAppointment}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-800 dark:text-teal-300 transition active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight">
                + Consulta
              </span>
            </button>

            {/* Novo Paciente */}
            <button
              type="button"
              onClick={onOpenNewPatient}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-800 dark:text-sky-300 transition active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight">
                + Paciente
              </span>
            </button>

            {/* Prescrição */}
            <button
              type="button"
              onClick={onOpenAddMedication}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-800 dark:text-indigo-300 transition active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight">
                + Receita
              </span>
            </button>

            {/* Emitir Alerta */}
            <button
              type="button"
              onClick={onOpenQuickAlert}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 transition active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                <BellRing className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight">
                + Alerta
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
