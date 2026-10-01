import express from 'express';
import cors from 'cors';
import { apiRouter } from '../src/server/routes/api';
import { getDatabase } from '../src/server/db/database';

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
