import { createClient } from "@refinedev/supabase";

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : undefined);
const supabaseKey =
  import.meta.env.VITE_SUPABASE_API_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase URL. Set VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID in your .env file.",
  );
}

if (!supabaseKey) {
  throw new Error(
    "Missing Supabase API key. Set VITE_SUPABASE_API_KEY or VITE_SUPABASE_ANON_KEY in your .env file.",
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
  },
});

// Export with both names for consistency across codebase
export const supabase = supabaseClient;
