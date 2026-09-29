import { jsPDF } from 'jspdf';

export interface MedicalReportData {
  patient?: {
    name?: string;
    age?: number;
    gender?: string;
    conditions?: string[];
    riskLevel?: string;
    healthcareUnit?: string;
    adherenceRate?: number;
    phone?: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary?: {
    totalBloodPressureLogs?: number;
    totalGlucoseLogs?: number;
    adherenceRate?: number;
    activeMedicationsCount?: number;
    nextAppointmentDate?: string;
  };
  bloodPressureRecords?: Array<{
    systolic: number;
    diastolic: number;
    pulse: number;
    recordedAt: string;
    statusText: string;
    notes?: string;
    isCritical?: boolean;
  }>;
  glucoseRecords?: Array<{
    glucoseValue: number;
    moment: string;
    recordedAt: string;
    statusText: string;
    notes?: string;
    isCritical?: boolean;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    reminderTimes: string[];
    status?: string;
    notes?: string;
  }>;
  appointments?: Array<{
    scheduledFor: string;
    doctorName: string;
    clinicName: string;
    appointmentType: string;
    status?: string;
    notes?: string;
  }>;
}

export interface PDFExportOptions {
  includeBP: boolean;
  includeGlucose: boolean;
  includeMeds: boolean;
  includeAppointments: boolean;
  includeNotes: boolean;
}

export function generateMedicalReportPDF(
  data: MedicalReportData,
  options: PDFExportOptions = {
    includeBP: true,
    includeGlucose: true,
    includeMeds: true,
    includeAppointments: true,
    includeNotes: true,
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFillColor(15, 76, 70); // Teal primary
    doc.rect(14, 10, pageWidth - 28, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Rota da Saúde - Resumo Clínico do Paciente (Continuação)', 14, 8);
    y = 16;
  };

  // 1. TOP HEADER BANNER
  doc.setFillColor(15, 76, 70); // #0f4c46 Teal
  doc.rect(14, 12, pageWidth - 28, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ROTA DA SAÚDE • RELATÓRIO CLÍNICO AMBULATORIAL', 20, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 235, 230);
  doc.text('Programa de Monitoramento e Manejo de Hipertensão Arterial Sistêmica e Diabetes Mellitus', 20, 27);
  doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 20, 27, { align: 'right' });

  y = 40;

  // 2. PATIENT INFORMATION CARD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Paciente: ${data.patient?.name || 'Maria Silva'}`, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Idade: ${data.patient?.age || 58} anos   |   Sexo: ${data.patient?.gender || 'Feminino'}   |   Telefone: ${data.patient?.phone || '(11) 98765-4321'}`, 18, y + 13);
  doc.text(`Unidade Básica: ${data.patient?.healthcareUnit || 'Clínica da Família'}`, 18, y + 19);
  doc.text(`Período do Relatório: ${data.period.startDate} a ${data.period.endDate}`, 18, y + 25);

  // Risk & Conditions Badge on right
  const conditionsText = (data.patient?.conditions || ['HAS', 'DM']).join(' + ');
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 75, y + 5, 55, 20, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 76, 70);
  doc.text(`Condições: ${conditionsText}`, pageWidth - 47.5, y + 11, { align: 'center' });

  const risk = (data.patient?.riskLevel || 'ALTO').toUpperCase();
  if (risk === 'ALTO') {
    doc.setTextColor(190, 18, 60); // Red
  } else if (risk === 'MODERADO') {
    doc.setTextColor(180, 83, 9); // Amber
  } else {
    doc.setTextColor(4, 120, 87); // Green
  }
  doc.text(`Estratificação: Risco ${risk}`, pageWidth - 47.5, y + 17, { align: 'center' });
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Adesão Terapêutica: ${data.patient?.adherenceRate || 85}%`, pageWidth - 47.5, y + 22, { align: 'center' });

  y += 36;

  // 3. CLINICAL SUMMARY KPIS
  const bpList = data.bloodPressureRecords || [];
  const glucList = data.glucoseRecords || [];
  
  let avgSystolic = 0;
  let avgDiastolic = 0;
  let avgPulse = 0;
  if (bpList.length > 0) {
    avgSystolic = Math.round(bpList.reduce((acc, r) => acc + r.systolic, 0) / bpList.length);
    avgDiastolic = Math.round(bpList.reduce((acc, r) => acc + r.diastolic, 0) / bpList.length);
    avgPulse = Math.round(bpList.reduce((acc, r) => acc + r.pulse, 0) / bpList.length);
  }

  let avgGlucose = 0;
  if (glucList.length > 0) {
    avgGlucose = Math.round(glucList.reduce((acc, r) => acc + r.glucoseValue, 0) / glucList.length);
  }

  // Draw 3 Mini KPI Boxes
  const kpiWidth = (pageWidth - 28 - 6) / 3;
  
  // KPI 1: Pressão Média
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(204, 251, 241); // teal-200
  doc.roundedRect(14, y, kpiWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text('PRESSÃO ARTERIAL MÉDIA', 14 + kpiWidth / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(bpList.length > 0 ? `${avgSystolic}/${avgDiastolic} mmHg` : 'Sem registros', 14 + kpiWidth / 2, y + 11.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pulso médio: ${avgPulse || 72} bpm (${bpList.length} logs)`, 14 + kpiWidth / 2, y + 15.5, { align: 'center' });

