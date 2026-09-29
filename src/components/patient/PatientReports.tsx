import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Printer,
  Check,
  CheckCircle2,
  Calendar,
  Eye,
  AlertCircle,
  Clock,
  Heart,
  Droplet,
  Pill,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { generateMedicalReportPDF, MedicalReportData } from '../../utils/pdfGenerator';

interface PatientReportsProps {
  onBack?: () => void;
}

export const PatientReports: React.FC<PatientReportsProps> = ({ onBack }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [includeBP, setIncludeBP] = useState(true);
  const [includeGlucose, setIncludeGlucose] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shared, setShared] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportData, setReportData] = useState<MedicalReportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const getPeriodDates = () => {
    const today = new Date();
    const endStr = today.toLocaleDateString('pt-BR');
    let start = new Date();

    if (selectedPeriod === '7d') {
      start.setDate(today.getDate() - 7);
    } else if (selectedPeriod === '30d') {
      start.setDate(today.getDate() - 30);
    } else if (selectedPeriod === '90d') {
      start.setDate(today.getDate() - 90);
    } else {
      start = new Date('2025-01-01');
    }

    return {
      startDate: start.toLocaleDateString('pt-BR'),
      endDate: endStr,
    };
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const data = await api.getReport();
      const period = getPeriodDates();
      setReportData({
        ...data,
        period,
      });
    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      let data = reportData;
      if (!data) {
        data = await api.getReport();
        data = { ...data, period: getPeriodDates() };
        setReportData(data);
      }

      if (!data) throw new Error('Dados indisponíveis para geração.');

      const doc = generateMedicalReportPDF(data, {
        includeBP,
        includeGlucose,
        includeMeds,
        includeAppointments,
        includeNotes,
      });

      const patientNameClean = (data.patient?.name || 'paciente')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const fileName = `relatorio_medico_${patientNameClean}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(`Falha ao gerar PDF: ${err.message || 'Tente novamente.'}`);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = reportData || (await api.getReport());
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Data/Hora,Tipo,Sistolica/Valor,Diastolica/Momento,Pulso,Unidade,Status,Observacao\r\n';

      if (includeBP && data.bloodPressureRecords) {
        data.bloodPressureRecords.forEach((r: any) => {
          csvContent += `"${new Date(r.recordedAt).toLocaleString('pt-BR')}",Pressao Arterial,${r.systolic},${r.diastolic},${r.pulse || ''},mmHg,"${r.statusText || 'Normal'}","${r.notes || ''}"\r\n`;
        });
      }

      if (includeGlucose && data.glucoseRecords) {
        data.glucoseRecords.forEach((g: any) => {
          csvContent += `"${new Date(g.recordedAt).toLocaleString('pt-BR')}",Glicemia,${g.glucoseValue},"${g.moment}",,mg/dL,"${g.statusText || 'Normal'}","${g.notes || ''}"\r\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `relatorio_saude_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      setErrorMsg('Erro ao exportar CSV. Tente novamente.');
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleShare = () => {
    const text = 'Relatório de Saúde - Rota da Saúde pronto para consulta médica.';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} Acesse: ${window.location.href}`);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const currentPeriodText = getPeriodDates();

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Relatórios de Saúde</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Pronto para consultas e equipe médica</p>
          </div>
        </div>

        <button
          onClick={() => setPreviewOpen(true)}
          className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-3 py-1.5 rounded-lg border border-teal-200/80 dark:border-teal-800 transition flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver Prévia</span>
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Success toast banner */}
        {downloadSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold block">PDF Baixado com Sucesso!</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                O arquivo oficial está pronto para ser impresso ou compartilhado com o seu médico.
              </span>
            </div>
          </div>
        )}

        {/* Clinical purpose banner */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-2xl p-4 text-white shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                Padrão Clínico SUS & Atenção Primária
              </span>
              <h2 className="text-sm font-bold text-white mt-0.5">
                Resumo de Hipertensão e Diabetes
              </h2>
              <p className="text-xs text-teal-100/90 mt-1 leading-relaxed">
                Reúne suas aferições de pressão, glicemia, medicamentos prescritos e consultas em um único documento padronizado.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Período de Monitoramento</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {currentPeriodText.startDate} a {currentPeriodText.endDate}
              </span>
            </div>

            {/* Timeframe pill selector */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { id: '7d', label: '7 dias' },
                { id: '30d', label: '30 dias' },
                { id: '90d', label: '90 dias' },
                { id: 'all', label: 'Tudo' },
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id as any)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    selectedPeriod === period.id
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Included Sections */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-white block">
              Seções incluídas no documento:
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="checkbox"
                  checked={includeBP}
                  onChange={(e) => setIncludeBP(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-500"
                />
                <Heart className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="font-medium">Pressão Arterial (Sistólica, Diastólica e Pulso)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="checkbox"
                  checked={includeGlucose}
                  onChange={(e) => setIncludeGlucose(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-500"
                />
                <Droplet className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">Glicemia Capilar (Jejum, Pós-prandial)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="checkbox"
                  checked={includeMeds}
                  onChange={(e) => setIncludeMeds(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-500"
                />
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Medicamentos em uso & Esquema posológico</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="checkbox"
                  checked={includeAppointments}
                  onChange={(e) => setIncludeAppointments(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-500"
                />
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Consultas agendadas e retornos clínicos</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-700 border-slate-300 focus:ring-teal-500"
                />
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">Observações do paciente e sintomas anotados</span>
              </label>
            </div>
          </div>

          {/* Quick Metrics preview card */}
          {reportData && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Registros encontrados:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {(reportData.bloodPressureRecords?.length || 0)} de Pressão • {(reportData.glucoseRecords?.length || 0)} de Glicemia
                </span>
              </div>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF || loading}
              className="w-full py-3.5 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {downloadingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF Clínico...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-teal-200" />
                  <span>Gerar e Baixar PDF para Consulta</span>
                </>
              )}
            </button>

            {/* Preview and CSV secondary buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>Pré-visualizar</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Share with professional */}
          <div
            onClick={handleShare}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 transition">
              {shared ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                {shared ? 'Link copiado para a área de transferência!' : 'Compartilhar com equipe médica'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Envie dados de aferição com seu médico de família ou endocrinologista.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Pré-visualização do Relatório Médico */}
      {previewOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-5 py-4 bg-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-sm font-bold">Pré-visualização do Relatório</h3>
                  <p className="text-[10px] text-teal-200">Pronto para impressão ou download em PDF</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document body preview */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                      ROTA DA SAÚDE
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Relatório Clínico Ambulatorial (HAS / DM)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Paciente</span>
                    <span className="font-bold text-slate-800 dark:text-white">{reportData.patient?.name || 'Maria Silva'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Idade / Sexo</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {reportData.patient?.age || 58} anos • {reportData.patient?.gender || 'Feminino'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condições</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {(reportData.patient?.conditions || ['HAS', 'DM']).join(' + ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Unidade</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {reportData.patient?.healthcareUnit || 'Clínica da Família'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meds snippet */}
              {includeMeds && reportData.medications && reportData.medications.length > 0 && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                  <span className="font-bold text-slate-800 dark:text-white text-[11px] block text-teal-800 dark:text-teal-400">
                    Medicamentos em Uso ({reportData.medications.length})
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reportData.medications.map((m: any, idx: number) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{m.name} {m.dosage}</span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                            {m.frequency} ({m.reminderTimes?.join(', ') || '08:00'})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          {m.status || 'Ativo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BP snippet */}
              {includeBP && reportData.bloodPressureRecords && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                  <span className="font-bold text-slate-800 dark:text-white text-[11px] block text-teal-800 dark:text-teal-400">
                    Últimas Aferições de Pressão
                  </span>
                  <div className="space-y-1.5">
                    {reportData.bloodPressureRecords.slice(0, 3).map((r: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{r.systolic}/{r.diastolic} mmHg</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">{r.pulse} bpm</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(r.recordedAt).toLocaleDateString('pt-BR')} {new Date(r.recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Glucose snippet */}
              {includeGlucose && reportData.glucoseRecords && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                  <span className="font-bold text-slate-800 dark:text-white text-[11px] block text-teal-800 dark:text-teal-400">
                    Últimas Aferições de Glicemia
                  </span>
                  <div className="space-y-1.5">
                    {reportData.glucoseRecords.slice(0, 3).map((g: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{g.glucoseValue} mg/dL</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1.5">({g.moment})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(g.recordedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  setPreviewOpen(false);
                  handleDownloadPDF();
                }}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Documento PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
