import React from 'react';
import { ArrowLeft, PhoneCall, AlertTriangle, HeartPulse, ShieldAlert, Navigation } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-200 dark:border-rose-900/50 flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-rose-100 dark:border-rose-950 bg-rose-500 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:bg-rose-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              <h2 className="text-base font-bold text-white">Canal de Emergência (SOS)</h2>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* SAMU 192 Instant Call */}
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700 rounded-2xl p-4 text-center space-y-3 shadow-md">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-600 text-white">
              Crise Hipertensiva ou Emergência
            </span>
            <p className="text-xs text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
              Se sua pressão estiver <strong>acima de 180x120 mmHg</strong> e acompanhada de dor no peito, falta de ar severa ou dormência:
            </p>
            <a
              href="tel:192"
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-sm tracking-wide shadow-lg transition active:scale-95"
            >
              <PhoneCall className="w-5 h-5 animate-pulse" />
              Ligar Imediatamente 192 (SAMU)
            </a>
          </div>

          {/* Quick instructions */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              O que fazer agora:
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pl-2">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>Sente-se e respire fundo:</strong> Permaneça em repouso por 5 minutos em posição confortável.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>Não tome remédios extras sem orientação:</strong> Tomar medicação a mais de forma abrupta pode ser perigoso.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span><strong>Verifique novamente a pressão:</strong> Meça após 10 minutos de repouso calmo.</span>
              </li>
            </ul>
          </div>

          {/* Nearest UPA / Health center guide */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3.5 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Unidade de Saúde Mais Próxima:</strong> Em caso de mal-estar contínuo, dirija-se à UPA ou Pronto Atendimento 24h mais próximo com um acompanhante.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
