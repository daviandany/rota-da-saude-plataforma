import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { sendFirebasePasswordReset } from '../../services/firebase';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserRole } from '../../types';
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
  Eye,
  EyeOff,
  UserCheck,
  Copy,
  Check,
  KeyRound,
  Send,
  ArrowLeft,
  Clock,
  ExternalLink,
  ShieldAlert,
  Building2,
  FileText,
  Pill,
} from 'lucide-react';

type ScreenTab = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

export const WebLoginScreen: React.FC = () => {
  const { login, register, loginGoogle, isFirebaseConnected } = useAuth();
  
  // Navigation tab
  const [tab, setTab] = useState<ScreenTab>('LOGIN');

  // Form Fields for Login / Register (Clean without mocks)
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Additional fields for Register
  const [age, setAge] = useState<number>(45);
  const [susCard, setSusCard] = useState<string>('');
  const [crm, setCrm] = useState<string>('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'Hipertensão Arterial (HAS)',
    'Diabetes Mellitus Tipo 2',
  ]);

  // Forgot Password & Reset Password state
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [recoveryPreview, setRecoveryPreview] = useState<{
    to: string;
    userName: string;
    subject: string;
    resetLink: string;
    expiresInMinutes: number;
    sentAt: string;
  } | null>(null);

  const [resetToken, setResetToken] = useState<string>('');
  const [tokenValidating, setTokenValidating] = useState<boolean>(false);
  const [tokenUserInfo, setTokenUserInfo] = useState<{ email: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Listen for resetToken in query or hash on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let token = params.get('resetToken') || params.get('token');

    if (!token && window.location.hash.includes('token=')) {
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
      token = hashParams.get('token') || hashParams.get('resetToken');
    }

    if (token) {
      setResetToken(token);
      setTab('RESET_PASSWORD');
      handleVerifyToken(token);
    }
  }, []);

  const handleVerifyToken = async (token: string) => {
    setTokenValidating(true);
    setError(null);
    try {
      const res = await api.verifyResetToken(token);
      if (res.valid) {
        setTokenUserInfo({ email: res.email, userName: res.userName });
      }
    } catch (err: any) {
      setError(err.message || 'Link de recuperação inválido ou expirado.');
    } finally {
      setTokenValidating(false);
    }
  };

  const copyResetLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Login via Firebase
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginGoogle(selectedRole, email);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O popup do Google foi fechado antes de completar o login.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Tentativa de login cancelada.');
      } else {
        setError(err.message || 'Falha ao autenticar com o Google via Firebase.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Submit Login or Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'REGISTER') {
        await register({
          name: name.trim() || (selectedRole === 'PROFESSIONAL' ? 'Dr. Profissional' : 'Paciente SUS'),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
          age: selectedRole === 'PATIENT' ? age : undefined,
          crm: selectedRole === 'PROFESSIONAL' ? crm : undefined,
          conditions: selectedRole === 'PATIENT' ? selectedConditions : undefined,
        });
      } else {
        await login(
          email.trim().toLowerCase(),
          password,
          name.trim() || undefined,
          selectedRole
        );
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login ou cadastro.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Request Password Recovery Link
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotLoading(true);
    setRecoveryPreview(null);

    const targetEmail = forgotEmail.trim().toLowerCase();
    try {
      const res = await api.forgotPassword(targetEmail);
      setRecoveryPreview(res.previewEmail);
      sendFirebasePasswordReset(targetEmail);
    } catch (err: any) {
      setError(err.message || 'Não foi possível enviar o link de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Submit Reset Password with New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Verifique a confirmação.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setResetSuccessMessage(res.message);
      
      setPassword(newPassword);
      if (res.email) setEmail(res.email);
      setTimeout(() => {
        setTab('LOGIN');
        setResetSuccessMessage(null);
        setResetToken('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Falha ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Left Column: Real Institutional SUS Guidelines (Clean, No Mocks!) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg font-black text-xl">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Rota da Saúde</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    SUS
                  </span>
                </h1>
                <p className="text-xs text-teal-200 font-medium">
                  Hipertensão & Diabetes · Atenção Primária
                </p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug mb-3">
              Cuidado integral e monitoramento clínico contínuo.
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed mb-6 font-normal">
              Plataforma oficial para acompanhamento individualizado de pacientes com hipertensão e diabetes, conectada à equipe de saúde da família.
            </p>

            {/* Institutional Highlights (Real Features) */}
            <div className="space-y-3 mb-6">
              <div className="bg-teal-950/60 border border-teal-700/60 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Registro de Pressão & Glicemia</h4>
                  <p className="text-[11px] text-teal-200/80 leading-relaxed">
                    Histórico cronológico, cálculo de médias e classificação automática de risco conforme diretrizes clínicas do SUS.
                  </p>
                </div>
              </div>

              <div className="bg-teal-950/60 border border-teal-700/60 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Pill className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Prescrição e Lembretes de Medicamentos</h4>
                  <p className="text-[11px] text-teal-200/80 leading-relaxed">
                    Controle de posologia diária com notificações de adesão e histórico de medicamentos em uso.
                  </p>
                </div>
              </div>

              <div className="bg-teal-950/60 border border-teal-700/60 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Conexão com sua UBS</h4>
                  <p className="text-[11px] text-teal-200/80 leading-relaxed">
                    Prontuário integrado para visualização médica e suporte em consultas na unidade básica de saúde.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer security badges */}
          <div className="pt-4 border-t border-teal-800/60 flex items-center justify-between text-[11px] text-teal-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dados protegidos · LGPD</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Acesso Gratuito SUS</span>
            </span>
          </div>
        </div>

        {/* Right Column: Authentication Form with Google & User Information Inputs */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white dark:bg-slate-900 transition-colors relative">
          {/* Top Header Actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {isFirebaseConnected ? 'Firebase & Firestore Online' : 'Banco de Dados Conectado'}
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="max-w-lg mx-auto w-full">
            {/* Global Error Banner */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Global Success Banner */}
            {resetSuccessMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* TAB: FORGOT PASSWORD */}
            {tab === 'FORGOT_PASSWORD' && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setRecoveryPreview(null);
                    setTab('LOGIN');
                  }}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o login</span>
                </button>

                <div className="mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Recuperação de Senha
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Informe seu e-mail cadastrado. Enviaremos um link de redefinição com validade de 60 minutos para você recuperar seu acesso.
                  </p>
                </div>

                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{forgotLoading ? 'Gerando e Enviando Link...' : 'Enviar Link de Recuperação'}</span>
                  </button>
                </form>

                {/* Simulated E-mail Preview Card */}
                {recoveryPreview && (
                  <div className="mt-6 p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        E-mail de Recuperação Enviado!
                      </span>
                      <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira em 60m
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
                      Um link seguro foi gerado para <strong>{recoveryPreview.to}</strong>. Você pode clicar no botão abaixo para redefinir a senha agora:
                    </p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = new URL(recoveryPreview.resetLink);
                          const token = url.searchParams.get('resetToken') || '';
                          setResetToken(token);
                          setTab('RESET_PASSWORD');
                          handleVerifyToken(token);
                        }}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Link de Redefinição Agora</span>
                      </button>

                      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-teal-200/80 dark:border-teal-900 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        <span className="truncate flex-1">{recoveryPreview.resetLink}</span>
                        <button
                          type="button"
                          onClick={() => copyResetLink(recoveryPreview.resetLink)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: RESET PASSWORD */}
            {tab === 'RESET_PASSWORD' && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab('LOGIN');
                  }}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o login</span>
                </button>

                <div className="mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-3">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Criar Nova Senha
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tokenUserInfo ? (
                      <>
                        Redefinindo senha para <strong>{tokenUserInfo.userName}</strong> ({tokenUserInfo.email}).
                      </>
                    ) : (
                      'Digite a nova senha que você deseja utilizar para acessar sua conta.'
                    )}
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Nova Senha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || tokenValidating}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>{loading ? 'Salvando Nova Senha...' : 'Salvar Nova Senha e Concluir'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB: LOGIN or REGISTER */}
            {(tab === 'LOGIN' || tab === 'REGISTER') && (
              <>
                {/* 1. Primary Google Login Button (First & Seamless) */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Acesso Rápido com Google
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sincronização com Firebase
                    </span>
                  </div>

                  {/* Role Selector before Google Sign In */}
                  <div className="grid grid-cols-2 gap-2 mb-3 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('PATIENT')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'PATIENT'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sou Paciente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('PROFESSIONAL')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'PROFESSIONAL'
                          ? 'bg-blue-700 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Sou Médico / Profissional</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-black transition flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    {googleLoading ? (
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                        ? 'Conectando conta Google...'
                        : `Entrar com o Google (${selectedRole === 'PATIENT' ? 'Paciente' : 'Profissional'})`}
                    </span>
                  </button>
                </div>

                <div className="relative my-5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-400">
                    ou acesse com seu e-mail e senha
                  </span>
                </div>

                {/* Tab Switcher: Entrar vs Cadastrar-se */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-5 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setTab('LOGIN');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      tab === 'LOGIN'
                        ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Entrar no Sistema</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setTab('REGISTER');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      tab === 'REGISTER'
                        ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Criar Nova Conta</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Nome (se cadastro ou login com novo nome) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tab === 'REGISTER' ? 'Nome Completo *' : 'Seu Nome (Opcional no login)'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required={tab === 'REGISTER'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Davi Silva ou Dra. Patrícia Lima"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Additional fields for Register */}
                  {tab === 'REGISTER' && selectedRole === 'PATIENT' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Idade
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={age}
                          onChange={(e) => setAge(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Cartão SUS / CPF
                        </label>
                        <input
                          type="text"
                          value={susCard}
                          onChange={(e) => setSusCard(e.target.value)}
                          placeholder="Número CNS ou CPF"
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  {tab === 'REGISTER' && selectedRole === 'PROFESSIONAL' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Registro Profissional (CRM / COREN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={crm}
                        onChange={(e) => setCrm(e.target.value)}
                        placeholder="Ex: CRM 12345/SP"
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  {/* Senha */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Senha *
                      </label>
                      {tab === 'LOGIN' && (
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setForgotEmail(email);
                            setTab('FORGOT_PASSWORD');
                          }}
                          className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline cursor-pointer"
                        >
                          Esqueci minha senha
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>
                      {loading
                        ? 'Validando...'
                        : tab === 'REGISTER'
                        ? 'Criar Conta e Acessar'
                        : 'Entrar no Sistema'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
            Atenção Primária à Saúde · SUS · Rota da Saúde 2025
          </div>
        </div>
      </div>
    </div>
  );
};
