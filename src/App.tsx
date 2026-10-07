/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationCenterModal } from './components/common/NotificationCenterModal';
import { NotificationToast } from './components/common/NotificationToast';

// Unified Responsive Layout & Screens
import { WebLayout } from './components/web/WebLayout';
import { WebLoginScreen } from './components/web/WebLoginScreen';
import { WebPatientDashboard } from './components/web/WebPatientDashboard';
import { WebDoctorDashboard } from './components/web/WebDoctorDashboard';

// Patient & Doctor Action Modals
import { RegisterPressureModal } from './components/patient/RegisterPressureModal';
import { RegisterGlucoseModal } from './components/patient/RegisterGlucoseModal';
import { RegisterSymptomModal } from './components/patient/RegisterSymptomModal';
import { EmergencyModal } from './components/patient/EmergencyModal';
import { AddMedicationModal } from './components/patient/AddMedicationModal';
import { ScheduleAppointmentModal } from './components/patient/ScheduleAppointmentModal';
import { NewAppointmentModal } from './components/doctor/NewAppointmentModal';
import { NewPatientModal } from './components/doctor/NewPatientModal';
import { DoctorQuickAlertModal } from './components/doctor/DoctorQuickAlertModal';
import { UserProfileModal } from './components/common/UserProfileModal';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals state
  const [isPressureModalOpen, setIsPressureModalOpen] = useState(false);
  const [isGlucoseModalOpen, setIsGlucoseModalOpen] = useState(false);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isScheduleAppointmentOpen, setIsScheduleAppointmentOpen] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isQuickAlertOpen, setIsQuickAlertOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Redireciona automaticamente para a rota /dashboard quando o login é confirmado
  useEffect(() => {
    if (!loading) {
      if (user) {
        if (window.location.pathname !== '/dashboard') {
          window.history.replaceState({}, '', '/dashboard');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (window.location.pathname === '/dashboard') {
          window.history.replaceState({}, '', '/');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-teal-300">
          Carregando Rota da Saúde...
        </p>
      </div>
    );
  }

  // Se não autenticado, exibe tela de login unificada e 100% responsiva
  if (!user) {
    return (
      <>
        <NotificationToast />
        <WebLoginScreen />
      </>
    );
  }

  return (
    <>
      {/* Toast flutuante de notificações push FCM */}
      <NotificationToast />

      {/* Layout Unificado e Responsivo (Web, Tablet e Mobile) */}
      <WebLayout
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      >
        {user.role === 'PATIENT' ? (
          <WebPatientDashboard
            key={refreshTrigger}
            onOpenPressureModal={() => setIsPressureModalOpen(true)}
            onOpenGlucoseModal={() => setIsGlucoseModalOpen(true)}
            onOpenAddMedication={() => setIsAddMedModalOpen(true)}
            onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
            onOpenSymptomModal={() => setIsSymptomModalOpen(true)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            onOpenScheduleAppointment={() => setIsScheduleAppointmentOpen(true)}
          />
        ) : (
          <WebDoctorDashboard
            key={refreshTrigger}
            onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
            onOpenAddMedication={(pId) => {
              setSelectedPatientId(pId || null);
              setIsAddMedModalOpen(true);
            }}
            onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
            onOpenNewPatient={() => setIsNewPatientOpen(true)}
            onOpenQuickAlert={() => setIsQuickAlertOpen(true)}
          />
        )}
      </WebLayout>

      {/* Modal de Dados Cadastrais / Perfil do Usuário (acessível pelo botão Meus Dados) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isInitialOnboarding={false}
      />

      {/* Central de Notificações */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Modais Clínicos do Paciente */}
      <RegisterPressureModal
        isOpen={isPressureModalOpen}
        onClose={() => setIsPressureModalOpen(false)}
        onSuccess={triggerRefresh}
        patientId={user.profileId || user.id}
      />
      <RegisterGlucoseModal
        isOpen={isGlucoseModalOpen}
        onClose={() => setIsGlucoseModalOpen(false)}
        onSuccess={triggerRefresh}
        patientId={user.profileId || user.id}
      />
      <RegisterSymptomModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        onSuccess={triggerRefresh}
      />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
      <ScheduleAppointmentModal
        isOpen={isScheduleAppointmentOpen}
        onClose={() => setIsScheduleAppointmentOpen(false)}
        onSuccess={triggerRefresh}
      />
      <AddMedicationModal
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        onSuccess={triggerRefresh}
        patientId={selectedPatientId || user.profileId || user.id}
      />

      {/* Modais Clínicos do Profissional / Médico */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSuccess={triggerRefresh}
        patientId={selectedPatientId || undefined}
      />
      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={triggerRefresh}
      />
      <DoctorQuickAlertModal
        isOpen={isQuickAlertOpen}
        onClose={() => setIsQuickAlertOpen(false)}
        onSuccess={triggerRefresh}
      />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
