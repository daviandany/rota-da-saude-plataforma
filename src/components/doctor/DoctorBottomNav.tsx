import React from 'react';
import { LayoutDashboard, Users, AlertTriangle, Calendar, MoreHorizontal } from 'lucide-react';

interface DoctorBottomNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  criticalAlertsCount?: number;
}

export const DoctorBottomNav: React.FC<DoctorBottomNavProps> = ({
  activeTab,
  onChangeTab,
  criticalAlertsCount = 15,
}) => {
  const tabs = [
    { id: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'alertas', label: 'Alertas', icon: AlertTriangle, badge: criticalAlertsCount },
    { id: 'consultas', label: 'Consultas', icon: Calendar },
    { id: 'mais', label: 'Mais', icon: MoreHorizontal },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 z-30 px-2 py-2 shadow-xl transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative min-w-[54px] min-h-[44px] active:scale-95 ${
                isActive
                  ? 'text-teal-700 dark:text-teal-400 font-bold bg-teal-50/70 dark:bg-teal-950/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
