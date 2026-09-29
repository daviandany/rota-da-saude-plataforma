import React, { useEffect } from 'react';
import { useNotifications, AppNotification } from '../../context/NotificationContext';
import { Bell, Pill, AlertTriangle, X, Check, ArrowRight } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, closeToast, markAsRead } = useNotifications();

  useEffect(() => {
    if (!activeToast) return;
    // Auto fecha após 10 segundos se não for crítico
    if (activeToast.type !== 'CRITICAL_READING') {
      const timer = setTimeout(() => {
        closeToast();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, closeToast]);

  if (!activeToast) return null;

  const isCritical = activeToast.type === 'CRITICAL_READING';
  const isMedication = activeToast.type === 'MEDICATION';

  return (
    <div className="fixed top-18 right-4 z-50 max-w-sm sm:max-w-md w-full animate-bounce-in shadow-2xl rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-white transition-all">
      <div
        className={`px-4 py-3 flex items-start gap-3 border-l-4 ${
          isCritical
            ? 'border-rose-500 bg-rose-950/40'
            : isMedication
            ? 'border-emerald-500 bg-emerald-950/40'
            : 'border-blue-500 bg-blue-950/40'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCritical
              ? 'bg-rose-500 text-white animate-pulse'
              : isMedication
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isCritical ? (
            <AlertTriangle className="w-5 h-5" />
          ) : isMedication ? (
            <Pill className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                isCritical
                  ? 'bg-rose-500/20 text-rose-300'
                  : isMedication
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {isCritical ? 'Firebase Push • Crítico' : isMedication ? 'FCM • Medicamento' : 'Push Notification'}
            </span>
            <button
              onClick={closeToast}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-slate-100 mt-1 leading-snug">
            {activeToast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {activeToast.body}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400">
              Agora mesmo • FCM Web Push
            </span>
            <button
              onClick={() => {
                markAsRead(activeToast.id);
                closeToast();
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span>Marcar como lida</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
