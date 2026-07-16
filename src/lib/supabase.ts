import { createClient } from "@refinedev/supabase";

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : "");
const supabaseKey =
  import.meta.env.VITE_SUPABASE_API_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: "public",
      },
      auth: {
        persistSession: true,
      },
    })
  : null;

export const supabase = supabaseClient;
