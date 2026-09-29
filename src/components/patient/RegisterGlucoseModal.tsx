import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, Minus, Plus, Droplets } from 'lucide-react';
import { api } from '../../services/api';
import { GlucoseMoment } from '../../types';

interface RegisterGlucoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
}

const MOMENTS: { label: string; value: GlucoseMoment }[] = [
  { label: 'Em jejum', value: 'EM_JEJUM' },
  { label: 'Antes do almoço', value: 'ANTES_ALMOCO' },
  { label: 'Após o almoço', value: 'APOS_ALMOCO' },
  { label: 'Antes do jantar', value: 'ANTES_JANTAR' },
  { label: 'Após o jantar', value: 'APOS_JANTAR' },
  { label: 'Ao dormir', value: 'AO_DORMIR' },
];

export const RegisterGlucoseModal: React.FC<RegisterGlucoseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) => {
  const [glucoseValue, setGlucoseValue] = useState<number>(98);
  const [moment, setMoment] = useState<GlucoseMoment>('EM_JEJUM');
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const recordedAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      await api.recordGlucose({
        patientId,
        glucoseValue,
        moment,
        recordedAt,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar glicemia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] transition-colors">
        {/* Top Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Registrar Glicemia</h2>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Glucose Value Counter */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Valor de glicose (mg/dL)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{glucoseValue}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGlucoseValue((v) => Math.max(30, v - 1))}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGlucoseValue((v) => Math.min(500, v + 1))}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Momento da medição Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Momento da medição
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOMENTS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMoment(m.value)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition ${
                    moment === m.value
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Data e hora
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: após caminhada, jejum de 8h, etc."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar medição'}
          </button>
        </form>
      </div>
    </div>
  );
};
