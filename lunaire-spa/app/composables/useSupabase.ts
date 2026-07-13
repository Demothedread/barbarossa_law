/**
 * Supabase client composable for Nuxt/Vue frontend.
 *
 * Quiz data currently goes through the Flask backend API. This client is
 * available for Supabase features like:
 * - Supabase Auth (replacing custom JWT auth)
 * - Realtime subscriptions (live quiz updates)
 * - Storage (essay uploads, PDFs)
 *
 * The Flask backend uses its own psycopg2 connection via SUPABASE_DB_URL.
 * The browser client must only receive the public/publishable key.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const useSupabase = () => {
  const config = useRuntimeConfig();

  if (!supabaseInstance) {
    const supabaseUrl = config.public.supabaseUrl;
    const supabaseKey = config.public.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase URL or Key not configured in runtimeConfig");
      return { supabase: null };
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }

  return { supabase: supabaseInstance };
};
