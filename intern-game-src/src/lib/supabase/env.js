export function getSupabaseEnv() {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  const eventSlug = import.meta.env.VITE_EVENT_SLUG || 'ueh-softskills-2026';

  return {
    url,
    publishableKey,
    eventSlug,
    isConfigured: Boolean(url && publishableKey),
  };
}
