/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { TopBar } from './components/common/TopBar';
import { NotificationCenterModal } from './components/common/NotificationCenterModal';
import { NotificationToast } from './components/common/NotificationToast';
import { LoginScreen } from './components/auth/LoginScreen';

// Web Desktop Components
import { WebLayout } from './components/web/WebLayout';
import { WebLoginScreen } from './components/web/WebLoginScreen';
import { WebPatientDashboard } from './components/web/WebPatientDashboard';
import { WebDoctorDashboard } from './components/web/WebDoctorDashboard';

// Patient components
import { PatientHome } from './components/patient/PatientHome';
import { PatientAlerts } from './components/patient/PatientAlerts';
import { PatientHistory } from './components/patient/PatientHistory';
import { PatientMedications } from './components/patient/PatientMedications';
import { PatientEducational } from './components/patient/PatientEducational';
import { PatientReports } from './components/patient/PatientReports';
import { PatientMenu } from './components/patient/PatientMenu';
import { PatientBottomNav } from './components/patient/PatientBottomNav';
import { PatientQuickActions } from './components/patient/PatientQuickActions';
import { RegisterPressureModal } from './components/patient/RegisterPressureModal';
import { RegisterGlucoseModal } from './components/patient/RegisterGlucoseModal';
import { RegisterSymptomModal } from './components/patient/RegisterSymptomModal';
import { EmergencyModal } from './components/patient/EmergencyModal';
import { AddMedicationModal } from './components/patient/AddMedicationModal';

