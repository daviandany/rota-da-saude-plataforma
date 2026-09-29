import React from 'react';
import { Smartphone, Monitor, UserCheck, ShieldCheck, Database, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
  viewMode?: 'web' | 'mobile';
  onSelectViewMode?: (mode: 'web' | 'mobile') => void;
  onOpenArchModal: () => void;
  onOpenNotificationModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isMobileFrame,
  onToggleMobileFrame,
  viewMode = 'web',
  onSelectViewMode,
  onOpenArchModal,
  onOpenNotificationModal,
}) => {
  const { user, loginDemo, logout } = useAuth();
  const { unreadCount, permission } = useNotifications();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">ROTA DA SAÚDE</span>
              <span className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">Hipertensão | Diabetes</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Node.js Scalable Backend</span>
            <span className="text-slate-600">•</span>
            <span>JWT Auth</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-semibold">Supabase (PostgreSQL)</span>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Demo Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => loginDemo('PATIENT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 ${
                user?.role === 'PATIENT'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Alternar para visão de Maria Silva"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Maria (Paciente)</span>
            </button>
            <button
              onClick={() => loginDemo('PROFESSIONAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 ${
                user?.role === 'PROFESSIONAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Alternar para visão do Dr. Carlos Mendes"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Dr. Carlos (Médico)</span>
            </button>
          </div>

          {/* Segmented Device View Switcher: Web vs Mobile */}
          {onSelectViewMode ? (
            <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700/80">
              <button
                onClick={() => onSelectViewMode('web')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'web'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alternar para visão Web Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Portal Web</span>
              </button>
              <button
                onClick={() => onSelectViewMode('mobile')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'mobile'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alternar para o simulador App Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>App Mobile</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleMobileFrame}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                isMobileFrame
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isMobileFrame ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Moldura Mobile Ativa</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tela Expandida</span>
                </>
              )}
            </button>
          )}

          {/* Architecture / Docker / Supabase Modal Button */}
          <button
            onClick={onOpenArchModal}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Supabase & Docker</span>
          </button>

          {/* Theme Mode Toggle Button */}
          <ThemeToggle />

          {/* FCM Push Notifications Bell Button */}
          <button
            onClick={onOpenNotificationModal}
            title="Central de Notificações Push FCM"
            className="relative px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Bell className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Push FCM</span>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                {unreadCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-teal-400" />
            )}
          </button>

          {user && (
            <button
              onClick={logout}
              title="Sair"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
