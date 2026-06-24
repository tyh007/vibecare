const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const environment = {
  supabaseUrl,
  supabasePublishableKey,
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN?.trim(),
  isSupabaseConfigured: Boolean(supabaseUrl && supabasePublishableKey),
} as const;
