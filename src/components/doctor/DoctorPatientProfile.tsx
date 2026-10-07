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

  const sortedBP = [...bpRecords]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-8);

  const chartWidth = 280;
  const chartHeight = 100;
  const getDocX = (idx: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return 16 + (idx / (total - 1)) * (chartWidth - 32);
  };
  const getDocY = (val: number) => {
    const min = 50;
    const max = 190;
    const clamped = Math.max(min, Math.min(max, val));
    return chartHeight - 12 - ((clamped - min) / (max - min)) * (chartHeight - 24);
  };
  const docSysPath =
    sortedBP.length === 1
      ? `M ${chartWidth / 2 - 25} ${getDocY(sortedBP[0].systolic)} L ${chartWidth / 2 + 25} ${getDocY(sortedBP[0].systolic)}`
      : sortedBP.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getDocX(i, sortedBP.length)} ${getDocY(r.systolic)}`).join(' ');
  const docDiaPath =
    sortedBP.length === 1
      ? `M ${chartWidth / 2 - 25} ${getDocY(sortedBP[0].diastolic)} L ${chartWidth / 2 + 25} ${getDocY(sortedBP[0].diastolic)}`
      : sortedBP.map((r, i) => `${i === 0 ? 'M' : 'L'} ${getDocX(i, sortedBP.length)} ${getDocY(r.diastolic)}`).join(' ');

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
                  {latestBP ? `${latestBP.systolic} / ${latestBP.diastolic}` : 'Sem registro'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">mmHg</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Última medição</div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {latestBP?.recordedAt
                    ? new Date(latestBP.recordedAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Glicemia
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {latestGlucose ? latestGlucose.glucoseValue : 'Sem registro'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">mg/dL</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Última medição</div>
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {latestGlucose?.recordedAt
                    ? new Date(latestGlucose.recordedAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </div>
              </div>
            </div>

            {/* Evolução */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-white">Evolução Real ({sortedBP.length} registros)</span>
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
              {sortedBP.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                  Nenhuma aferição registrada para este paciente.
                </div>
              ) : (
                <>
                  <div className="h-28 flex items-center justify-center relative">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
                      <line x1="0" y1="20" x2="280" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="280" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="280" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

                      <path d={docSysPath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                      {sortedBP.map((r, i) => (
                        <g key={r.id || 's-' + i}>
                          <circle cx={getDocX(i, sortedBP.length)} cy={getDocY(r.systolic)} r="3.5" fill="#0284c7" />
                          <text x={getDocX(i, sortedBP.length)} y={getDocY(r.systolic) - 5} textAnchor="middle" className="fill-sky-600 dark:fill-sky-400 text-[8px] font-bold">
                            {r.systolic}
                          </text>
                        </g>
                      ))}

                      <path d={docDiaPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                      {sortedBP.map((r, i) => (
                        <g key={r.id ? r.id + '-d' : 'd-' + i}>
                          <circle cx={getDocX(i, sortedBP.length)} cy={getDocY(r.diastolic)} r="3.5" fill="#10b981" />
                          <text x={getDocX(i, sortedBP.length)} y={getDocY(r.diastolic) + 10} textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[8px] font-bold">
                            {r.diastolic}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                    {sortedBP.map((r, idx) => (
                      <span key={r.id || idx}>
                        {new Date(r.recordedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    ))}
                  </div>
                </>
              )}
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
