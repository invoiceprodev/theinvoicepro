import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabaseClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch user profile from profiles table
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    try {
      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", supabaseUser.id)
        .single();

      if (error) throw error;

      return {
        id: supabaseUser.id,
        name: profile?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email!,
        role: profile?.role || "user",
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to basic user info if profile fetch fails
      return {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "User",
        email: supabaseUser.email!,
        role: "user",
      };
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event: any, session) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Login function
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const userProfile = await fetchUserProfile(data.user);
          setUser(userProfile);
        }
      } catch (error: any) {
        console.error("Login error:", error);
        throw new Error(error.message || "Failed to login. Please check your credentials.");
      }
    },
    [fetchUserProfile],
  );

  // Signup function
  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
            },
          },
        });

        if (error) throw error;

        // Note: Depending on Supabase email confirmation settings,
        // the user might need to verify their email before logging in
        if (data.user) {
          // If email confirmation is disabled, we can set the user immediately
          if (data.session) {
            const userProfile = await fetchUserProfile(data.user);
            setUser(userProfile);
          }
        }
      } catch (error: any) {
        console.error("Signup error:", error);
        throw new Error(error.message || "Failed to create account. Please try again.");
      }
    },
    [fetchUserProfile],
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw new Error(error.message || "Failed to logout.");
    }
  }, []);

  // Compute isAuthenticated
  const isAuthenticated = user !== null;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
