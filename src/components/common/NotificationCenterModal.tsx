import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Pill,
  AlertTriangle,
  Calendar,
  Check,
  X,
  Clock,
  CheckCircle2,
  HeartPulse,
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
  } = useNotifications();

  const [filter, setFilter] = useState<'ALL' | 'MEDICATION' | 'CRITICAL_READING' | 'APPOINTMENT'>('ALL');

  if (!isOpen) return null;

  // Filtrar estritamente notificações relevantes ao usuário atual
  const userNotifications = notifications.filter((n) => {
    if (!user) return false;
    if (n.recipientId && n.recipientId === user.id) return true;
    if (user.role === 'PROFESSIONAL' && (n.recipientRole === 'PROFESSIONAL' || n.recipientId === 'all-doctors')) return true;
    if (user.role === 'PATIENT' && n.recipientRole === 'PATIENT') return true;
    return false;
  });

  const filteredNotifications = userNotifications.filter((n) => {
    if (filter === 'ALL') return true;
    if (filter === 'APPOINTMENT') return n.type === 'APPOINTMENT' || n.type === 'GENERAL';
    return n.type === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <Bell className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Minhas Notificações</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-slate-950">
                    {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Lembretes de medicação, consultas e avisos clínicos de saúde
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {/* Quick Push Permission status (clean & non-technical) */}
          {permission !== 'granted' && !token && (
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  Deseja receber avisos de remédios e consultas na tela do dispositivo?
                </span>
              </div>
              <button
                onClick={requestPushPermission}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 transition"
              >
                {loading ? 'Ativando...' : 'Ativar'}
              </button>
            </div>
          )}

          {/* Controls & Filter */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({userNotifications.length})
              </button>
              <button
                onClick={() => setFilter('MEDICATION')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'MEDICATION'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Medicamentos
              </button>
              <button
                onClick={() => setFilter('CRITICAL_READING')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  filter === 'CRITICAL_READING'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Alertas
              </button>
            </div>

            {userNotifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-800/30 border border-slate-800/80">
                <CheckCircle2 className="w-10 h-10 text-teal-500/50 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-slate-300">Nenhuma notificação no momento</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Você está em dia com seus horários de medicamentos, aferições de saúde e consultas agendadas.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isCrit = notif.type === 'CRITICAL_READING';
                const isMed = notif.type === 'MEDICATION';
                const isApp = notif.type === 'APPOINTMENT';

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
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-400'
                          : isMed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isApp
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-teal-500/20 text-teal-400'
                      }`}
                    >
                      {isCrit ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isMed ? (
                        <Pill className="w-4 h-4" />
                      ) : isApp ? (
                        <Calendar className="w-4 h-4" />
                      ) : (
                        <HeartPulse className="w-4 h-4" />
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
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/60 border-t border-slate-700/60 flex items-center justify-end">
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
