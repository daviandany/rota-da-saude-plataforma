import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Bell, Plus, ChevronRight, User } from 'lucide-react';
import { api } from '../../services/api';
import { Appointment } from '../../types';

interface DoctorAppointmentsProps {
  onBack?: () => void;
  onOpenNewAppointment: () => void;
  patientId?: string;
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({
  onBack,
  onOpenNewAppointment,
  patientId,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const [apps, pt] = await Promise.all([
        api.getAppointments(patientId),
        patientId ? api.getPatientProfile(patientId).catch(() => null) : Promise.resolve(null),
      ]);
      setAppointments(apps);
      if (pt) setPatient(pt.patient || pt);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId]);

  const upcomingApps = appointments.filter((a) => {
    const isPast = new Date(a.scheduledFor).getTime() < Date.now() || a.status === 'REALIZADA' || a.status === 'CANCELADA';
    return !isPast;
  });

  const historyApps = appointments.filter((a) => {
    const isPast = new Date(a.scheduledFor).getTime() < Date.now() || a.status === 'REALIZADA' || a.status === 'CANCELADA';
    return isPast;
  });

  const displayedApps = activeTab === 'upcoming' ? upcomingApps : historyApps;

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
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Consultas Agendadas</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Dynamic Context Card */}
        {patient ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            {patient.avatarUrl ? (
              <img
                src={patient.avatarUrl}
                alt={patient.name}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm border border-teal-200 dark:border-teal-800">
                {patient.name?.charAt(0) || 'P'}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{patient.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {patient.age ? `${patient.age} anos` : 'Idade não informada'} • {patient.conditions?.join(' & ') || 'Acompanhamento Clínico'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">UBS Dr. Manoel de Abreu</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Agenda da Equipe de Saúde da Família • {appointments.length} consultas totais
              </p>
            </div>
            <button
              onClick={onOpenNewAppointment}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
          </div>
        )}

        {/* Subtabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'upcoming'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Próximas ({upcomingApps.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Histórico ({historyApps.length})
          </button>
        </div>

        {/* Appointments list */}
        {displayedApps.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === 'upcoming'
                ? 'Nenhuma consulta futura agendada.'
                : 'Nenhum histórico de consulta anterior encontrado.'}
            </p>
            <button
              onClick={onOpenNewAppointment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Consulta</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedApps.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {new Date(app.scheduledFor).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(app.scheduledFor).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                      {app.appointmentType}
                    </div>
                    {app.patientName && (
                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                        Paciente: {app.patientName}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{app.doctorName}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{app.clinicName}</div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      app.status === 'REALIZADA'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : app.status === 'CANCELADA'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                    }`}
                  >
                    {app.status || 'AGENDADA'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Button Nova Consulta */}
        <button
          onClick={onOpenNewAppointment}
          className="w-full py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
        >
          <span>Nova consulta</span>
          <Plus className="w-4 h-4" />
        </button>

        {/* Lembrete Box */}
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900/60 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
          <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Notificações Automáticas</span>
            <span className="text-[11px] text-sky-800 dark:text-sky-300">
              O paciente será avisado 24 horas e 2 horas antes da consulta via push e lembrete clínico.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
