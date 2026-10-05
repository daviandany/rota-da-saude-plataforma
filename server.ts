import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes/api.js';
import { getDatabase } from './src/server/db/database.js';
import { config } from './src/server/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = config.port;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Initialize Database Layer
  await getDatabase();

  // Mount Clean Architecture REST API routes
  app.use('/api', apiRouter);

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[App] Vite middleware attached for development.');
  } else {
    // Serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log(`[App] Serving production build from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  ROTA DA SAÚDE - HIPERTENSÃO | DIABETES`);
    console.log(`  Node.js Scalable Backend + React Frontend`);
    console.log(`  Server running on http://0.0.0.0:${PORT}`);
    console.log(`  Database Adapter: ${config.database.url ? 'PostgreSQL ready' : 'PostgreSQL Schema + Local Store'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Error] Failed to start server:', err);
  process.exit(1);
});
