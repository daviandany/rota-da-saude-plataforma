import { Router } from 'express';
import { authController, clinicalController, doctorController, medicationController, appointmentController, alertController, contentController, reportController, notificationController, } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getDatabase } from '../db/database.js';
export const apiRouter = Router();
// Health & Database status
apiRouter.get('/health', async (req, res) => {
    const db = await getDatabase();
    res.json({
        status: 'online',
        service: 'Rota da Saúde - API Backend',
        timestamp: new Date().toISOString(),
        database: {
            type: db.isPostgres ? 'PostgreSQL' : 'In-Memory State Store (Postgres-Compatible)',
            ready: true,
        },
    });
});
apiRouter.get('/db-status', async (req, res) => {
    const db = await getDatabase();
    res.json({
        isPostgres: db.isPostgres,
        ready: true,
    });
});
// Authentication Routes
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/google-firebase', authController.googleFirebaseLogin);
apiRouter.get('/auth/me', authMiddleware, authController.getMe);
apiRouter.put('/auth/profile', authMiddleware, authController.updateProfile);
apiRouter.post('/auth/forgot-password', authController.forgotPassword);
apiRouter.post('/auth/verify-reset-token', authController.verifyResetToken);
apiRouter.post('/auth/reset-password', authController.resetPassword);
// Clinical Endpoints (Patient & Shared)
apiRouter.get('/clinical/summary', authMiddleware, clinicalController.getSummary);
apiRouter.post('/clinical/pressure', authMiddleware, clinicalController.recordPressure);
apiRouter.post('/clinical/glucose', authMiddleware, clinicalController.recordGlucose);
apiRouter.get('/clinical/history', authMiddleware, clinicalController.getHistory);
// Medications
apiRouter.get('/medications', authMiddleware, medicationController.getMedications);
apiRouter.post('/medications', authMiddleware, medicationController.addMedication);
apiRouter.patch('/medications/:id/status', authMiddleware, medicationController.updateStatus);
// Appointments
apiRouter.get('/appointments', authMiddleware, appointmentController.getAppointments);
apiRouter.post('/appointments', authMiddleware, appointmentController.createAppointment);
// Alerts
apiRouter.get('/alerts', authMiddleware, alertController.getAlerts);
apiRouter.post('/alerts/:id/resolve', authMiddleware, alertController.resolve);
// Doctor & Clinical Staff Portal
apiRouter.get('/doctor/dashboard', authMiddleware, doctorController.getDashboard);
apiRouter.get('/doctor/patients', authMiddleware, doctorController.getPatients);
apiRouter.get('/doctor/patients/:patientId', authMiddleware, doctorController.getPatientProfile);
// Educational & Guidance (Mitos e Verdades)
apiRouter.get('/content/educational', contentController.getEducational);
// Reports Generation & Export
apiRouter.get('/reports/summary', authMiddleware, reportController.generateReport);
// Firebase Cloud Messaging (FCM) & Push Notifications
apiRouter.get('/notifications/fcm-config', notificationController.getFCMConfig);
apiRouter.post('/notifications/register-token', authMiddleware, notificationController.registerToken);
apiRouter.get('/notifications', authMiddleware, notificationController.getNotifications);
apiRouter.post('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
apiRouter.post('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);
apiRouter.post('/notifications/test-medication', authMiddleware, notificationController.testMedicationReminder);
apiRouter.post('/notifications/test-critical-reading', authMiddleware, notificationController.testCriticalReading);
