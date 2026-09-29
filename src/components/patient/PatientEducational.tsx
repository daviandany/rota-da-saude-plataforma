import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Info } from 'lucide-react';
import { api } from '../../services/api';
import { EducationalContent } from '../../types';

interface PatientEducationalProps {
  onBack?: () => void;
}

export const PatientEducational: React.FC<PatientEducationalProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'TODOS' | 'DIABETES' | 'PRESSAO'>('TODOS');
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [selectedItem, setSelectedItem] = useState<EducationalContent | null>(null);

  useEffect(() => {
    api.getEducational(filter).then(setContents).catch(console.error);
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
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Mitos e Verdades</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Filter Pills */}
        <div className="flex gap-2">
          {(['TODOS', 'DIABETES', 'PRESSAO'] as const).map((cat) => {
            const labels = {
              TODOS: 'Todos',
              DIABETES: 'Diabetes',
              PRESSAO: 'Pressão',
            };
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`py-1.5 px-4 text-xs font-semibold rounded-xl border transition ${
                  filter === cat
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {labels[cat]}
              </button>
            );
          })}
        </div>

        {/* Content Cards */}
        <div className="space-y-3">
          {contents.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Badge */}
              <div className="flex items-center gap-1.5">
                {item.type === 'MITO' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Mito</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VERDADE</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h3>

              {/* Explanation Text */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.explanation}
              </p>

              {/* Action Saiba Mais */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 flex items-center gap-0.5 transition"
                >
                  <span>Saiba Mais</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Saiba Mais */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-3 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedItem.type === 'MITO' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'}`}>
                {selectedItem.type}
              </span>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold">✕</button>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{selectedItem.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedItem.statement}</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              {selectedItem.explanation}
            </p>
            {selectedItem.source && (
              <div className="text-[10px] text-slate-400">Fonte: {selectedItem.source}</div>
            )}
            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
