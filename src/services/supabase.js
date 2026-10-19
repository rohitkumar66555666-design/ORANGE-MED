// Supabase client — keys come from .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || url === 'your_project_url_here') {
  console.warn('[OrangeMed] Supabase URL not set — running in offline/localStorage mode');
}

export const supabase = (url && url !== 'your_project_url_here')
  ? createClient(url, key)
  : null;

export const isOnline = () => !!supabase;
