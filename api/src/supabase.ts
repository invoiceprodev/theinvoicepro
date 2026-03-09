import { createClient } from "@supabase/supabase-js";
import { apiConfig } from "./config.js";

export const adminSupabase = createClient(apiConfig.supabaseUrl, apiConfig.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
