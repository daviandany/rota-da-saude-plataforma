import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { Patient, RiskLevel } from '../../types';

interface DoctorPatientsProps {
  onBack?: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorPatients: React.FC<DoctorPatientsProps> = ({
  onBack,
  onSelectPatient,
}) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'TODOS' | 'ALTO' | 'MODERADO' | 'BAIXO'>('TODOS');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const data = await api.getDoctorPatients(search, riskFilter);
      setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, riskFilter]);

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'ALTO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Alto
          </span>
        );
      case 'MODERADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Moderado
          </span>
        );
      case 'BAIXO':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Baixo
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Pacientes</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Search input */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
            />
          </div>
          <button
            type="button"
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setRiskFilter('TODOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition ${
              riskFilter === 'TODOS'
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Todos ({patients.length})
          </button>

          <button
            onClick={() => setRiskFilter('ALTO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition ${
              riskFilter === 'ALTO'
                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Alto risco
          </button>

          <button
            onClick={() => setRiskFilter('MODERADO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition ${
              riskFilter === 'MODERADO'
                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Moderado
          </button>

          <button
            onClick={() => setRiskFilter('BAIXO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border whitespace-nowrap transition ${
              riskFilter === 'BAIXO'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Baixo
          </button>
        </div>

        {/* Patients List */}
        <div className="space-y-2.5">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    patient.avatarUrl ||
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={patient.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {patient.age} anos • {patient.conditions.join(' / ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getRiskBadge(patient.riskLevel)}
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
