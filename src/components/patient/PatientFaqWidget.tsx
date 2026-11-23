import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  X,
  Search,
  ChevronDown,
  ArrowRight,
  Activity,
  Heart,
  Pill,
  Calendar,
  FileText,
  ShieldCheck,
  PhoneCall,
  PlusCircle,
  Users,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export type PatientFaqTabTarget =
  | 'dashboard'
  | 'measurements'
  | 'medications'
  | 'appointments'
  | 'reports'
  | 'education';

type FaqCategory = 'all' | 'measurements' | 'medications' | 'appointments' | 'emergency';
type FaqPanelView = 'faq' | 'contact';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  categoryLabel: string;
  question: string;
  answer: string;
  steps: string[];
  targetTab: PatientFaqTabTarget;
  targetTabLabel: string;
  quickActionLabel?: string;
  quickActionType?: 'pressure' | 'glucose' | 'medication' | 'appointment' | 'pdf' | 'emergency' | 'symptoms';
}

interface PatientFaqWidgetProps {
  activeTab: PatientFaqTabTarget;
  onNavigateTab: (tab: PatientFaqTabTarget) => void;
  onOpenPressureModal: () => void;
  onOpenGlucoseModal: () => void;
  onOpenAddMedication: () => void;
  onOpenScheduleAppointment?: () => void;
  onDownloadPDF: () => void;
  onOpenEmergencyModal?: () => void;
  onOpenSymptomModal?: () => void;
}

