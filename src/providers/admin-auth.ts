import type { AuthProvider } from "@refinedev/core";
import { supabase } from "@/lib/supabase";

const DEMO_EMAIL = "admin@theinvoicepro.co.za";
const DEMO_PASSWORD = "Admin@123";
const DEMO_FLAG = "admin_demo_mode";

export const adminAuthProvider: AuthProvider = {
  login: async ({ email, password }) => {
    // Demo credentials shortcut
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem(DEMO_FLAG, "true");
      return { success: true, redirectTo: "/admin/dashboard" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: { name: "LoginError", message: error.message } };
    }
    if (data.user) {
      return { success: true, redirectTo: "/admin/dashboard" };
    }
    return { success: false, error: { name: "LoginError", message: "Login failed" } };
  },

  logout: async () => {
    localStorage.removeItem(DEMO_FLAG);
    await supabase.auth.signOut();
    return { success: true, redirectTo: "/admin/login" };
  },

  check: async () => {
    if (localStorage.getItem(DEMO_FLAG) === "true") {
      return { authenticated: true };
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: "/admin/login", logout: true };
  },

  getPermissions: async () => {
    if (localStorage.getItem(DEMO_FLAG) === "true") return "admin";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      return profile?.role || "user";
    }
    return null;
  },

  getIdentity: async () => {
    if (localStorage.getItem(DEMO_FLAG) === "true") {
      return { id: "demo-admin", name: "Demo Admin", email: DEMO_EMAIL, role: "admin" };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();
      return {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
        email: user.email,
        role: profile?.role || "user",
      };
    }
    return null;
  },

  onError: async (error) => {
    return { error };
  },
};
