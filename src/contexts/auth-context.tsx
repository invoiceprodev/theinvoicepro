import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth0BridgeSnapshot, subscribeAuth0Bridge } from "@/lib/auth0-bridge";
import { getAppIdentityFromUser } from "@/lib/auth0-identity";
import { getProfileBridgeSnapshot, subscribeProfileBridge } from "@/lib/profile-bridge";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  verificationEmail?: string;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState(getAuth0BridgeSnapshot());
  const [profileSnapshot, setProfileSnapshot] = useState(getProfileBridgeSnapshot());

  useEffect(() => subscribeAuth0Bridge(setSnapshot), []);
  useEffect(() => subscribeProfileBridge(setProfileSnapshot), []);

  const user = useMemo(() => {
    if (profileSnapshot.profile) {
      return {
        id: profileSnapshot.profile.id,
        name:
          profileSnapshot.profile.full_name ||
          snapshot.user?.name ||
          snapshot.user?.nickname ||
          snapshot.user?.email ||
          "User",
        email: snapshot.user?.email,
        role: profileSnapshot.profile.role,
      };
    }

    return getAppIdentityFromUser(snapshot.user);
  }, [profileSnapshot.profile, snapshot.user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: snapshot.isAuthenticated && !snapshot.requiresEmailVerification,
    requiresEmailVerification: Boolean(snapshot.requiresEmailVerification),
    verificationEmail: snapshot.verificationEmail,
    loading: snapshot.isLoading || profileSnapshot.isLoading,
    login: async () => {
      await snapshot.loginWithRedirect?.({
        appState: { returnTo: "/dashboard" },
      });
    },
    signup: async () => {
      await snapshot.loginWithRedirect?.({
        appState: { returnTo: "/dashboard" },
        authorizationParams: {
          screen_hint: "signup",
        },
      });
    },
    logout: async () => {
      snapshot.logout?.({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
