import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Heart,
  Activity,
  ShieldCheck,
  User,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

interface WebLoginScreenProps {
  onSwitchToMobile?: () => void;
}

export const WebLoginScreen: React.FC<WebLoginScreenProps> = ({ onSwitchToMobile }) => {
  const { login, loginDemo } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'PROFESSIONAL'>('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'PATIENT' | 'PROFESSIONAL') => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo(role);
    } catch (err: any) {
      setError(err.message || 'Erro no login demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Left Column: Clinical Showcase */}
        <div className="lg:col-span-6 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg font-black text-xl">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">Rota da Saúde</h1>
                <p className="text-xs text-teal-200 font-medium tracking-wide">
                  Hipertensão e Diabetes · Portal Web Integrado
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Cuidado contínuo para hipertensão e diabetes em qualquer lugar.
            </h2>
            <p className="text-sm text-teal-100/90 leading-relaxed mb-8">
              Plataforma clínica em conformidade com as diretrizes da Atenção Primária à Saúde.
              Monitore aferições de pressão arterial e glicemia capilar com alertas críticos em tempo real via Firebase Cloud Messaging.
            </p>

            {/* Key Value Points */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Aferições e Gráficos Inteligentes</h4>
                  <p className="text-[11px] text-teal-200/80">
                    Histórico detalhado com estratificação de risco (baixo, moderado e alto).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Alertas Push Instantâneos (FCM)</h4>
                  <p className="text-[11px] text-teal-200/80">
                    Médicos são notificados imediatamente em picos de PA ou hipoglicemia severa.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Relatório Médico Pronto em PDF</h4>
                  <p className="text-[11px] text-teal-200/80">
                    Exportação instantânea de resumo clínico completo para consultas no SUS.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Switch to Mobile preview shortcut */}
          <div className="pt-8 mt-8 border-t border-teal-700/60 flex items-center justify-between text-xs text-teal-200">
            <span>Prefere o aplicativo móvel?</span>
            {onSwitchToMobile && (
              <button
                type="button"
                onClick={onSwitchToMobile}
                className="flex items-center gap-1.5 text-white font-bold hover:text-teal-300 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Alternar para Modo Mobile</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors relative">
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Acesso Seguro
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Entrar na Plataforma
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecione o perfil desejado ou use o acesso demonstrativo com 1 clique.
              </p>
            </div>

            {/* Quick 1-Click Demo Buttons */}
            <div className="mb-6 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Acesso Rápido de Demonstração:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('PATIENT')}
                  disabled={loading}
                  className="p-3 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 rounded-xl transition text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <User className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span className="text-[10px] font-bold bg-teal-200/80 dark:bg-teal-800 text-teal-800 dark:text-teal-200 px-1.5 py-0.5 rounded">
                      Demo
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Maria Silva</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Paciente (62 anos)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('PROFESSIONAL')}
                  disabled={loading}
                  className="p-3 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 rounded-xl transition text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span className="text-[10px] font-bold bg-blue-200/80 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                      Demo
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Carlos Mendes</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Médico de Família</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-400">
                ou acesse com suas credenciais
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail institucional ou pessoal
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Senha de acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Autenticando...' : 'Entrar no Portal Web'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Ambiente protegido por criptografia e controle de acesso baseado em papéis (RBAC).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