// Doctor components
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DoctorPatients } from './components/doctor/DoctorPatients';
import { DoctorAlerts } from './components/doctor/DoctorAlerts';
import { DoctorAppointments } from './components/doctor/DoctorAppointments';
import { DoctorPatientProfile } from './components/doctor/DoctorPatientProfile';
import { DoctorMenu } from './components/doctor/DoctorMenu';
import { DoctorBottomNav } from './components/doctor/DoctorBottomNav';
import { DoctorQuickActions } from './components/doctor/DoctorQuickActions';
import { NewAppointmentModal } from './components/doctor/NewAppointmentModal';
import { NewPatientModal } from './components/doctor/NewPatientModal';
import { DoctorQuickAlertModal } from './components/doctor/DoctorQuickAlertModal';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Patient Navigation State (Mobile)
  const [patientTab, setPatientTab] = useState('inicio');
  const [isPressureModalOpen, setIsPressureModalOpen] = useState(false);
  const [isGlucoseModalOpen, setIsGlucoseModalOpen] = useState(false);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Doctor Navigation State (Mobile)
  const [doctorTab, setDoctorTab] = useState('inicio');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isQuickAlertOpen, setIsQuickAlertOpen] = useState(false);

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

  return (
    <>
      {/* Floating Push Notification Toast available across both views */}
      <NotificationToast />

      {/* WEB VIEWPORT EXPERIENCE */}
      {viewMode === 'web' ? (
        !user ? (
          <WebLoginScreen onSwitchToMobile={() => setViewMode('mobile')} />
        ) : (
          <WebLayout
            onSwitchToMobile={() => setViewMode('mobile')}
            onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
          >
            {user.role === 'PATIENT' ? (
              <WebPatientDashboard
                onOpenPressureModal={() => setIsPressureModalOpen(true)}
                onOpenGlucoseModal={() => setIsGlucoseModalOpen(true)}
                onOpenAddMedication={() => setIsAddMedModalOpen(true)}
                onOpenNotificationCenter={() => setIsNotificationModalOpen(true)}
                onOpenSymptomModal={() => setIsSymptomModalOpen(true)}
                onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
              />
            ) : (
              <WebDoctorDashboard
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
        )
      ) : (
        /* MOBILE VIEWPORT EXPERIENCE */
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
          {/* Top persistent control bar */}
          <TopBar
            isMobileFrame={isMobileFrame}
            onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
            viewMode={viewMode}
            onSelectViewMode={(mode) => setViewMode(mode)}
            onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
          />

          {/* Main viewport container: Fully responsive edge-to-edge on mobile */}
          <main className="flex-1 flex justify-center items-stretch sm:items-start p-0 sm:p-4 lg:p-6 overflow-y-auto">
            <div
              className={`w-full transition-all duration-300 flex flex-col ${
                isMobileFrame
                  ? 'max-w-full sm:max-w-[430px] min-h-[100dvh] sm:min-h-[840px] bg-white dark:bg-slate-900 rounded-none sm:rounded-[40px] shadow-2xl border-0 sm:border-8 border-slate-800 dark:border-slate-700 overflow-hidden relative'
                  : 'max-w-full sm:max-w-4xl min-h-[100dvh] sm:min-h-[780px] bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-xl border-0 sm:border border-slate-200 dark:border-slate-800 overflow-hidden relative'
              }`}
            >
              {/* App Content */}
              {!user ? (
                <LoginScreen />
              ) : user.role === 'PATIENT' ? (
                /* PATIENT EXPERIENCE */
                <div className="flex-1 flex flex-col min-h-full relative bg-slate-50/70 dark:bg-slate-950 transition-colors">
                  <div className="flex-1">
                    {patientTab === 'inicio' && (
                      <PatientHome
                        onOpenPressureModal={() => setIsPressureModalOpen(true)}
                        onOpenGlucoseModal={() => setIsGlucoseModalOpen(true)}
                        onNavigateTab={(tab) => setPatientTab(tab)}
                        onOpenMenu={() => setPatientTab('mais')}
                      />
                    )}
                    {patientTab === 'historico' && (
                      <PatientHistory onBack={() => setPatientTab('inicio')} />
                    )}
                    {patientTab === 'alertas' && <PatientAlerts />}
                    {patientTab === 'medicamentos' && (
                      <PatientMedications
                        onBack={() => setPatientTab('inicio')}
                        onOpenAddMedication={() => setIsAddMedModalOpen(true)}
                      />
                    )}
                    {patientTab === 'educacional' && (
                      <PatientEducational onBack={() => setPatientTab('mais')} />
                    )}
                    {patientTab === 'relatorios' && (
                      <PatientReports onBack={() => setPatientTab('mais')} />
                    )}
                    {patientTab === 'mais' && (
                      <PatientMenu
                        onNavigateTab={(tab) => setPatientTab(tab)}
                      />
                    )}
                  </div>

                  {/* Pinned Quick Action Entry Dock at bottom of pages */}
                  <div className="sticky bottom-[58px] z-20 pointer-events-auto">
                    <PatientQuickActions
                      onOpenPressureModal={() => setIsPressureModalOpen(true)}
                      onOpenGlucoseModal={() => setIsGlucoseModalOpen(true)}
                      onOpenAddMedication={() => setIsAddMedModalOpen(true)}
                      onOpenSymptomModal={() => setIsSymptomModalOpen(true)}
                      onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                    />
                  </div>

                  {/* Patient Bottom Navigation */}
                  <PatientBottomNav
                    activeTab={patientTab}
                    onChangeTab={(tab) => setPatientTab(tab)}
                    pendingAlertsCount={2}
                  />
                </div>
              ) : (
                /* DOCTOR EXPERIENCE */
                <div className="flex-1 flex flex-col min-h-full relative bg-slate-50/70 dark:bg-slate-950 transition-colors">
                  <div className="flex-1">
                    {selectedPatientId ? (
                      <DoctorPatientProfile
                        patientId={selectedPatientId}
                        onBack={() => setSelectedPatientId(null)}
                        onOpenAddMedication={() => setIsAddMedModalOpen(true)}
                        onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
                      />
                    ) : (
                      <>
                        {doctorTab === 'inicio' && (
                          <DoctorDashboard
                            onNavigateTab={(tab) => setDoctorTab(tab)}
                            onOpenMenu={() => setDoctorTab('mais')}
                            onSelectPatient={(id) => setSelectedPatientId(id)}
                          />
                        )}
                        {doctorTab === 'pacientes' && (
                          <DoctorPatients
                            onBack={() => setDoctorTab('inicio')}
                            onSelectPatient={(id) => setSelectedPatientId(id)}
                          />
                        )}
                        {doctorTab === 'alertas' && (
                          <DoctorAlerts
                            onBack={() => setDoctorTab('inicio')}
                            onSelectPatient={(id) => setSelectedPatientId(id)}
                          />
                        )}
                        {doctorTab === 'consultas' && (
                          <DoctorAppointments
                            onBack={() => setDoctorTab('inicio')}
                            onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
                          />
                        )}
                        {doctorTab === 'mais' && (
                          <DoctorMenu
                            onBack={() => setDoctorTab('inicio')}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Doctor Quick Action Entry Dock & Bottom Navigation */}
                  {!selectedPatientId && (
                    <>
                      <div className="sticky bottom-[58px] z-20 pointer-events-auto">
                        <DoctorQuickActions
                          onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
                          onOpenNewPatient={() => setIsNewPatientOpen(true)}
                          onOpenAddMedication={() => setIsAddMedModalOpen(true)}
                          onOpenQuickAlert={() => setIsQuickAlertOpen(true)}
                        />
                      </div>

                      <DoctorBottomNav
                        activeTab={doctorTab}
                        onChangeTab={(tab) => setDoctorTab(tab)}
                        criticalAlertsCount={15}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Shared Modals */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Patient Action Modals */}
      <RegisterPressureModal
        isOpen={isPressureModalOpen}
        onClose={() => setIsPressureModalOpen(false)}
        onSuccess={() => {
          setPatientTab('historico');
        }}
      />
      <RegisterGlucoseModal
        isOpen={isGlucoseModalOpen}
        onClose={() => setIsGlucoseModalOpen(false)}
        onSuccess={() => {
          setPatientTab('historico');
        }}
      />
      <RegisterSymptomModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
      />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
      <AddMedicationModal
        isOpen={isAddMedModalOpen}
        onClose={() => setIsAddMedModalOpen(false)}
        onSuccess={() => {
          setPatientTab('medicamentos');
        }}
        patientId={selectedPatientId || undefined}
      />

      {/* Doctor Action Modals */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSuccess={() => {
          setDoctorTab('consultas');
        }}
        patientId={selectedPatientId || undefined}
      />
      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={() => {
          setDoctorTab('pacientes');
        }}
      />
      <DoctorQuickAlertModal
        isOpen={isQuickAlertOpen}
        onClose={() => setIsQuickAlertOpen(false)}
        onSuccess={() => {
          setDoctorTab('alertas');
        }}
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