const SUPPORT_EMAIL = 'suporte@rotadasaude.gov.br';

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-overview',
    category: 'measurements',
    categoryLabel: 'Primeiros passos',
    question: 'Como funciona o sistema e por onde começar?',
    answer:
      'O Rota da Saúde organiza suas medições de pressão arterial e glicemia, seus remédios prescritos e suas consultas da UBS em um só lugar para você e seu médico acompanharem sua evolução.',
    steps: [
      'Na aba Visão Geral, confira seus últimos valores de pressão, glicemia e próximas consultas.',
      'Use os botões rápidos no topo (+ Pressão, + Glicemia, + Medicamento) para registrar seu dia a dia.',
      'Navegue pelas abas acima do painel para ver gráficos detalhados, receitas e relatórios em PDF.',
    ],
    targetTab: 'dashboard',
    targetTabLabel: 'Ir para Visão Geral',
  },
  {
    id: 'faq-pressure-glucose',
    category: 'measurements',
    categoryLabel: 'Medições',
    question: 'Como registrar minha pressão arterial ou glicemia?',
    answer:
      'Sempre que aferir a pressão ou medir a glicose em casa ou na UBS, registre no sistema para manter seu prontuário atualizado. Valores críticos geram alertas automáticos para cuidado.',
    steps: [
      'Clique em "+ Pressão" (informe sistólica, diastólica e pulso) ou "+ Glicemia" (informe o valor em mg/dL e o momento, como Em Jejum ou Após Refeição).',
      'Adicione observações se sentiu algum sintoma no momento.',
      'Acompanhe todos os lançamentos e médias na aba Histórico & Gráficos.',
    ],
    targetTab: 'measurements',
    targetTabLabel: 'Acessar Histórico & Gráficos',
    quickActionLabel: 'Registrar Pressão agora',
    quickActionType: 'pressure',
  },
  {
    id: 'faq-charts-filters',
    category: 'measurements',
    categoryLabel: 'Gráficos',
    question: 'Como ver meus gráficos e identificar medições alteradas?',
    answer:
      'Na aba Histórico & Gráficos você visualiza a evolução da sua pressão e glicemia ao longo de 7 ou 30 dias e pode filtrar apenas as medições que deram alteração.',
    steps: [
      'Abra a aba Histórico & Gráficos.',
      'Escolha entre Pressão Arterial ou Glicemia para alternar o gráfico.',
      'Na tabela abaixo do gráfico, use o filtro "Alteradas" para destacar rapidamente leituras fora da meta.',
    ],
    targetTab: 'measurements',
    targetTabLabel: 'Ver Histórico & Gráficos',
    quickActionLabel: 'Registrar Glicemia agora',
    quickActionType: 'glucose',
  },
  {
    id: 'faq-medications-origin',
    category: 'medications',
    categoryLabel: 'Medicamentos',
    question: 'Qual a diferença entre "Prescrito pelo Médico" e "Adicionado pelo Paciente"?',
    answer:
      'Medicamentos com o selo "Prescrito pelo Médico" foram lançados diretamente pelo profissional de saúde e ficam bloqueados para edição por segurança clínica. Já os que você mesmo cadastra podem ser editados ou excluídos livremente.',
    steps: [
      'Acesse a aba Medicamentos para visualizar todas as suas medicações ativas.',
      'Confira o nome do médico responsável na parte inferior do cartão das receitas oficiais.',
      'Nos medicamentos cadastrados por você, use os botões "Editar" ou o ícone de lixeira para ajustar horários e doses.',
    ],
    targetTab: 'medications',
    targetTabLabel: 'Ir para Medicamentos',
  },
  {
    id: 'faq-medications-add',
    category: 'medications',
    categoryLabel: 'Lembretes',
    question: 'Como cadastrar um medicamento e testar o alarme de horário?',
    answer:
      'Você pode registrar medicamentos de uso contínuo que você toma por conta ou atualizar seus horários de lembrete para receber notificações no navegador.',
    steps: [
      'Clique em "+ Medicamento", digite o nome, dosagem (ex: 50mg) e os horários do dia.',
      'Na aba Medicamentos, clique em "Testar Alarme Push" para confirmar que os avisos estão ativos no seu aparelho.',
      'Lembre-se: remédios para hipertensão e diabetes têm retirada gratuita pelo Programa Farmácia Popular do SUS.',
    ],
    targetTab: 'medications',
    targetTabLabel: 'Abrir aba Medicamentos',
    quickActionLabel: 'Adicionar Medicamento',
    quickActionType: 'medication',
  },
  {
    id: 'faq-appointments',
    category: 'appointments',
    categoryLabel: 'Consultas',
    question: 'Como agendar e acompanhar minhas consultas na UBS?',
    answer:
      'Na aba Consultas & UBS ficam listados seus retornos do programa Hiperdia, os horários de atendimento da unidade e o botão para solicitar um novo agendamento.',
    steps: [
      'Acesse a aba Consultas & UBS para conferir datas, horários e orientações da consulta.',
      'Clique em "+ Consulta" para solicitar ou registrar um novo atendimento na sua UBS.',
      'Use o botão "Levar Relatório" ao lado da consulta para baixar o resumo das suas medições.',
    ],
    targetTab: 'appointments',
    targetTabLabel: 'Ir para Consultas & UBS',
    quickActionLabel: 'Agendar Consulta',
    quickActionType: 'appointment',
  },
  {
    id: 'faq-reports-pdf',
    category: 'appointments',
    categoryLabel: 'Relatórios',
    question: 'Como gerar o Relatório Médico em PDF para levar ao médico?',
    answer:
      'O sistema gera automaticamente um documento em PDF com sua pressão média, percentual de leituras na meta, histórico glicêmico e lista de medicamentos ativos.',
    steps: [
      'Acesse a aba Relatórios & Documentos ou clique no botão "Baixar PDF" no topo da tela.',
      'Confira também a lista de verificação (checklist) do que levar no dia da consulta: PDF salvo/impresso, documento com foto, Cartão SUS e receitas atuais.',
    ],
    targetTab: 'reports',
    targetTabLabel: 'Ir para Relatórios & Documentos',
    quickActionLabel: 'Baixar Relatório PDF',
    quickActionType: 'pdf',
  },
  {
    id: 'faq-emergency',
    category: 'emergency',
    categoryLabel: 'Emergência',
    question: 'O que fazer se minha pressão estiver muito alta ou sentir sintomas graves?',
    answer:
      'Se a pressão passar de 180/120 mmHg ou você apresentar dor no peito, falta de ar, tontura intensa, dor de cabeça súbita forte ou visão turva, busque atendimento de urgência imediatamente.',
    steps: [
      'Não dirija sozinho nem espere melhorar em casa diante de sinais de alerta.',
      'Acesse o botão vermelho "SOS 192" no topo ou vá até a aba Guia de Saúde & Emergência.',
      'Caso esteja com sintomas moderados para relatar ao médico, utilize "+ Sintomas".',
    ],
    targetTab: 'education',
    targetTabLabel: 'Ir para Guia de Saúde & Emergência',
    quickActionLabel: 'Abrir Protocolo SOS 192',
    quickActionType: 'emergency',
  },
  {
    id: 'faq-multi-patient',
    category: 'appointments',
    categoryLabel: 'Conta e Perfis',
    question: 'Posso usar o mesmo login para cuidar de mais de um paciente da família?',
    answer:
      'Sim. Se você acompanha familiares no mesmo e-mail, cada paciente possui um prontuário individualizado identificado por nome e código exclusivo.',
    steps: [
      'No menu superior da tela (ou em "Meus Dados"), selecione o perfil do paciente desejado antes de lançar medições.',
      'Cada paciente terá seus próprios gráficos, receitas médicas e relatórios separados.',
    ],
    targetTab: 'dashboard',
    targetTabLabel: 'Voltar para Visão Geral',
  },
];

