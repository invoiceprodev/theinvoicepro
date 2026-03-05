import type { AuthProvider } from "@refinedev/core";
import { supabase } from "@/lib/supabase";

const CUSTOMER_DEMO_EMAIL = "demo@theinvoicepro.co.za";
const CUSTOMER_DEMO_PASSWORD = "Demo@123";
const CUSTOMER_DEMO_FLAG = "customer_demo_mode";

// Helper function to parse Supabase auth errors
const parseAuthError = (error: any) => {
  const message = error.message || "";

  // Email not confirmed
  if (message.includes("Email not confirmed") || message.includes("email_not_confirmed")) {
    return {
      name: "EmailNotConfirmed",
      message: "Please confirm your email address before logging in. Check your inbox for the confirmation link.",
    };
  }

  // Invalid credentials
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return {
      name: "InvalidCredentials",
      message: "Invalid email or password. Please check your credentials and try again.",
    };
  }

  // User already exists
  if (message.includes("User already registered") || message.includes("already_registered")) {
    return {
      name: "UserExists",
      message: "An account with this email already exists. Please login instead.",
    };
  }

  // Too many requests
  if (message.includes("too many requests") || message.includes("rate_limit")) {
    return {
      name: "RateLimitError",
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  // Default error
  return {
    name: "AuthError",
    message: message || "An authentication error occurred. Please try again.",
  };
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      console.log("[Auth] Attempting login for:", email);

      // Demo credentials shortcut — bypass Supabase
      if (email === CUSTOMER_DEMO_EMAIL && password === CUSTOMER_DEMO_PASSWORD) {
        localStorage.setItem(CUSTOMER_DEMO_FLAG, "true");
        return {
          success: true,
          redirectTo: "/dashboard",
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Login error:", error);
        const parsedError = parseAuthError(error);
        return {
          success: false,
          error: parsedError,
        };
      }

      if (data.user) {
        console.log("[Auth] Login successful for user:", data.user.id);
        return {
          success: true,
          redirectTo: "/dashboard",
        };
      }

      console.error("[Auth] Login failed: No user data returned");
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Login failed",
        },
      };
    } catch (error: any) {
      console.error("[Auth] Unexpected login error:", error);
      const parsedError = parseAuthError(error);
      return {
        success: false,
        error: parsedError,
      };
    }
  },

  register: async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      });

      if (error) {
        const parsedError = parseAuthError(error);
        return {
          success: false,
          error: parsedError,
        };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is logged in immediately (email confirmation disabled)
          // Redirect to card collection step for trial setup
          return {
            success: true,
            redirectTo: `/auth/card-setup?user_id=${data.user.id}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`,
          };
        } else {
          // Email confirmation required
          return {
            success: true,
            redirectTo: "/login",
            successNotification: {
              message: "Registration successful! Please check your email to verify your account.",
              type: "success",
            },
          };
        }
      }

      return {
        success: false,
        error: {
          name: "RegisterError",
          message: "Registration failed",
        },
      };
    } catch (error: any) {
      const parsedError = parseAuthError(error);
      return {
        success: false,
        error: parsedError,
      };
    }
  },

  logout: async () => {
    try {
      // Clear demo flag if set
      if (localStorage.getItem(CUSTOMER_DEMO_FLAG)) {
        localStorage.removeItem(CUSTOMER_DEMO_FLAG);
        return {
          success: true,
          redirectTo: "/login",
        };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            name: "LogoutError",
            message: error.message || "Logout failed",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "LogoutError",
          message: error.message || "An unexpected error occurred",
        },
      };
    }
  },

  check: async () => {
    try {
      // Allow demo mode session
      if (localStorage.getItem(CUSTOMER_DEMO_FLAG) === "true") {
        return { authenticated: true };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        return {
          authenticated: true,
        };
      }

      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    } catch (error: any) {
      console.error("[Auth] Check error:", error);
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
        error: {
          name: "AuthCheckError",
          message: error.message || "Authentication check failed",
        },
      };
    }
  },

  getPermissions: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch user role from profiles table
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

        return profile?.role || "user";
      }

      return null;
    } catch (error) {
      console.error("[Auth] Error getting permissions:", error);
      return null;
    }
  },

  getIdentity: async () => {
    try {
      // Return demo identity
      if (localStorage.getItem(CUSTOMER_DEMO_FLAG) === "true") {
        return {
          id: "demo-user",
          name: "Demo Business",
          email: CUSTOMER_DEMO_EMAIL,
          role: "user",
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch full profile information
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", user.id)
          .single();

        return {
          id: user.id,
          name: profile?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          email: user.email,
          role: profile?.role || "user",
        };
      }

      return null;
    } catch (error) {
      console.error("[Auth] Error getting identity:", error);
      return null;
    }
  },

  onError: async (error) => {
    console.error("Auth error:", error);
    return { error };
  },
};

// Utility function to resend confirmation email (can be called from components)
export const resendConfirmationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Confirmation email sent! Please check your inbox.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to resend confirmation email",
    };
  }
};
