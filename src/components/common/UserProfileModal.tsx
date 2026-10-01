import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Heart,
  Stethoscope,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  FileBadge,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialOnboarding?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  isInitialOnboarding = false,
}) => {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'PROFESSIONAL'>('PATIENT');
  const [age, setAge] = useState<number>(45);
  const [gender, setGender] = useState<string>('Não informado');
  const [susCard, setSusCard] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [healthcareUnit, setHealthcareUnit] = useState<string>('UBS Dr. Manoel de Abreu');
  const [conditions, setConditions] = useState<string[]>([
    'Hipertensão Arterial (HAS)',
    'Diabetes Mellitus Tipo 2',
  ]);
  const [crm, setCrm] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('Medicina de Família e Comunidade');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setRole(user.role === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT');
      if (user.profile) {
        if (user.role === 'PATIENT') {
          const p = user.profile;
          if (p.age) setAge(p.age);
          if (p.gender && p.gender !== 'Não especificado') setGender(p.gender);
          if (p.phone) setPhone(p.phone);
          if (p.healthcareUnit) setHealthcareUnit(p.healthcareUnit);
          if (p.conditions && p.conditions.length > 0) setConditions(p.conditions);
        } else {
          const prof = user.profile;
          if (prof.crm) setCrm(prof.crm);
          if (prof.specialty) setSpecialty(prof.specialty);
          if (prof.healthcareUnit) setHealthcareUnit(prof.healthcareUnit);
        }
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const toggleCondition = (cond: string) => {
    if (conditions.includes(cond)) {
      setConditions(conditions.filter((c) => c !== cond));
    } else {
      setConditions([...conditions, cond]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!name.trim()) {
        throw new Error('Por favor, informe seu nome completo.');
      }

      await updateUserProfile({
        name: name.trim(),
        age: role === 'PATIENT' ? Number(age) : undefined,
        gender: role === 'PATIENT' ? gender : undefined,
        conditions: role === 'PATIENT' ? conditions : undefined,
        healthcareUnit: healthcareUnit.trim(),
        phone: phone.trim(),
        crm: role === 'PROFESSIONAL' ? crm.trim() : undefined,
        specialty: role === 'PROFESSIONAL' ? specialty.trim() : undefined,
      });

      if (user?.id) {
        localStorage.setItem('profile_onboarding_completed_' + user.id, 'true');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar informações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-5 sm:p-6 text-white relative">
          {!isInitialOnboarding && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              {role === 'PROFESSIONAL' ? (
                <Stethoscope className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  {isInitialOnboarding ? 'Primeiro Acesso · Configuração' : 'Meus Dados Cadastrais'}
                </span>
                <span className="text-xs text-teal-200">SUS Digital</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {isInitialOnboarding ? 'Complete suas Informações' : 'Atualizar Dados Cadastrais'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-teal-100/90 mt-2 leading-relaxed">
            {isInitialOnboarding
              ? 'Seu acesso foi autenticado com sucesso! Confirme seus dados para que seu prontuário clínico e histórico sejam exibidos na aplicação.'
              : 'Mantenha suas informações clínicas e de contato atualizadas para a equipe de saúde da família.'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Informações salvas com sucesso! Redirecionando...</span>
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Davi Silva ou Dra. Ana Souza"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* E-mail (somente leitura para identificação segura) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail Autenticado
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Seleção de Perfil (Paciente vs Profissional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Perfil no Sistema:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('PATIENT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'PATIENT'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Paciente (Cidadão SUS)</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('PROFESSIONAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'PROFESSIONAL'
                    ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-200 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Profissional de Saúde</span>
              </button>
            </div>
          </div>

          {/* Campos específicos do Paciente */}
          {role === 'PATIENT' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Não informado">Prefiro não informar</option>
                  </select>
                </div>
              </div>

              {/* Cartão SUS / CNS e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cartão SUS (CNS) / CPF
                  </label>
                  <div className="relative">
                    <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={susCard}
                      onChange={(e) => setSusCard(e.target.value)}
                      placeholder="Ex: 748 9201 3481 0004"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Condições de Saúde a Monitorar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Condições de Saúde a Monitorar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Hipertensão Arterial (HAS)',
                    'Diabetes Mellitus Tipo 2',
                    'Diabetes Mellitus Tipo 1',
                    'Acompanhamento Preventivo',
                  ].map((cond) => {
                    const isChecked = conditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          isChecked
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span>{cond}</span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UBS de Referência */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade Básica de Saúde (UBS de Referência)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={healthcareUnit}
                    onChange={(e) => setHealthcareUnit(e.target.value)}
                    placeholder="Ex: UBS Dr. Manoel de Abreu ou Clínica da Família"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Campos específicos do Profissional */}
          {role === 'PROFESSIONAL' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Medicina de Família e Comunidade"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unidade de Atuação (UBS / Posto de Saúde)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={healthcareUnit}
                    onChange={(e) => setHealthcareUnit(e.target.value)}
                    placeholder="Ex: UBS Dr. Manoel de Abreu"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            {!isInitialOnboarding && (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {saving
                  ? 'Salvando no Prontuário...'
                  : isInitialOnboarding
                  ? 'Confirmar e Acessar Meu Prontuário'
                  : 'Salvar Alterações'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
