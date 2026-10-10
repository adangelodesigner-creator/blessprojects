import { createClient } from '@supabase/supabase-js';

const env = import.meta.env;

const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_blessprojects_SUPABASE_URL || env.blessprojects_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_blessprojects_SUPABASE_ANON_KEY || env.blessprojects_SUPABASE_ANON_KEY;

const isPlaceholder = (v: string) =>
  !v || v.includes('PLACEHOLDER') || v.includes('your-');

export const isSupabaseConfigured =
  !!url && !!anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey) &&
  url.startsWith('https://');

export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://local.invalid',
  isSupabaseConfigured ? anonKey : 'local-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'gp_auth',
    },
  },
);
