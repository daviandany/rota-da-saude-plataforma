import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Heart,
  Activity,
  Users,
  AlertTriangle,
  Calendar,
  FileText,
  BookOpen,
  LogOut,
  Smartphone,
  Monitor,
  Database,
  Bell,
  User,
  UserCheck,
  Stethoscope,
  Pill,
  CheckCircle2,
} from 'lucide-react';

interface WebLayoutProps {
  children: React.ReactNode;
  onOpenNotificationModal: () => void;
  onOpenProfileModal?: () => void;
}

export const WebLayout: React.FC<WebLayoutProps> = ({
  children,
  onOpenNotificationModal,
  onOpenProfileModal,
}) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Responsive Application Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-3 shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand & Clinic Center */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-white">Rota da Saúde</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  SUS
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                {user?.role === 'PROFESSIONAL'
                  ? `Painel Clínico · ${user?.profile?.healthcareUnit || 'Atenção Primária'}`
                  : `Prontuário · ${user?.profile?.healthcareUnit || 'UBS de Referência'}`}
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Real User Profile Information Button (No Mocks!) */}
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 active:scale-95 rounded-xl border border-slate-700/60 text-xs transition cursor-pointer group"
              title="Visualizar e editar minhas informações cadastrais"
            >
              <User className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-300 shrink-0" />
              <span className="font-bold text-white text-xs hidden sm:inline max-w-[130px] truncate">
                {user?.name || 'Meu Perfil'}
              </span>
              <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded-md border border-teal-500/30">
                Meus Dados
              </span>
            </button>

            {/* Global Dark Mode Switcher */}
            <ThemeToggle />

            {/* FCM Push Notifications Bell */}
            <button
              onClick={onOpenNotificationModal}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Minhas Notificações"
            >
              <Bell className="w-4 h-4 text-teal-400" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
              )}
            </button>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-teal-500 shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-800 text-teal-200 font-black text-xs flex items-center justify-center border border-teal-600">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
              )}

              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5 justify-end">
                  <span>{user?.name || 'Usuário'}</span>
                  {user?.isGoogleAuth && (
                    <span className="text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1 rounded" title="Autenticado com Google">
                      Google
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.role === 'PROFESSIONAL' ? 'Médico de Família' : 'Paciente SUS'}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sair da conta"
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-8">
        {children}
      </main>

      {/* Responsive Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 lg:px-8 text-slate-500 dark:text-slate-400 text-xs text-center transition-colors">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Rota da Saúde</span>
            <span aria-hidden="true">·</span>
            <span>Atenção Primária à Saúde (SUS)</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Hipertensão e Diabetes</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
            <span>Alertas Clínicos Ativos</span>
            <span aria-hidden="true">·</span>
            <span>Design Responsivo Integrado</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
