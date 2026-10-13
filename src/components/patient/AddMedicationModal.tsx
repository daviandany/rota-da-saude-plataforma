import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  X,
  Pill,
  Stethoscope,
  UserCheck,
  UserPlus,
  Fingerprint,
  Mail,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Medication, Patient } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
  medicationToEdit?: Medication | null;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  medicationToEdit,
}) => {
  const { user, refreshUser } = useAuth();
  const isDoctor = user?.role === 'PROFESSIONAL';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [patientFilter, setPatientFilter] = useState<string>('');
  const [showQuickAddPatient, setShowQuickAddPatient] = useState<boolean>(false);
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<number>(52);
  const [creatingPatient, setCreatingPatient] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Todos os dias');
  const [reminderTimes, setReminderTimes] = useState<string[]>(['08:00']);
  const [newTime, setNewTime] = useState('20:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowQuickAddPatient(false);
      setNewPatientName('');
      setPatientFilter('');

      if (isDoctor) {
        api
          .getDoctorPatients()
          .then((list) => {
            setPatients(list);
            const medPatId = medicationToEdit?.patientId;
            const targetId = medPatId || patientId;
            const validInitial =
              targetId && !targetId.startsWith('prof-') && list.some((p) => p.id === targetId)
                ? targetId
                : list[0]?.id || '';
            setSelectedPatient(validInitial);
          })
          .catch(() => {});
      } else {
        const currentPatId = medicationToEdit?.patientId || patientId || user?.profileId || user?.id || '';
        setSelectedPatient(currentPatId);
      }

      if (medicationToEdit) {
        setName(medicationToEdit.name || '');
        setDosage(medicationToEdit.dosage || '');
        setFrequency(medicationToEdit.frequency || 'Todos os dias');
        setReminderTimes(
          medicationToEdit.reminderTimes && medicationToEdit.reminderTimes.length > 0
            ? medicationToEdit.reminderTimes
            : ['08:00']
        );
        setNotes((medicationToEdit.notes || '').replace(/\s*\[Prescrito pelo Médico\]/g, ''));
      } else {
        setName('');
        setDosage('');
        setFrequency('Todos os dias');
        setReminderTimes(['08:00']);
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, medicationToEdit, isDoctor, patientId, user?.profileId, user?.id]);

  if (!isOpen) return null;

  const formatShortId = (id: string) =>
    id ? `#${id.replace(/^pat-/, '').slice(0, 8).toUpperCase()}` : '#PAC';

  // Conta quantos pacientes compartilham o mesmo login (e-mail) para destacar visualmente
  const emailCounts = patients.reduce<Record<string, number>>((acc, pt) => {
    const key = (pt.email || '').trim().toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const filteredPatients = patients.filter((pt) => {
    if (!patientFilter.trim()) return true;
    const q = patientFilter.trim().toLowerCase();
    return (
      pt.name.toLowerCase().includes(q) ||
      pt.id.toLowerCase().includes(q) ||
      (pt.email && pt.email.toLowerCase().includes(q))
    );
  });

  const selectedPatientObj =
    patients.find((p) => p.id === selectedPatient) ||
    filteredPatients[0] ||
    patients[0] ||
    null;

  const handleQuickCreateSameLoginPatient = async () => {
    if (!newPatientName.trim()) {
      setError('Informe o nome do paciente para identificá-lo.');
      return;
    }
    setCreatingPatient(true);
    setError(null);
    try {
      const baseEmail =
        selectedPatientObj?.email || user?.email || 'paciente@rotadasaude.gov.br';
      const created = await api.createDoctorPatient({
        name: newPatientName.trim(),
        email: baseEmail,
        age: Number(newPatientAge || 52),
        gender: 'Não informado',
        conditions: ['Hipertensão Arterial (HAS)', 'Diabetes Mellitus Tipo 2'],
        riskLevel: 'MODERADO',
        healthcareUnit: selectedPatientObj?.healthcareUnit || 'UBS Dr. Manoel de Abreu',
      });
      const updatedList = [created, ...patients.filter((p) => p.id !== created.id)];
      setPatients(updatedList);
      setSelectedPatient(created.id);
      setNewPatientName('');
      setShowQuickAddPatient(false);
      await refreshUser().catch(() => {});
    } catch (e: any) {
      setError(e.message || 'Não foi possível criar o paciente.');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleAddTime = () => {
    if (newTime && !reminderTimes.includes(newTime)) {
      setReminderTimes([...reminderTimes, newTime]);
    }
  };

  const handleRemoveTime = (t: string) => {
    setReminderTimes(reminderTimes.filter((x) => x !== t));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;
    setLoading(true);
    setError(null);
    try {
      const targetPatient = isDoctor ? selectedPatientObj : patients.find((p) => p.id === selectedPatient);
      const targetPatientId = isDoctor
        ? targetPatient?.id || selectedPatient
        : medicationToEdit?.patientId || selectedPatient || patientId || user?.profileId || user?.id;

      if (!targetPatientId) {
        throw new Error('Selecione um paciente válido para prescrever o medicamento.');
      }

      if (medicationToEdit) {
        await api.updateMedication(medicationToEdit.id, {
          patientId: targetPatientId,
          name,
          dosage,
          frequency,
          reminderTimes,
          notes,
        });
      } else {
        await api.addMedication({
          patientId: targetPatientId,
          patientName: isDoctor ? targetPatient?.name : user?.name,
          patientEmail: isDoctor ? targetPatient?.email : user?.email,
          name,
          dosage,
          frequency,
          reminderTimes,
          notes,
          addedByRole: isDoctor ? 'PROFESSIONAL' : 'PATIENT',
          prescribedBy: isDoctor ? user?.name || 'Médico da Equipe ESF' : undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar medicamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!medicationToEdit) return;
    if (!window.confirm(`Tem certeza que deseja excluir o medicamento "${medicationToEdit.name}"?`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.deleteMedication(medicationToEdit.id);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir medicamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh] transition-colors">
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isDoctor ? (
                  <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                ) : (
                  <Pill className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                )}
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white truncate">
                  {medicationToEdit
                    ? 'Editar Medicamento'
                    : isDoctor
                    ? 'Prescrever Medicamento (Médico)'
                    : 'Adicionar Medicamento'}
                </h2>
              </div>
              {isDoctor && selectedPatientObj && (
                <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 truncate mt-0.5">
                  Paciente: <span className="font-black">{selectedPatientObj.name}</span> ·{' '}
                  <span className="font-mono">{formatShortId(selectedPatientObj.id)}</span>
                </p>
              )}
            </div>
          </div>

          {isDoctor && selectedPatientObj && (
            <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
              {formatShortId(selectedPatientObj.id)}
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!medicationToEdit && isDoctor && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/70 border border-indigo-100 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Paciente da Prescrição *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddPatient(!showQuickAddPatient)}
                  className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{showQuickAddPatient ? 'Fechar' : '+ Paciente no mesmo login'}</span>
                </button>
              </div>

              <select
                value={selectedPatientObj?.id || selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none shadow-2xs"
              >
                {(filteredPatients.length > 0 ? filteredPatients : patients).map((pt) => {
                  const loginKey = (pt.email || '').trim().toLowerCase();
                  const sharedCount = loginKey ? emailCounts[loginKey] || 1 : 1;
                  return (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.age} anos) — Código {formatShortId(pt.id)} · Login: {pt.email}
                      {sharedCount > 1 ? ` [${sharedCount} pacientes neste login]` : ''}
                    </option>
                  );
                })}
              </select>

              {patients.length > 3 && (
                <input
                  type="text"
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  placeholder="Filtrar paciente por nome, código #ID ou login/e-mail..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                />
              )}

              {showQuickAddPatient && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                  <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                    Identificar novo paciente usando o mesmo login (
                    {selectedPatientObj?.email || user?.email})
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do paciente (ex: João)"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="col-span-2 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      max={120}
                      placeholder="Idade"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(Number(e.target.value))}
                      className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={creatingPatient}
                    onClick={handleQuickCreateSameLoginPatient}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {creatingPatient
                      ? 'Gerando ID exclusivo...'
                      : 'Criar Prontuário e Selecionar para Prescrição'}
                  </button>
                </div>
              )}

              {selectedPatientObj && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 text-[11px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{selectedPatientObj.name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-indigo-500" />
                      ID: {selectedPatientObj.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      Login: <strong className="text-slate-700 dark:text-slate-200">{selectedPatientObj.email}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      {selectedPatientObj.age} anos ({selectedPatientObj.gender || 'SUS'})
                    </span>
                    <span>·</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Risco {selectedPatientObj.riskLevel}
                    </span>
                  </div>
                  {emailCounts[(selectedPatientObj.email || '').trim().toLowerCase()] > 1 && (
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/70">
                      Este login possui {emailCounts[(selectedPatientObj.email || '').trim().toLowerCase()]} pacientes identificados individualmente. A prescrição será gravada exclusivamente no ID{' '}
                      <span className="font-mono">{selectedPatientObj.id}</span> ({selectedPatientObj.name}).
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                Medicamentos prescritos pelo médico ficam vinculados ao ID exclusivo deste paciente e bloqueados para edição pelo paciente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do medicamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Losartana Potássica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dosagem *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 50mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Frequência
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              >
                <option value="Todos os dias">Todos os dias</option>
                <option value="12 em 12 horas">12 em 12 horas</option>
                <option value="8 em 8 horas">8 em 8 horas</option>
                <option value="Dias alternados">Dias alternados</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Horários de lembrete
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {reminderTimes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-full text-xs font-bold"
                >
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(t)}
                    className="hover:text-rose-600 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTime}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition"
              >
                + Horário
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instruções / Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tomar após o café com bastante água."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-teal-600 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {medicationToEdit && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Excluir medicamento"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Excluir</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-teal-800 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Salvando...' : medicationToEdit ? 'Salvar Alterações' : 'Salvar Medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
