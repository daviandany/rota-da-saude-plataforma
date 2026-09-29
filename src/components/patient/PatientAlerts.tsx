import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { ClinicalAlert } from '../../types';

export const PatientAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    await api.resolveAlert(id);
    fetchAlerts();
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <h1 className="text-base font-bold text-slate-800 dark:text-white text-center">
          Alertas Clínicos
        </h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
            Carregando alertas...
          </div>
        ) : (
          <>
            {/* Critical Alert */}
            <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 relative shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    Situação crítica
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-200 mt-1 max-w-[220px]">
                    Sua pressão está elevada. Mantenha repouso e tome a medicação prescrita.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-rose-200/60 dark:border-rose-900/60">
                <div className="text-lg font-black text-rose-900 dark:text-rose-100">
                  180 / 110 <span className="text-xs font-normal">mmHg</span>
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  07/05 às 07:45
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 relative shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    Atenção aos Níveis
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 max-w-[220px]">
                    Sua glicemia está acima do ideal. Monitore sua alimentação e hidrate-se.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/60">
                <div className="text-lg font-black text-amber-900 dark:text-amber-100">
                  215 <span className="text-xs font-normal">mg/dL</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  06/05 às 20:10
                </div>
              </div>
            </div>

            {/* Self-Care Tip */}
            <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 shadow-xs">
              <div className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Dica de autocuidado</span>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
                Reduza o consumo de sódio e pratique caminhadas leves regularmente. Beba ao menos 2 litros de água e evite café após as 18h.
              </p>
            </div>

            {/* Dynamic alerts */}
            {alerts
              .filter(
                (a) =>
                  a.status === 'PENDENTE' &&
                  a.id !== 'alt-1' &&
                  a.id !== 'alt-2' &&
                  a.id !== 'alt-3'
              )
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {alert.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {alert.message}
                    </div>
                    {alert.valueRecorded && (
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-400 mt-1">
                        {alert.valueRecorded}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                    title="Marcar como ciente"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
};
