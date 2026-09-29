import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Activity, Droplets } from 'lucide-react';
import { api } from '../../services/api';
import { BloodPressureRecord, GlucoseRecord } from '../../types';

interface PatientHistoryProps {
  onBack?: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ onBack }) => {
  const [metricTab, setMetricTab] = useState<'pressure' | 'glucose'>('pressure');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('7d');
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory(undefined, timeframe);
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [timeframe]);

  const bpRecords: BloodPressureRecord[] = historyData?.pressureRecords || [];
  const glucoseRecords: GlucoseRecord[] = historyData?.glucoseRecords || [];

  // SVG Chart Calculation
  const chartPoints = [
    { date: '01/05', sys: 120, dia: 78, gluc: 95 },
    { date: '02/05', sys: 121, dia: 80, gluc: 104 },
    { date: '03/05', sys: 119, dia: 79, gluc: 98 },
    { date: '04/05', sys: 125, dia: 83, gluc: 110 },
    { date: '05/05', sys: 122, dia: 82, gluc: 102 },
    { date: '06/05', sys: 118, dia: 78, gluc: 128 },
    { date: '07/05', sys: 120, dia: 80, gluc: 98 },
  ];

  const chartHeight = 120;
  const chartWidth = 280;
  const maxVal = metricTab === 'pressure' ? 180 : 200;
  const minVal = metricTab === 'pressure' ? 40 : 50;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return chartHeight - ((clamped - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const getX = (index: number) => {
    return (index / (chartPoints.length - 1)) * (chartWidth - 20) + 10;
  };

  const sysPath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.sys)}`)
    .join(' ');

  const diaPath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.dia)}`)
    .join(' ');

  const glucPath = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.gluc)}`)
    .join(' ');

  return (
    <div className="flex flex-col min-h-full bg-slate-50/70 dark:bg-slate-950 pb-12 transition-colors">
      {/* Top Header */}
      <div className="px-5 py-4 flex items-center gap-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-bold text-slate-800 dark:text-white">Histórico Clínico</h1>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Metric Selector Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMetricTab('pressure')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              metricTab === 'pressure'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pressão Arterial
          </button>
          <button
            onClick={() => setMetricTab('glucose')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              metricTab === 'glucose'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Glicemia
          </button>
        </div>

        {/* Timeframe Chips */}
        <div className="flex justify-between gap-1.5">
          {(['7d', '30d', '90d', '1y'] as const).map((tf) => {
            const labels = {
              '7d': '7 dias',
              '30d': '30 dias',
              '90d': '90 dias',
              '1y': '1 ano',
            };
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border text-center transition ${
                  timeframe === tf
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {labels[tf]}
              </button>
            );
          })}
        </div>

        {/* Chart Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {metricTab === 'pressure' ? 'Pressão arterial (mmHg)' : 'Glicemia (mg/dL)'}
            </span>
            {metricTab === 'pressure' ? (
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> Sistólica
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Diastólica
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span> Glicose
              </span>
            )}
          </div>

          {/* SVG Line Chart */}
          <div className="relative flex items-center">
            {/* Y Axis labels */}
            <div className="flex flex-col justify-between h-[120px] text-[10px] text-slate-400 dark:text-slate-500 font-mono pr-2 select-none">
              <span>{metricTab === 'pressure' ? '160' : '180'}</span>
              <span>{metricTab === 'pressure' ? '120' : '120'}</span>
              <span>{metricTab === 'pressure' ? '80' : '80'}</span>
              <span>{metricTab === 'pressure' ? '40' : '40'}</span>
            </div>

            {/* SVG area */}
            <div className="flex-1 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[120px] overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1={getY(160)} x2={chartWidth} y2={getY(160)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1={getY(120)} x2={chartWidth} y2={getY(120)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1={getY(80)} x2={chartWidth} y2={getY(80)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1={getY(40)} x2={chartWidth} y2={getY(40)} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />

                {metricTab === 'pressure' ? (
                  <>
                    <path d={sysPath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                    {chartPoints.map((p, i) => (
                      <circle key={'sys' + i} cx={getX(i)} cy={getY(p.sys)} r="3.5" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
                    ))}
                    <path d={diaPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    {chartPoints.map((p, i) => (
                      <circle key={'dia' + i} cx={getX(i)} cy={getY(p.dia)} r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                    ))}
                  </>
                ) : (
                  <>
                    <path d={glucPath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
                    {chartPoints.map((p, i) => (
                      <circle key={'glu' + i} cx={getX(i)} cy={getY(p.gluc)} r="3.5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />
                    ))}
                  </>
                )}
              </svg>

              {/* X Axis dates */}
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 px-1">
                {chartPoints.map((p) => (
                  <span key={p.date}>{p.date}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Medições Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Últimas medições</div>

          {metricTab === 'pressure' ? (
            <div className="space-y-2">
              {bpRecords.slice(0, 3).map((r) => {
                const dateObj = new Date(r.recordedAt);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const time = dateObj.toTimeString().slice(0, 5);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-none text-xs"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {day}/{month} {time}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {r.systolic} / {r.diastolic} mmHg
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {glucoseRecords.slice(0, 3).map((r) => {
                const dateObj = new Date(r.recordedAt);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const time = dateObj.toTimeString().slice(0, 5);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-none text-xs"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {day}/{month} {time}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {r.glucoseValue} mg/dL
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-1 text-center">
            <button
              onClick={() => setShowAllModal(true)}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 transition"
            >
              Ver todas as medições
            </button>
          </div>
        </div>
      </div>

      {/* Modal for "Ver todas as medições" */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Histórico Completo ({metricTab === 'pressure' ? 'Pressão' : 'Glicemia'})
              </h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto py-3 space-y-2 flex-1">
              {metricTab === 'pressure'
                ? bpRecords.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                        <span>{r.systolic} / {r.diastolic} mmHg</span>
                        <span className="text-[11px] text-teal-700 dark:text-teal-400">{r.pulse} bpm</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(r.recordedAt).toLocaleString('pt-BR')}
                      </div>
                      {r.notes && <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">{r.notes}</div>}
                    </div>
                  ))
                : glucoseRecords.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                        <span>{r.glucoseValue} mg/dL</span>
                        <span className="text-[11px] text-cyan-700 dark:text-cyan-400">{r.moment.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(r.recordedAt).toLocaleString('pt-BR')}
                      </div>
                      {r.notes && <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">{r.notes}</div>}
                    </div>
                  ))}
            </div>
            <button
              onClick={() => setShowAllModal(false)}
              className="w-full mt-2 py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl hover:bg-teal-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
