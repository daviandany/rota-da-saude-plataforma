import React, { useState } from 'react';
import {
  User,
  Smartphone,
  BookOpen,
  FileText,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface PatientMenuProps {
  onNavigateTab: (tab: string) => void;
}

export const PatientMenu: React.FC<PatientMenuProps> = ({
  onNavigateTab,
}) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-20 transition-colors">
      {/* Header */}
      <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Mais Opções</h1>
      </div>

      <div className="p-5 space-y-4">
        {feedbackMsg && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-700 rounded-xl text-teal-800 dark:text-teal-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* User Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center gap-3.5 transition-colors">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
            alt="Maria Silva"
            className="w-14 h-14 rounded-full object-cover border-2 border-teal-500/40"
          />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Maria Silva'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">58 anos • HAS / DM</p>
            <button
              onClick={() => showNotice('Prontuário e dados pessoais sincronizados com a Clínica da Família.')}
              className="text-xs font-semibold text-teal-800 dark:text-teal-400 hover:underline mt-0.5 inline-block"
            >
              Ver perfil &gt;
            </button>
          </div>
        </div>

        {/* Menu list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          {/* Interactive Dark Mode Switcher Row */}
          <div className="w-full px-4 py-3.5 flex items-center justify-between text-left">
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              {isDark ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Modo Escuro (Dark Mode)</span>
            </div>
            <button
              onClick={toggleTheme}
              type="button"
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                isDark ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  isDark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => showNotice('Dados pessoais sincronizados com o SUS / Clínica da Família.')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Meus Dados</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => showNotice('Conexão Bluetooth ativa com Medidor Digital de Pressão Omron e Glicosímetro Accu-Chek.')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <Smartphone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Dispositivos Conectados</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              2 pareados
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('educacional')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Mitos e Verdades (Saúde)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateTab('relatorios')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Relatórios Médicos em PDF</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => showNotice('Suporte técnico: Central da Família 0800 722 0000 ou suporte@rotadasaude.gov.br')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Ajuda e Suporte</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => showNotice('Rota da Saúde v1.0 • Plataforma de Cuidado em Hipertensão e Diabetes')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left"
          >
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
              <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Sobre o Aplicativo</span>
            </div>
            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              v1.0
            </span>
          </button>
        </div>

        {/* Sair */}
        <button
          onClick={logout}
          className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-3 transition shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );
};
