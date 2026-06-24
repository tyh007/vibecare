import { createClient } from '@supabase/supabase-js';
import { environment } from '@/config/environment';
import type { Database } from './types';

if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
  throw new Error(
    "Supabase is not configured. Copy .env.example to .env and add the required public client values.",
  );
}

export const supabase = createClient<Database>(
  environment.supabaseUrl,
  environment.supabasePublishableKey,
  {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
