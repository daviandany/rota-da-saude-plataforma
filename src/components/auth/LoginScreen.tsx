import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Heart, Shield, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserRole } from '../../types';

interface LoginScreenProps {
  initialRole?: UserRole;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ initialRole = 'PATIENT' }) => {
  const { login, loginDemo, loginGoogle, isFirebaseConnected } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState<string>(
    initialRole === 'PATIENT' ? 'maria.silva@email.com' : 'carlos.mendes@saude.gov.br'
  );
  const [password, setPassword] = useState<string>(
    initialRole === 'PATIENT' ? 'paciente123' : 'medico123'
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRoleToggle = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'PATIENT') {
      setEmail('maria.silva@email.com');
      setPassword('paciente123');
    } else {
      setEmail('carlos.mendes@saude.gov.br');
      setPassword('medico123');
    }
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginGoogle(role, email);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O popup do Google foi fechado antes de completar o login.');
      } else {
        setError(err.message || 'Falha ao autenticar com Google e Firebase.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-gradient-to-b from-slate-50 via-teal-50/20 to-teal-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Top Brand Logo matching Screenshot 1 */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-lg border-2 border-teal-500 flex items-center justify-center mb-4 relative transition-colors">
          <svg className="w-12 h-12 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h4.28" strokeWidth="2.2" stroke="#0d9488" />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-teal-900 dark:text-teal-200 uppercase">
          Rota da Saúde
        </h1>
        <div className="text-xs font-bold text-teal-700 dark:text-teal-400 tracking-wider uppercase mt-0.5">
          Hipertensão | Diabetes
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">Cuidando com Integridade</p>
      </div>

      {/* Role Selector Tabs */}
      <div className="w-full max-w-sm mx-auto mb-4">
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl transition-colors">
          <button
            type="button"
            onClick={() => handleRoleToggle('PATIENT')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              role === 'PATIENT'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Paciente
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('PROFESSIONAL')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              role === 'PROFESSIONAL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Profissional de Saúde
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 transition-colors">
        {/* Google Sign-In with Firebase button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.99] cursor-pointer"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {googleLoading
                ? 'Conectando ao Firebase...'
                : `Entrar com Google (${role === 'PATIENT' ? 'Paciente' : 'Profissional'})`}
            </span>
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Firestore & Auth Conectado</span>
          </div>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <span className="relative px-2 bg-white dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            ou com e-mail institucional
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {notice && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>{notice}</span>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {role === 'PROFESSIONAL' ? 'E-mail profissional' : 'E-mail'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'PROFESSIONAL' ? 'medico@saude.gov.br' : 'seu.email@exemplo.com'}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
              />
              <span>Lembrar-me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setNotice('Em ambiente de demonstração, utilize o acesso rápido com 1 clique abaixo!');
                setTimeout(() => setNotice(null), 4000);
              }}
              className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
            >
              Esqueci minha senha?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Entrando no sistema...' : 'Entrar'}
          </button>
        </form>

        {/* Alternate link */}
        <div className="text-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleRoleToggle(role === 'PATIENT' ? 'PROFESSIONAL' : 'PATIENT')}
            className="text-xs text-teal-800 dark:text-teal-400 hover:underline font-semibold"
          >
            {role === 'PATIENT' ? 'Entrar como profissional de saúde' : 'Entrar como paciente'}
          </button>
        </div>
      </div>

      {/* Quick 1-Click Demo Logins */}
      <div className="w-full max-w-sm mx-auto text-center mt-4">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2">Acesso rápido demonstrativo:</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loginDemo('PATIENT')}
            className="flex-1 py-1.5 px-2 bg-teal-100/70 dark:bg-teal-950/70 hover:bg-teal-200/80 dark:hover:bg-teal-900/80 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-700 rounded-lg text-[11px] font-semibold transition"
          >
            Maria Silva (Paciente)
          </button>
          <button
            type="button"
            onClick={() => loginDemo('PROFESSIONAL')}
            className="flex-1 py-1.5 px-2 bg-blue-100/70 dark:bg-blue-950/70 hover:bg-blue-200/80 dark:hover:bg-blue-900/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 rounded-lg text-[11px] font-semibold transition"
          >
            Dr. Carlos (Médico)
          </button>
        </div>
      </div>

      {/* Subtle footer */}
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-6">
        Rota da Saúde © 2025 • Monitoramento Integrado e Seguro
      </div>
    </div>
  );
};