  // KPI 2: Glicemia Média
  const kpi2X = 14 + kpiWidth + 3;
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(kpi2X, y, kpiWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(190, 18, 60);
  doc.text('GLICEMIA MÉDIA', kpi2X + kpiWidth / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(glucList.length > 0 ? `${avgGlucose} mg/dL` : 'Sem registros', kpi2X + kpiWidth / 2, y + 11.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total de ${glucList.length} aferições no período`, kpi2X + kpiWidth / 2, y + 15.5, { align: 'center' });

  // KPI 3: Adesão e Medicamentos
  const kpi3X = 14 + (kpiWidth * 2) + 6;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(kpi3X, y, kpiWidth, 18, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text('PRESCRIÇÃO & ADESÃO', kpi3X + kpiWidth / 2, y + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.summary?.activeMedicationsCount || 3} Remédios Ativos`, kpi3X + kpiWidth / 2, y + 11.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Taxa de Adesão: ${data.patient?.adherenceRate || 85}%`, kpi3X + kpiWidth / 2, y + 15.5, { align: 'center' });

  y += 24;

  // 4. MEDICAMENTOS EM USO
  if (options.includeMeds && data.medications && data.medications.length > 0) {
    checkPageBreak(30);

    doc.setFillColor(15, 76, 70);
    doc.rect(14, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 76, 70);
    doc.text('1. ESQUEMA TERAPÊUTICO / MEDICAMENTOS EM USO', 19, y + 5.5);
    y += 10;

    // Table Header
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Medicamento / Dosagem', 18, y + 4.2);
    doc.text('Frequência & Horários', 95, y + 4.2);
    doc.text('Status', 145, y + 4.2);
    doc.text('Orientações de Tomada', 165, y + 4.2);
    y += 6;

    // Table Rows
    data.medications.forEach((med, idx) => {
      checkPageBreak(8);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 6.5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${med.name} ${med.dosage}`, 18, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const times = med.reminderTimes && med.reminderTimes.length > 0 ? `(${med.reminderTimes.join(', ')})` : '';
      doc.text(`${med.frequency} ${times}`, 95, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(med.status || 'Ativo', 145, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const note = med.notes ? (med.notes.length > 25 ? med.notes.slice(0, 25) + '...' : med.notes) : '-';
      doc.text(note, 165, y + 4.5);

      y += 6.5;
    });

    y += 4;
  }

  // 5. REGISTROS DE PRESSÃO ARTERIAL
  if (options.includeBP && bpList.length > 0) {
    checkPageBreak(35);

    doc.setFillColor(15, 76, 70);
    doc.rect(14, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 76, 70);
    doc.text('2. HISTÓRICO DE PRESSÃO ARTERIAL (HAS)', 19, y + 5.5);
    y += 10;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Data / Horário', 18, y + 4.2);
    doc.text('Sistólica', 65, y + 4.2);
    doc.text('Diastólica', 90, y + 4.2);
    doc.text('Pulso', 115, y + 4.2);
    doc.text('Classificação', 135, y + 4.2);
    doc.text('Observações Clínicas', 165, y + 4.2);
    y += 6;

    bpList.slice(0, 15).forEach((record, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 6, 'F');
      }

      const dateStr = new Date(record.recordedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(dateStr, 18, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${record.systolic} mmHg`, 65, y + 4.2);
      doc.text(`${record.diastolic} mmHg`, 90, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(`${record.pulse} bpm`, 115, y + 4.2);

      if (record.isCritical || record.systolic >= 140 || record.diastolic >= 90) {
        doc.setTextColor(190, 18, 60);
      } else {
        doc.setTextColor(4, 120, 87);
      }
      doc.text(record.statusText || 'Normal', 135, y + 4.2);

      doc.setTextColor(100, 116, 139);
      const note = record.notes ? (record.notes.length > 22 ? record.notes.slice(0, 22) + '...' : record.notes) : '-';
      doc.text(note, 165, y + 4.2);

      y += 6;
    });

    y += 4;
  }

  // 6. REGISTROS DE GLICEMIA CAPILAR
  if (options.includeGlucose && glucList.length > 0) {
    checkPageBreak(35);

    doc.setFillColor(15, 76, 70);
    doc.rect(14, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 76, 70);
    doc.text('3. HISTÓRICO DE GLICEMIA CAPILAR (DM)', 19, y + 5.5);
    y += 10;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Data / Horário', 18, y + 4.2);
    doc.text('Momento / Contexto', 65, y + 4.2);
    doc.text('Glicemia', 115, y + 4.2);
    doc.text('Classificação', 140, y + 4.2);
    doc.text('Observações', 165, y + 4.2);
    y += 6;

    glucList.slice(0, 15).forEach((record, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, 6, 'F');
      }

      const dateStr = new Date(record.recordedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const momentMap: Record<string, string> = {
        EM_JEJUM: 'Em Jejum',
        ANTES_ALMOCO: 'Antes do Almoço',
        APOS_ALMOCO: 'Após Almoço (2h)',
        ANTES_JANTAR: 'Antes do Jantar',
        APOS_JANTAR: 'Após Jantar (2h)',
        AO_DORMIR: 'Ao Dormir',
      };

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(dateStr, 18, y + 4.2);
      doc.text(momentMap[record.moment] || record.moment, 65, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${record.glucoseValue} mg/dL`, 115, y + 4.2);

      if (record.isCritical || record.glucoseValue > 140 || record.glucoseValue < 70) {
        doc.setTextColor(190, 18, 60);
      } else {
        doc.setTextColor(4, 120, 87);
      }
      doc.text(record.statusText || 'Normal', 140, y + 4.2);

      doc.setTextColor(100, 116, 139);
      const note = record.notes ? (record.notes.length > 22 ? record.notes.slice(0, 22) + '...' : record.notes) : '-';
      doc.text(note, 165, y + 4.2);

      y += 6;
    });

    y += 4;
  }

  // 7. PRÓXIMAS CONSULTAS & AGENDAMENTOS
  if (options.includeAppointments && data.appointments && data.appointments.length > 0) {
    checkPageBreak(25);

    doc.setFillColor(15, 76, 70);
    doc.rect(14, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 76, 70);
    doc.text('4. CONSULTAS AGENDADAS & RETORNOS MÉDICOS', 19, y + 5.5);
    y += 10;

    data.appointments.forEach((app) => {
      checkPageBreak(8);
      const appDate = new Date(app.scheduledFor).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, pageWidth - 28, 8, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Data: ${appDate}`, 18, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Tipo: ${app.appointmentType}`, 75, y + 5);
      doc.text(`Médico: ${app.doctorName}`, 125, y + 5);
      doc.text(`Local: ${app.clinicName}`, 165, y + 5);

      y += 9.5;
    });

    y += 4;
  }

  // 8. CARIMBO E ASSINATURA MÉDICA (RODAPÉ CLÍNICO)
  checkPageBreak(30);

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 28, y);
  y += 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* Este documento consolida medições domiciliares registradas no aplicativo Rota da Saúde pelo paciente e sua equipe de saúde.',
    14,
    y
  );
  doc.text(
    'Válido para apresentação em consultas médicas na Atenção Primária, Especialidades e Pronto Atendimento.',
    14,
    y + 4
  );

  // Assinatura do médico / Carimbo
  const signY = y + 15;
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - 85, signY, pageWidth - 18, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assinatura / Carimbo do Médico Assistente', pageWidth - 51.5, signY + 4, { align: 'center' });
  doc.setFontSize(7);
  doc.text('CRM / Especialidade', pageWidth - 51.5, signY + 7.5, { align: 'center' });

  return doc;
}
