import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.EXPO_PUBLIC_FIREBASE_API_KEY': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || ''
      ),
      'process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || ''
      ),
      'process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || ''
      ),
      'process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || ''
      ),
      'process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''
      ),
      'process.env.EXPO_PUBLIC_FIREBASE_APP_ID': JSON.stringify(
        env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ''
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(
        (env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
          .trim()
          .replace(/\/rest\/v1\/?$/i, '')
          .replace(/\/+$/, '')
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        (env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
