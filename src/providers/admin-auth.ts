import type { AuthProvider } from "@refinedev/core";
import { getAuth0BridgeSnapshot } from "@/lib/auth0-bridge";
import { getAppIdentityFromUser, getAppRoleFromUser } from "@/lib/auth0-identity";
import { getProfileBridgeSnapshot } from "@/lib/profile-bridge";
import { setPendingAuthHandoff } from "@/lib/auth0-handoff";
import { signupWithAuth0Database } from "@/lib/auth0-db";
import { canAccessAdminPortal, getEffectiveAdminRole } from "@/lib/admin-access";
import { getAdminRoute } from "@/lib/admin-routing";

async function beginAdminAuthFlow(email?: string) {
  const current = getAuth0BridgeSnapshot();
  if (!current.loginWithRedirect) {
    return {
      success: false,
      error: {
        name: "Auth0NotConfigured",
        message: "Auth0 is not configured or has not finished loading.",
      },
    };
  }

  setPendingAuthHandoff({
    mode: "admin-login",
    email,
    returnTo: getAdminRoute("/dashboard"),
  });

  await current.loginWithRedirect({
    appState: { returnTo: getAdminRoute("/dashboard") },
    authorizationParams: {
      login_hint: email || undefined,
    },
  });

  return { success: true };
}

export const adminAuthProvider: AuthProvider = {
  login: async ({ email, password }) => {
    void password;
    return beginAdminAuthFlow(email);
  },

  register: async ({ email, name, password }) => {
    if (!email || !name || !password) {
      return {
        success: false,
        error: {
          name: "ValidationError",
          message: "Name, email, and password are required to create an admin account.",
        },
      };
    }

    try {
      await signupWithAuth0Database({
        appKind: "admin",
        email,
        name,
        username: email,
        password,
      });

      return {
        success: true,
        redirectTo: `/verify-email?email=${encodeURIComponent(email)}&next=admin`,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  },

  logout: async () => {
    const current = getAuth0BridgeSnapshot();
    current.logout?.({
      logoutParams: {
        returnTo: `${window.location.origin}${getAdminRoute("/login")}`,
      },
    });

    return { success: true, redirectTo: getAdminRoute("/login") };
  },

  check: async () => {
    const current = getAuth0BridgeSnapshot();
    const role = getAppRoleFromUser(current.user);

    if (current.isLoading) {
      return { authenticated: false };
    }

    if (current.requiresEmailVerification) {
      const email = encodeURIComponent(current.verificationEmail || "");
      return {
        authenticated: false,
        redirectTo: email ? `${getAdminRoute("/verify-email")}?email=${email}&next=admin` : `${getAdminRoute("/verify-email")}?next=admin`,
      };
    }

    if (current.isAuthenticated && canAccessAdminPortal(role)) {
      return { authenticated: true };
    }

    return { authenticated: false, redirectTo: getAdminRoute("/login"), logout: true };
  },

  getPermissions: async () => {
    const profileSnapshot = getProfileBridgeSnapshot();
    if (profileSnapshot.profile?.role) return getEffectiveAdminRole(profileSnapshot.profile.role);
    const current = getAuth0BridgeSnapshot();
    return getEffectiveAdminRole(getAppRoleFromUser(current.user));
  },

  getIdentity: async () => {
    const profileSnapshot = getProfileBridgeSnapshot();
    if (profileSnapshot.profile) {
      const current = getAuth0BridgeSnapshot();
      return {
        id: profileSnapshot.profile.id,
        name:
          profileSnapshot.profile.full_name ||
          current.user?.name ||
          current.user?.nickname ||
          current.user?.email ||
          "Admin",
        email: current.user?.email,
        role: getEffectiveAdminRole(profileSnapshot.profile.role),
      };
    }

    const current = getAuth0BridgeSnapshot();
    const identity = getAppIdentityFromUser(current.user);
    return identity ? { ...identity, role: getEffectiveAdminRole(identity.role) } : null;
  },

  onError: async (error) => {
    return { error };
  },
};
