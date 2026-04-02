import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/config/supabase.config';

export function createAdminClient() {
  const serviceRoleKey = supabaseConfig.serviceRoleKey;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseConfig.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
