import React, { useState } from 'react';
import { useNotifications, AppNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sparkles,
  X,
  Volume2,
  Clock,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    permission,
    token,
    loading,
    requestPushPermission,
    markAsRead,
    markAllAsRead,
    testMedicationReminder,
    testCriticalReading,
  } = useNotifications();

  const [filter, setFilter] = useState<'ALL' | 'MEDICATION' | 'CRITICAL_READING'>('ALL');
  const [copiedToken, setCopiedToken] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleTestMedication = async () => {
    await testMedicationReminder();
    setActionSuccess('Lembrete de medicação via FCM enviado com sucesso!');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleTestPressureCritical = async () => {
    await testCriticalReading('PRESSURE');
    setActionSuccess('Alerta crítico de Pressão Arterial (175/105 mmHg) enviado aos médicos via FCM!');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleTestGlucoseCritical = async () => {
    await testCriticalReading('GLUCOSE');
    setActionSuccess('Alerta crítico de Glicemia (52 mg/dL - Hipoglicemia) enviado aos médicos via FCM!');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Notificações Push • Firebase Cloud Messaging
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  FCM v1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Alertas de medicação para pacientes e leituras críticas para médicos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Feedback banner */}
          {actionSuccess && (
            <div className="p-3 bg-teal-950/70 border border-teal-500/50 rounded-xl flex items-center gap-2 text-teal-200 text-xs font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* FCM Status Panel */}
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${permission === 'granted' || token ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-xs font-semibold text-white">
                  Status do Dispositivo:{' '}
                  <span className={permission === 'granted' ? 'text-emerald-400' : token ? 'text-teal-300' : 'text-amber-400'}>
                    {permission === 'granted'
                      ? 'Push Nativo do Navegador Habilitado'
                      : token
                      ? 'Canal In-App Ativo (Toasts & Alertas Sonoros)'
                      : permission === 'denied'
                      ? 'Modo In-App (Permissão nativa restrita pelo navegador)'
                      : 'Aguardando Permissão'}
                  </span>
                </span>
              </div>

              {!token && (
                <button
                  onClick={requestPushPermission}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{loading ? 'Habilitando...' : 'Ativar Notificações'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Projeto Firebase:</span>
                <code className="text-teal-300 font-mono">gen-lang-client-0105711766</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Messaging Sender ID:</span>
                <code className="text-teal-300 font-mono">674424279930</code>
              </div>
            </div>

            {token && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 truncate">Token FCM:</span>
                  <code className="text-slate-300 font-mono text-[11px] truncate">
                    {token.slice(0, 32)}...
                  </code>
                </div>
                <button
                  onClick={handleCopyToken}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] flex items-center gap-1 shrink-0 transition"
                  title="Copiar Token do dispositivo"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3 h-3 text-teal-400" />
                      <span className="text-teal-300">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* FCM Push Triggers & Simulations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Simular e Testar Disparos de Push (FCM)</span>
              </h4>
              <span className="text-[11px] text-slate-500">Áudio & Toast inclusos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Test Medication */}
              <button
                onClick={handleTestMedication}
                disabled={loading}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/60 text-left transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Pill className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase">Paciente</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                    Lembrete de Remédio
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Losartana 50mg • Horário das 08:00
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Disparar Push</span>
                  <Send className="w-3 h-3" />
                </div>
              </button>

              {/* Test Critical Pressure */}
              <button
                onClick={handleTestPressureCritical}
                disabled={loading}
                className="p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/60 text-left transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-rose-300 uppercase">Médico</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-100 group-hover:text-rose-300">
                    Pressão Crítica
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Maria Silva • 175/105 mmHg (Pico)
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <span>Disparar Push</span>
                  <Send className="w-3 h-3" />
                </div>
              </button>

              {/* Test Critical Glucose */}
              <button
                onClick={handleTestGlucoseCritical}
                disabled={loading}
                className="p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/60 text-left transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Médico</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                    Glicemia Crítica
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Maria Silva • 52 mg/dL (Hipoglicemia)
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <span>Disparar Push</span>
                  <Send className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>

          {/* Notifications Feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Histórico de Notificações
                </h4>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-slate-950">
                    {unreadCount} não lidas
                  </span>
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-teal-400 hover:text-teal-300 transition"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('MEDICATION')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'MEDICATION'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Medicamentos
              </button>
              <button
                onClick={() => setFilter('CRITICAL_READING')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'CRITICAL_READING'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Leituras Críticas
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhuma notificação encontrada neste filtro.
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isCrit = notif.type === 'CRITICAL_READING';
                  const isMed = notif.type === 'MEDICATION';

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                        !notif.read
                          ? isCrit
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : isMed
                            ? 'bg-emerald-950/20 border-emerald-800/60'
                            : 'bg-slate-800/80 border-slate-700'
                          : 'bg-slate-800/40 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isCrit
                            ? 'bg-rose-500/20 text-rose-400'
                            : isMed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {isCrit ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isMed ? (
                          <Pill className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-100 truncate">
                            {notif.title}
                          </h5>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(notif.sentAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-1 rounded text-slate-400 hover:text-teal-400 transition"
                                title="Marcar como lida"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                          {notif.body}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Notificações em primeiro plano tocam áudio sintetizado em alta precisão.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
