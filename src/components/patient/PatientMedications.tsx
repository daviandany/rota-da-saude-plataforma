import React, { useState, useEffect } from 'react';
import { ArrowLeft, Pill, Bell, Plus, Calendar, Clock, CheckCircle, Radio, Sparkles, Send, Pencil, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { Medication, Appointment } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface PatientMedicationsProps {
  onBack?: () => void;
  onOpenAddMedication: () => void;
  onEditMedication?: (med: Medication) => void;
}

export const PatientMedications: React.FC<PatientMedicationsProps> = ({
  onBack,
  onOpenAddMedication,
  onEditMedication,
}) => {
  const { permission, requestPushPermission, testMedicationReminder, loading: fcmLoading } = useNotifications();
  const [activeTab, setActiveTab] = useState<'meds' | 'appointments'>('meds');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [medReminderSuccess, setMedReminderSuccess] = useState<string | null>(null);

  const handleTestMedPush = async () => {
    await testMedicationReminder();
    setMedReminderSuccess('Alerta push de medicação enviado via Firebase Cloud Messaging!');
    setTimeout(() => setMedReminderSuccess(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [m, a] = await Promise.all([api.getMedications(), api.getAppointments()]);
      setMedications(m);
      setAppointments(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Medicamentos e Consultas</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('meds')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'meds'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Medicamentos
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'appointments'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Consultas
          </button>
        </div>

        {activeTab === 'meds' ? (
          <div className="space-y-3">
            {/* FCM Push Notification Status Banner */}
            <div className="p-3.5 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl border border-teal-500/30 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Lembretes Push (FCM)</h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {permission === 'granted' ? 'Ativo' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                      {permission === 'granted'
                        ? 'Seu celular receberá notificações nos horários das doses.'
                        : 'Ative os lembretes para receber alertas nos horários dos remédios.'}
                    </p>
                  </div>
                </div>
              </div>

              {medReminderSuccess && (
                <div className="mt-2 p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{medReminderSuccess}</span>
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                {permission === 'default' ? (
                  <button
                    onClick={requestPushPermission}
                    disabled={fcmLoading}
                    className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] rounded-lg transition shadow-xs flex items-center gap-1"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{fcmLoading ? 'Ativando...' : 'Ativar Push no Aparelho'}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-teal-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-teal-400" />
                    {permission === 'granted'
                      ? 'Dispositivo registrado no Firebase'
                      : 'Notificações ativas no aplicativo'}
                  </span>
                )}

                <button
                  onClick={handleTestMedPush}
                  disabled={fcmLoading}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold rounded-lg transition border border-teal-500/40 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Simular Alerta</span>
                </button>
              </div>
            </div>

            {/* Medications List */}
            {medications.map((med) => {
              const isDoctorMed =
                med.addedByRole === 'PROFESSIONAL' ||
                Boolean(med.prescribedBy) ||
                ['med-1', 'med-2', 'med-3'].includes(med.id);
              return (
                <div
                  key={med.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                          {med.name} {med.dosage}
                        </h3>
                        {isDoctorMed ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            <Lock className="w-2.5 h-2.5" />
                            Prescrito pelo Médico
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Adicionado por você
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {med.frequency}
                      </div>
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-400 mt-1">
                        {med.reminderTimes.join(' | ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDoctorMed && onEditMedication ? (
                      <button
                        type="button"
                        onClick={() => onEditMedication(med)}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    ) : (
                      <div className="p-2 text-slate-400 dark:text-slate-500" title="Prescrição médica (somente leitura)">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Button Adicionar Medicamento */}
            <button
              onClick={onOpenAddMedication}
              className="w-full py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-2"
            >
              <span>Adicionar medicamento</span>
              <Plus className="w-4 h-4" />
            </button>

            {/* Próxima consulta card below medications (dynamic) */}
            {(() => {
              const nextApp = appointments.find(
                (a) => new Date(a.scheduledFor).getTime() >= Date.now() - 3600000 * 24 && a.status !== 'CANCELADA'
              );
              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs mt-4">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Próxima consulta agendada
                  </div>
                  {nextApp ? (
                    <>
                      <div className="text-xs font-bold text-slate-800 dark:text-white">
                        {new Date(nextApp.scheduledFor).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(nextApp.scheduledFor).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {nextApp.appointmentType} • {nextApp.doctorName}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {nextApp.clinicName}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Nenhuma consulta futura agendada no momento.
                    </div>
                  )}
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="mt-3 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline block"
                  >
                    Ver todas as consultas ({appointments.length})
                  </button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-white">
                  Sem consultas registradas
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Suas consultas agendadas pela Unidade Básica de Saúde aparecerão aqui.
                </p>
              </div>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {new Date(app.scheduledFor).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(app.scheduledFor).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'REALIZADA'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : app.status === 'CANCELADA'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      }`}
                    >
                      {app.status || 'AGENDADA'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-800 dark:text-white">
                    {app.appointmentType}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.doctorName}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{app.clinicName}</div>
                  {app.notes && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic">
                      {app.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
