import { createClient } from "@refinedev/supabase";

const supabaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

if (!import.meta.env.VITE_SUPABASE_PROJECT_ID) {
  throw new Error("Missing VITE_SUPABASE_PROJECT_ID. Please check your .env file.");
}

if (!supabaseKey) {
  throw new Error("Missing VITE_SUPABASE_API_KEY. Please check your .env file.");
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
