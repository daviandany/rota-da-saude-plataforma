import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project.supabase.co')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options.headers);
          const currentUser = getAuth().currentUser;
          const activeUserId =
            currentUser?.uid ||
            localStorage.getItem('active_user_id') ||
            localStorage.getItem('firebase_uid_hint') ||
            '';
          if (activeUserId) {
            headers.set('x-firebase-uid', activeUserId);
          }
          return fetch(url, { ...options, headers });
        },
      },
    })
  : null;

export default supabase;
