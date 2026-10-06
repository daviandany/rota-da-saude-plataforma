import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Smile, Frown, Meh, Activity } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { saveSymptomLogToSupabase } from '../../services/supabaseClient';

interface RegisterSymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_SYMPTOMS = [
  { id: 'normal', label: 'Estou me sentindo bem', severity: 'low', icon: Smile, color: 'emerald' },
  { id: 'cefaleia', label: 'Dor de cabeça (Cefaleia)', severity: 'medium', icon: AlertCircle, color: 'amber' },
  { id: 'tontura', label: 'Tontura ou vertigem', severity: 'medium', icon: Meh, color: 'amber' },
  { id: 'visao_turva', label: 'Visão turva / embaçada', severity: 'high', icon: Frown, color: 'rose' },
  { id: 'palpitacao', label: 'Palpitações no peito', severity: 'high', icon: Activity, color: 'rose' },
  { id: 'falta_ar', label: 'Falta de ar ou cansaço leve', severity: 'high', icon: AlertCircle, color: 'rose' },
];

export const RegisterSymptomModal: React.FC<RegisterSymptomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const toggleSymptom = (id: string) => {
    if (id === 'normal') {
      setSelectedSymptoms(['normal']);
      return;
    }
    const filtered = selectedSymptoms.filter((s) => s !== 'normal');
    if (filtered.includes(id)) {
      setSelectedSymptoms(filtered.filter((s) => s !== id));
    } else {
      setSelectedSymptoms([...filtered, id]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;

    setLoading(true);
    const isHigh = selectedSymptoms.some(
      (s) => ['visao_turva', 'palpitacao', 'falta_ar'].includes(s)
    );
    const isMedium = selectedSymptoms.some((s) => ['cefaleia', 'tontura'].includes(s));

    try {
      await saveSymptomLogToSupabase({
        patientId: user?.profileId || undefined,
        symptoms: selectedSymptoms,
        severity: isHigh ? 'ALTA' : isMedium ? 'MEDIA' : 'BAIXA',
        notes,
        fallbackUserId: user?.id,
      });
    } catch (err) {
      console.warn('[Supabase] Registro de sintoma local mantido:', err);
    }

    showNotification({
      type: isHigh ? 'CRITICAL_READING' : 'GENERAL',
      title: isHigh ? 'Atenção aos Sintomas Registrados' : 'Sintomas Registrados com Sucesso',
      body: isHigh
        ? 'Você registrou sintomas importantes. Caso a pressão esteja acima de 160/100 ou sinta dor forte, procure atendimento ou acione o SOS.'
        : 'Registro de bem-estar diário salvo no seu histórico clínico.',
    });

    setSaved(true);
    setLoading(false);
    setTimeout(() => {
      setSaved(false);
      setSelectedSymptoms([]);
      setNotes('');
      if (onSuccess) onSuccess();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Como você está se sentindo?
            </h2>
          </div>
        </div>

        {saved ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registro Salvo!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seus sintomas foram anotados na sua linha de cuidado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione o que você está sentindo no momento para acompanhamento da sua equipe médica:
            </p>

            <div className="space-y-2">
              {COMMON_SYMPTOMS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedSymptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? item.color === 'emerald'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                          : item.color === 'rose'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300 shadow-xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white font-bold'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações adicionais (opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Começou após o almoço, tomei água e descansei..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={selectedSymptoms.length === 0 || loading}
                className="w-full py-3 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Salvando...' : 'Confirmar Registro de Sintomas'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
