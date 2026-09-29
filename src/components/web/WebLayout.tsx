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
  UserCheck,
  Stethoscope,
  Pill,
  CheckCircle2,
} from 'lucide-react';

interface WebLayoutProps {
  children: React.ReactNode;
  onSwitchToMobile: () => void;
  onOpenArchModal: () => void;
  onOpenNotificationModal: () => void;
}

export const WebLayout: React.FC<WebLayoutProps> = ({
  children,
  onSwitchToMobile,
  onOpenArchModal,
  onOpenNotificationModal,
}) => {
  const { user, logout, loginDemo } = useAuth();
  const { unreadCount, permission } = useNotifications();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Enterprise Web Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3 shadow-md">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Brand & Clinic Center */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">Rota da Saúde</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Portal Web
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {user?.role === 'PROFESSIONAL'
                  ? 'Painel Clínico Integrado · UBS Dr. Manoel de Abreu'
                  : 'Portal do Paciente · Acompanhamento Hipertensão & Diabetes'}
              </p>
            </div>
          </div>

          {/* Center Actions: View Switcher (Desktop Web vs Mobile App) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-xl border border-slate-700/60">
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 text-slate-950 shadow-xs flex items-center gap-1.5 transition"
              title="Você está na visão Web Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Portal Web</span>
            </button>

            <button
              onClick={onSwitchToMobile}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center gap-1.5 transition"
              title="Alternar para o simulador do aplicativo mobile"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>App Mobile</span>
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Quick Demo Switcher */}
            <div className="hidden lg:flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700/60 text-xs">
              <button
                onClick={() => loginDemo('PATIENT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  user?.role === 'PATIENT'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alternar visão para Maria Silva (Paciente)"
              >
                <UserCheck className="w-3 h-3" />
                <span>Maria (Paciente)</span>
              </button>
              <button
                onClick={() => loginDemo('PROFESSIONAL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  user?.role === 'PROFESSIONAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alternar visão para Dr. Carlos Mendes (Médico)"
              >
                <Stethoscope className="w-3 h-3" />
                <span>Dr. Carlos (Médico)</span>
              </button>
            </div>

            {/* Architecture Modal */}
            <button
              onClick={onOpenArchModal}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Supabase & Docker</span>
            </button>

            {/* Global Dark Mode Switcher */}
            <ThemeToggle />

            {/* FCM Push Notifications Bell */}
            <button
              onClick={onOpenNotificationModal}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Central de Notificações Push FCM"
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

            {/* Mobile Switcher Button on smaller screens */}
            <button
              onClick={onSwitchToMobile}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Alternar para Mobile"
            >
              <Smartphone className="w-4 h-4 text-teal-400" />
            </button>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white leading-tight">
                  {user?.name || 'Usuário'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {user?.role === 'PROFESSIONAL' ? 'Médico de Família' : 'Paciente SUS'}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sair da conta"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-8">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 lg:px-8 text-slate-500 dark:text-slate-400 text-xs text-center transition-colors">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-200">Rota da Saúde</span>
            <span aria-hidden="true">·</span>
            <span>Atenção Primária à Saúde (SUS)</span>
            <span aria-hidden="true">·</span>
            <span>Hipertensão Arterial e Diabetes Mellitus</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
            <span>FCM Push Ativo</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL / Supabase</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={onSwitchToMobile}
              className="text-teal-700 dark:text-teal-400 hover:underline font-semibold"
            >
              Abrir Modo Mobile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
