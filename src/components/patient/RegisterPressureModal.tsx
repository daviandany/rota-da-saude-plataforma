import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, Minus, Plus, HeartPulse } from 'lucide-react';
import { api } from '../../services/api';

interface RegisterPressureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
}

export const RegisterPressureModal: React.FC<RegisterPressureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
}) => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
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
      await api.recordPressure({
        patientId,
        systolic,
        diastolic,
        pulse,
        recordedAt,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pressão.');
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
            <HeartPulse className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Registrar Pressão</h2>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pressão arterial (mmHg)
          </div>

          {/* Systolic */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Pressão sistólica
            </span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                min={50}
                max={300}
                value={systolic || ''}
                onChange={(e) => setSystolic(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="120"
                className="w-28 text-2xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.max(50, (v || 120) - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSystolic((v) => Math.min(300, (v || 120) + 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Diastolic */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Pressão diastólica
            </span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                min={30}
                max={200}
                value={diastolic || ''}
                onChange={(e) => setDiastolic(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="80"
                className="w-28 text-2xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.max(30, (v || 80) - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiastolic((v) => Math.min(200, (v || 80) + 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pulse */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Batimentos (bpm)
            </span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                min={30}
                max={240}
                value={pulse || ''}
                onChange={(e) => setPulse(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="72"
                className="w-28 text-2xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPulse((v) => Math.max(30, (v || 72) - 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPulse((v) => Math.min(240, (v || 72) + 1))}
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
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
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como você está se sentindo?"
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
