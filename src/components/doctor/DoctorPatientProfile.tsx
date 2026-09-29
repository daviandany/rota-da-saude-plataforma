import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Pill,
  Heart,
  Droplet,
  Plus,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Medication, Appointment, BloodPressureRecord, GlucoseRecord } from '../../types';

interface DoctorPatientProfileProps {
  patientId: string;
  onBack: () => void;
  onOpenAddMedication: () => void;
  onOpenNewAppointment: () => void;
}

export const DoctorPatientProfile: React.FC<DoctorPatientProfileProps> = ({
  patientId,
  onBack,
  onOpenAddMedication,
  onOpenNewAppointment,
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico' | 'medicamentos' | 'consultas'>('resumo');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await api.getPatientProfile(patientId);
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [patientId]);

  const patient = profile?.patient;
  const latestBP = profile?.latestBP;
  const latestGlucose = profile?.latestGlucose;
  const medications: Medication[] = profile?.medications || [];
  const appointments: Appointment[] = profile?.appointments || [];
  const bpRecords: BloodPressureRecord[] = profile?.historyBP || [];

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-white">Perfil do Paciente</h1>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Patient Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <img
            src={
              patient?.avatarUrl ||
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
            }
            alt={patient?.name || 'Paciente'}
            className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{patient?.name || 'Maria Silva'}</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {patient?.age || 58} anos • {patient?.gender || 'Feminino'}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              {patient?.conditions?.join(' / ') || 'HAS / DM'}
            </div>
          </div>
          <div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                patient?.riskLevel === 'ALTO'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              Risco {patient?.riskLevel?.toLowerCase() || 'alto'}
            </span>
          </div>
        </div>

        {/* 4 Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('resumo')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'resumo' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Resumo
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'historico' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('medicamentos')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'medicamentos' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Medicamentos
          </button>
          <button
            onClick={() => setActiveTab('consultas')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'consultas' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Consultas
          </button>
        </div>

        {/* TAB 1: RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Pressão arterial
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {latestBP ? `${latestBP.systolic} / ${latestBP.diastolic}` : '120 / 80'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">mmHg</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Última medição</div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">07/05 às 08:30</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Glicemia
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {latestGlucose ? latestGlucose.glucoseValue : '98'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">mg/dL</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Última medição</div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">07/05 às 08:30</div>
              </div>
            </div>

            {/* Evolução */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-white">Evolução (últimos 30 dias)</span>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Sistólica
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Diastólica
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-28 flex items-center justify-center relative">
                <svg viewBox="0 0 280 100" className="w-full h-28 overflow-visible">
                  <line x1="0" y1="20" x2="280" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="280" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="280" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

                  <path
                    d="M 10 40 Q 60 25 100 45 T 180 35 T 270 30"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="40" r="3.5" fill="#0284c7" />
                  <circle cx="80" cy="30" r="3.5" fill="#0284c7" />
                  <circle cx="150" cy="42" r="3.5" fill="#0284c7" />
                  <circle cx="210" cy="32" r="3.5" fill="#0284c7" />
                  <circle cx="270" cy="30" r="3.5" fill="#0284c7" />

                  <path
                    d="M 10 75 Q 60 70 100 78 T 180 72 T 270 70"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="75" r="3.5" fill="#10b981" />
                  <circle cx="80" cy="71" r="3.5" fill="#10b981" />
                  <circle cx="150" cy="78" r="3.5" fill="#10b981" />
                  <circle cx="210" cy="73" r="3.5" fill="#10b981" />
                  <circle cx="270" cy="70" r="3.5" fill="#10b981" />
                </svg>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>07/04</span>
                <span>14/04</span>
                <span>21/04</span>
                <span>28/04</span>
                <span>05/05</span>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenNewAppointment}
                className="py-2.5 px-3 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                + Agendar Consulta
              </button>
              <button
                onClick={onOpenAddMedication}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
              >
                + Prescrever Remédio
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Todas as Aferições Registradas</div>
            <div className="space-y-2">
              {bpRecords.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {r.systolic} / {r.diastolic} mmHg
                    </span>
                    <span className="text-slate-400 text-[10px] ml-2 font-mono">
                      {new Date(r.recordedAt).toLocaleString('pt-BR')}
                    </span>
                    {r.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">{r.notes}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.isCritical
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {r.statusText || 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MEDICAMENTOS */}
        {activeTab === 'medicamentos' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Em uso ({medications.length})</div>

            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {med.name} {med.dosage}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        1 comprimido • {med.frequency}
                      </p>
                      <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mt-0.5">
                        {med.reminderTimes.join(' | ')}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Ativo
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onOpenAddMedication}
              className="w-full py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Adicionar medicamento
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Adesão ao tratamento
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Boa adesão</span>
                <span className="text-[10px] text-slate-400">Últimos 30 dias</span>
              </div>

              <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-slate-800 dark:text-white">
                85%
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONSULTAS */}
        {activeTab === 'consultas' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Consultas Agendadas</span>
              <button
                onClick={onOpenNewAppointment}
                className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                + Nova
              </button>
            </div>

            {appointments.map((a) => (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5"
              >
                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span>{new Date(a.scheduledFor).toLocaleString('pt-BR')}</span>
                  <span className="text-teal-700 dark:text-teal-400 font-semibold">{a.status}</span>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.appointmentType}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{a.clinicName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
