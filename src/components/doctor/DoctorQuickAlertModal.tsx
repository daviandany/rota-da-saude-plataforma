import React, { useState } from 'react';
import { ArrowLeft, BellRing, AlertTriangle, Send } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface DoctorQuickAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DoctorQuickAlertModal: React.FC<DoctorQuickAlertModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const [targetPatient, setTargetPatient] = useState('Maria Silva');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('WARNING');
  const [title, setTitle] = useState('Alerta de Acompanhamento Pressórico');
  const [message, setMessage] = useState(
    'Favor registrar sua pressão arterial de hoje pela manhã e à noite antes de deitar.'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    showNotification({
      type: severity === 'CRITICAL' ? 'CRITICAL_READING' : 'GENERAL',
      title: `Alerta Clínico: ${title}`,
      body: `Enviado para ${targetPatient}: ${message}`,
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Emitir Alerta Clínico
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paciente de Destino
            </label>
            <select
              value={targetPatient}
              onChange={(e) => setTargetPatient(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none"
            >
              <option value="Maria Silva">Maria Silva (68 anos - Alto Risco)</option>
              <option value="Carlos Eduardo">Carlos Eduardo (54 anos - Moderado)</option>
              <option value="Ana Beatriz">Ana Beatriz (72 anos - Alto Risco)</option>
              <option value="Todos os pacientes de alto risco">
                📢 Todos os Pacientes com PA &gt; 140/90
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gravidade do Alerta
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('INFO')}
                className={`py-2 text-xs font-bold rounded-xl border text-center transition ${
                  severity === 'INFO'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Informativo
              </button>
              <button
                type="button"
                onClick={() => setSeverity('WARNING')}
                className={`py-2 text-xs font-bold rounded-xl border text-center transition ${
                  severity === 'WARNING'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Atenção
              </button>
              <button
                type="button"
                onClick={() => setSeverity('CRITICAL')}
                className={`py-2 text-xs font-bold rounded-xl border text-center transition ${
                  severity === 'CRITICAL'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Crítico
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título do Alerta
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mensagem / Orientação Clínica
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Disparando...' : 'Disparar Alerta Imediato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