const CATEGORY_FILTERS: { id: FaqCategory; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'measurements', label: 'Medições' },
  { id: 'medications', label: 'Remédios' },
  { id: 'appointments', label: 'Consultas & PDF' },
  { id: 'emergency', label: 'Emergência' },
];

const TAB_ICONS: Record<PatientFaqTabTarget, React.ReactNode> = {
  dashboard: <Activity className="w-3.5 h-3.5" />,
  measurements: <Heart className="w-3.5 h-3.5" />,
  medications: <Pill className="w-3.5 h-3.5" />,
  appointments: <Calendar className="w-3.5 h-3.5" />,
  reports: <FileText className="w-3.5 h-3.5" />,
  education: <ShieldCheck className="w-3.5 h-3.5" />,
};

function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const PatientFaqWidget: React.FC<PatientFaqWidgetProps> = ({
  activeTab,
  onNavigateTab,
  onOpenPressureModal,
  onOpenGlucoseModal,
  onOpenAddMedication,
  onOpenScheduleAppointment,
  onDownloadPDF,
  onOpenEmergencyModal,
  onOpenSymptomModal,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [panelView, setPanelView] = useState<FaqPanelView>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string>('faq-overview');

  // Contact by email form states
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<{
    protocol: string;
    phone: string;
    email: string;
    message: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (user?.profile?.phone && !contactPhone) {
      setContactPhone(formatPhoneBR(user.profile.phone));
    }
    if (user?.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user?.email, user?.profile?.phone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.steps.some((s) => s.toLowerCase().includes(q)) ||
        item.targetTabLabel.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleGoToTab = (tab: PatientFaqTabTarget) => {
    onNavigateTab(tab);
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuickAction = (type?: FaqItem['quickActionType'], fallbackTab?: PatientFaqTabTarget) => {
    if (!type) return;
    setIsOpen(false);
    if (fallbackTab) {
      onNavigateTab(fallbackTab);
    }
    switch (type) {
      case 'pressure':
        onOpenPressureModal();
        break;
      case 'glucose':
        onOpenGlucoseModal();
        break;
      case 'medication':
        onOpenAddMedication();
        break;
      case 'appointment':
        if (onOpenScheduleAppointment) onOpenScheduleAppointment();
        break;
      case 'pdf':
        onDownloadPDF();
        break;
      case 'emergency':
        if (onOpenEmergencyModal) onOpenEmergencyModal();
        break;
      case 'symptoms':
        if (onOpenSymptomModal) onOpenSymptomModal();
        break;
    }
  };

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    const digits = contactPhone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      setContactError('Informe um número de telefone válido com DDD (ex: (11) 99999-9999).');
      return;
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setContactError('Informe um e-mail válido para receber a resposta.');
      return;
    }

    if (contactMessage.trim().length < 5) {
      setContactError('Escreva sua dúvida ou mensagem para a equipe de atendimento.');
      return;
    }

    setContactSending(true);
    try {
      const res = await api.sendSupportContact({
        phone: contactPhone,
        email: contactEmail.trim(),
        subject: `Contato de Paciente (${user?.name || 'Rota da Saúde'})`,
        message: contactMessage.trim(),
        patientName: user?.name,
      });

      setContactSuccess({
        protocol: res.protocol,
        phone: res.phone,
        email: res.email,
        message: res.message,
      });
      setContactMessage('');
    } catch (err: any) {
      setContactError(err.message || 'Não foi possível enviar sua solicitação.');
    } finally {
      setContactSending(false);
    }
  };

  const buildMailtoHref = (phoneVal: string, emailVal: string, msgVal: string) => {
    const subject = encodeURIComponent(`[Rota da Saúde] Dúvida do Paciente - ${user?.name || 'Paciente SUS'}`);
    const body = encodeURIComponent(
      `Paciente: ${user?.name || 'Paciente SUS'}\n` +
        `Telefone / WhatsApp para contato: ${phoneVal}\n` +
        `E-mail do paciente: ${emailVal}\n\n` +
        `Mensagem:\n${msgVal}`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {/* Drawer / Painel de Dúvidas Frequentes */}
      {isOpen && (
        <section
          id="patient-faq-panel"
          aria-label="Central de Ajuda e Perguntas Frequentes"
          className="mb-3 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[min(82vh,640px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
                {panelView === 'faq' ? <HelpCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {panelView === 'faq' ? 'Dúvidas Frequentes (FAQ)' : 'Contato por E-mail'}
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  {panelView === 'faq'
                    ? 'Aprenda a usar e vá direto para a aba desejada'
                    : 'Deixe seu número de telefone e envie sua dúvida'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar guia de ajuda"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Mode Switch inside Drawer: FAQ vs Contact */}
          <div className="px-3.5 pt-3 pb-2 bg-slate-50/70 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPanelView('faq')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  panelView === 'faq'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Perguntas (FAQ)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanelView('contact');
                  setContactError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  panelView === 'contact'
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>Contato por E-mail</span>
              </button>
            </div>
          </div>

          {panelView === 'faq' ? (
            <>
              {/* Search & Category Filter Toolbar */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar dúvida (ex: pressão, remédio, PDF...)"
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Interactive Filter Controls */}
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto">
                  {CATEGORY_FILTERS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <div className="p-6 text-center space-y-2.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nenhuma dúvida encontrada para "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tente termos como "pressão", "glicemia", "medicamento" ou envie sua dúvida por e-mail.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Mostrar todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPanelView('contact')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        Enviar por E-mail
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const isCurrentTab = activeTab === item.targetTab;

                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                          className="w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium text-teal-700 dark:text-teal-400 mb-0.5 flex items-center gap-1.5">
                              <span>{item.categoryLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {item.targetTabLabel.replace(/^(Ir para |Acessar |Abrir aba |Ver |Voltar para )/, '')}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug block">
                              {item.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-150 ${
                              isExpanded ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0.5 space-y-3 bg-slate-50/60 dark:bg-slate-800/30">
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {item.answer}
                            </p>

                            <ol className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 list-decimal list-inside">
                              {item.steps.map((step, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {step}
                                </li>
                              ))}
                            </ol>

                            {/* Direct Deep-Link Action Buttons to the Target Tab / Modal */}
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleGoToTab(item.targetTab)}
                                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                              >
                                {TAB_ICONS[item.targetTab]}
                                <span>
                                  {isCurrentTab
                                    ? 'Você já está nesta aba'
                                    : item.targetTabLabel}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              {item.quickActionLabel && item.quickActionType && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickAction(item.quickActionType, item.targetTab)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                                    item.quickActionType === 'emergency'
                                      ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {item.quickActionType === 'emergency' ? (
                                    <PhoneCall className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  ) : (
                                    <PlusCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  )}
                                  <span>{item.quickActionLabel}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Contact by Email Form View inside FAQ Drawer */
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Support Destination Email Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    E-mail de atendimento
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {SUPPORT_EMAIL}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopySupportEmail}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer transition"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {contactSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Solicitação registrada com sucesso!
                      </h4>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                        Protocolo <span className="font-mono font-bold">{contactSuccess.protocol}</span>. Nossa equipe entrará em contato pelo telefone{' '}
                        <span className="font-bold tabular-nums">{contactSuccess.phone}</span> ou pelo e-mail{' '}
                        <span className="font-bold">{contactSuccess.email}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={buildMailtoHref(contactSuccess.phone, contactSuccess.email, contactSuccess.message)}
                      className="px-3 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no app de e-mail</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setContactSuccess(null)}
                      className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Nova mensagem
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {contactError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium">
                      {contactError}
                    </div>
                  )}

                  {/* Campo de Número de Telefone / WhatsApp */}
                  <div>
                    <label
                      htmlFor="faq-contact-phone"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Número para contato (Telefone / WhatsApp) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        id="faq-contact-phone"
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(formatPhoneBR(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Seu número será incluído no e-mail para agilizar o retorno da equipe.
                    </p>
                  </div>

                  {/* E-mail do Paciente */}
                  <div>
                    <label
                      htmlFor="faq-contact-email"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Seu e-mail para resposta *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        id="faq-contact-email"
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition"
                      />
                    </div>
                  </div>

                  {/* Mensagem */}
                  <div>
                    <label
                      htmlFor="faq-contact-message"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Como podemos ajudar? *
                    </label>
                    <textarea
                      id="faq-contact-message"
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Descreva sua dúvida sobre medições, receitas, consultas ou uso do sistema..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={contactSending}
                      className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      {contactSending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{contactSending ? 'Enviando...' : 'Enviar contato por e-mail'}</span>
                    </button>

                    <a
                      href={buildMailtoHref(
                        contactPhone || '(Não informado)',
                        contactEmail || user?.email || '',
                        contactMessage || 'Olá, preciso de ajuda com o sistema Rota da Saúde.'
                      )}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ou abrir diretamente no aplicativo de e-mail</span>
                    </a>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Shortcuts Footer */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="truncate">Guia do Paciente · Rota da Saúde</span>
            </span>
            {panelView === 'faq' ? (
              <button
                type="button"
                onClick={() => setPanelView('contact')}
                className="font-bold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Falar por E-mail
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleGoToTab('education')}
                className="font-bold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Emergência 192
              </button>
            )}
          </div>
        </section>
      )}

      {/* Floating Bottom-Right Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="patient-faq-panel"
        aria-label={isOpen ? 'Fechar dúvidas frequentes' : 'Abrir dúvidas frequentes e guia de uso'}
        className={`h-11 sm:h-12 px-4 rounded-full shadow-lg border transition duration-150 flex items-center gap-2 font-bold text-xs cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
          isOpen
            ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 dark:bg-slate-800 dark:border-slate-600'
            : 'bg-teal-700 hover:bg-teal-600 text-white border-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500'
        }`}
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Fechar Ajuda</span>
          </>
        ) : (
          <>
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Dúvidas / FAQ</span>
          </>
        )}
      </button>
    </div>
  );
};
