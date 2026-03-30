import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from '@/config/supabase.config';

export function createClient() {
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
