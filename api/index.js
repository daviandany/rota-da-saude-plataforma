import express from 'express';
import cors from 'cors';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { apiRouter } from '../src/server/routes/api.js';
import { getDatabase } from '../src/server/db/database.js';

// Inicialização do Firebase Admin SDK na Vercel Serverless Function
if (getApps().length === 0) {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error('[Vercel Serverless] Erro ao inicializar Firebase Admin SDK:', err);
    }
  }
}

// Configuração de sessão e JWT
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'rota-da-saude-super-secret-key-change-in-production-2025',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

const app = express();

app.use(cors());
app.use(express.json());

// Initialize database layer
getDatabase().catch((err) => {
  console.error('[Vercel Serverless] Erro ao inicializar banco de dados:', err);
});

// Handle both /api and root paths for serverless invocation
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
