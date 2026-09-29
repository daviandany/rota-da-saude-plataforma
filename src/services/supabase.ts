import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or default demo project reference
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://xyzcompany.supabase.co';

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-anon-key';

export const isSupabaseConfigured = Boolean(
  (import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('demo-anon-key')),
  };
}

/**
 * Helper to subscribe to realtime updates on clinical alerts
 */
export function subscribeToClinicalAlerts(
  patientId: string,
  onNewAlert: (alert: any) => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`alerts-${patientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'clinical_alerts',
        filter: `patient_id=eq.${patientId}`,
      },
      (payload) => {
        onNewAlert(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
