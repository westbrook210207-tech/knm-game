import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

const { url, publishableKey, isConfigured } = getSupabaseEnv();

let supabaseClient = null;

if (isConfigured) {
  supabaseClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseClient() {
  return supabaseClient;
}

export function requireSupabaseClient() {
  if (!supabaseClient) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return supabaseClient;
}
