import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, AlertCircle, ChevronRight, Radio, Send, Bell, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { ClinicalAlert } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface DoctorAlertsProps {
  onBack?: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const DoctorAlerts: React.FC<DoctorAlertsProps> = ({
  onBack,
  onSelectPatient,
}) => {
  const { permission, requestPushPermission, testCriticalReading, loading: fcmLoading } = useNotifications();
  const [filter, setFilter] = useState<'TODOS' | 'CRITICO' | 'ATENCAO'>('TODOS');
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);

  const handleTestPressure = async () => {
    await testCriticalReading('PRESSURE');
    setPushSuccess('Alerta crítico de Pressão (175/105) enviado via FCM!');
    setTimeout(() => setPushSuccess(null), 3000);
  };

  const handleTestGlucose = async () => {
    await testCriticalReading('GLUCOSE');
    setPushSuccess('Alerta crítico de Glicemia (52 mg/dL) enviado via FCM!');
    setTimeout(() => setPushSuccess(null), 3000);
  };

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(undefined, filter === 'TODOS' ? undefined : filter);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

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
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Alertas de Risco</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* FCM Critical Push Alerts Card */}
        <div className="p-3.5 bg-gradient-to-r from-rose-950 to-slate-900 text-white rounded-2xl border border-rose-500/40 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Alertas Críticos Push (FCM)</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {permission === 'granted' ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                  Notificações push imediatas para picos de PA (≥160/100) e hipoglicemia (&lt;70).
                </p>
              </div>
            </div>
          </div>

          {pushSuccess && (
            <div className="mt-2 p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{pushSuccess}</span>
            </div>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
            {permission === 'default' ? (
              <button
                onClick={requestPushPermission}
                disabled={fcmLoading}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] rounded-lg transition shadow-xs flex items-center gap-1"
              >
                <Bell className="w-3 h-3" />
                <span>{fcmLoading ? 'Ativando...' : 'Ativar Push Médico'}</span>
              </button>
            ) : (
              <span className="text-[10px] text-rose-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-rose-400" />
                {permission === 'granted'
                  ? 'Canal FCM Médico Conectado'
                  : 'Alertas Médicos Ativos no App'}
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTestPressure}
                disabled={fcmLoading}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-semibold rounded-lg transition border border-rose-500/40 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Simular Pressão Crítica</span>
              </button>
              <button
                onClick={handleTestGlucose}
                disabled={fcmLoading}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold rounded-lg transition border border-amber-500/40 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Simular Hipoglicemia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('TODOS')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition ${
              filter === 'TODOS'
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Todos ({alerts.length})
          </button>

          <button
            onClick={() => setFilter('CRITICO')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition ${
              filter === 'CRITICO'
                ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Altos
          </button>

          <button
            onClick={() => setFilter('ATENCAO')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl border text-center transition ${
              filter === 'ATENCAO'
                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Moderados
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isHigh = alert.severity === 'CRITICO';
            return (
              <div
                key={alert.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isHigh
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isHigh ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{alert.patientName}</h3>
                      <p className={`text-xs font-semibold mt-0.5 ${isHigh ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {alert.metricType === 'PRESSURE'
                          ? isHigh ? 'Pressão muito alta' : 'Pressão acima do ideal'
                          : isHigh ? 'Glicemia muito alta' : 'Glicemia acima do ideal'}
                      </p>
                      {alert.valueRecorded && (
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-1 font-mono">
                          {alert.valueRecorded}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(alert.triggeredAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isHigh
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isHigh ? 'Risco alto' : 'Risco moderado'}
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => onSelectPatient(alert.patientId)}
                    className="w-full py-2 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                  >
                    <span>Ver prontuário do paciente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
