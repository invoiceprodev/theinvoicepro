import type { AuthProvider } from "@refinedev/core";
import { getAuth0BridgeSnapshot } from "@/lib/auth0-bridge";
import { getAppIdentityFromUser, getAppRoleFromUser } from "@/lib/auth0-identity";
import { getProfileBridgeSnapshot } from "@/lib/profile-bridge";
import { setPendingAuthHandoff } from "@/lib/auth0-handoff";
import { signupWithAuth0Database } from "@/lib/auth0-db";
import { getSelectedPlanCheckout } from "@/lib/plan-selection";
import { canStartTrialWithoutCard } from "@/lib/trial-bypass";

async function beginCustomerAuthFlow(
  mode: "login" | "signup",
  email?: string,
  fullName?: string,
  returnTo = "/dashboard",
) {
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
    mode,
    email,
    fullName,
    returnTo,
  });

  await current.loginWithRedirect({
    appState: { returnTo },
    authorizationParams: {
      login_hint: email || undefined,
      screen_hint: mode === "signup" ? "signup" : undefined,
    },
  });

  return { success: true };
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    void password;
    const selectedPlan = getSelectedPlanCheckout();
    const returnTo = selectedPlan ? (canStartTrialWithoutCard(selectedPlan) ? "/plans" : "/auth/card-setup") : "/dashboard";
    return beginCustomerAuthFlow("login", email, undefined, returnTo);
  },

  register: async ({ email, name, password }) => {
    if (!email || !name || !password) {
      return {
        success: false,
        error: {
          name: "ValidationError",
          message: "Name, email, and password are required to create an account.",
        },
      };
    }

    try {
      await signupWithAuth0Database({
        appKind: "customer",
        email,
        name,
        username: email,
        password,
      });

      return {
        success: true,
        redirectTo: `/verify-email?${new URLSearchParams({
          email,
          ...(getSelectedPlanCheckout()?.id ? { plan: getSelectedPlanCheckout()!.id } : {}),
        }).toString()}`,
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
        returnTo: window.location.origin,
      },
    });

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const current = getAuth0BridgeSnapshot();

    if (current.isLoading) {
      return { authenticated: false };
    }

    if (current.requiresEmailVerification) {
      const email = encodeURIComponent(current.verificationEmail || "");
      return {
        authenticated: false,
        redirectTo: email ? `/verify-email?email=${email}` : "/verify-email",
      };
    }

    if (current.isAuthenticated) {
      return { authenticated: true };
    }

    return {
      authenticated: false,
      redirectTo: "/login",
      logout: true,
    };
  },

  getPermissions: async () => {
    const profileSnapshot = getProfileBridgeSnapshot();
    if (profileSnapshot.profile?.role) {
      return profileSnapshot.profile.role;
    }

    const current = getAuth0BridgeSnapshot();
    return getAppRoleFromUser(current.user);
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
          "User",
        email: current.user?.email,
        role: profileSnapshot.profile.role,
      };
    }

    const current = getAuth0BridgeSnapshot();
    return getAppIdentityFromUser(current.user);
  },

  onError: async (error) => {
    return { error };
  },
};

export const resendConfirmationEmail = async () => {
  return {
    success: false,
    error: "Email confirmation is handled by Auth0. Enable Auth0 email verification for the app and use its verification email flow.",
  };
};
