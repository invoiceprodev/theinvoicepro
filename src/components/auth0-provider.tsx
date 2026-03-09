import { useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { getAuth0Config, isAuth0Configured, type AuthAppKind } from "@/lib/auth0-config";
import { setAuth0BridgeSnapshot } from "@/lib/auth0-bridge";
import { isAuth0EmailVerified } from "@/lib/auth0-identity";
import { apiRequest, hasApiBaseUrl } from "@/lib/api-client";
import { setProfileBridgeSnapshot } from "@/lib/profile-bridge";
import { setSubscriptionBridgeSnapshot } from "@/lib/subscription-bridge";
import { clearPendingAuthHandoff, getPendingAuthHandoff } from "@/lib/auth0-handoff";
import type { Profile, Subscription } from "@/types";

function Auth0BridgeSync() {
  const { isLoading, isAuthenticated, user, error, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const requiresEmailVerification = isAuthenticated && !!user?.email && !isAuth0EmailVerified(user);

  useEffect(() => {
    setAuth0BridgeSnapshot({
      isLoading,
      isAuthenticated,
      user,
      error: error ? new Error(error.message) : undefined,
      requiresEmailVerification,
      verificationEmail: user?.email,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
    });
  }, [error, getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, requiresEmailVerification, user]);

  useEffect(() => {
    let cancelled = false;

    async function syncProfile() {
      if (!hasApiBaseUrl()) {
        setProfileBridgeSnapshot({
          isLoading: false,
          profile: null,
          auth0User: user || null,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: null,
        });
        return;
      }

      if (!isAuthenticated || !user) {
        setProfileBridgeSnapshot({
          isLoading: false,
          profile: null,
          auth0User: null,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: null,
        });
        return;
      }

      if (requiresEmailVerification) {
        clearPendingAuthHandoff();
        setProfileBridgeSnapshot({
          isLoading: false,
          profile: null,
          auth0User: user,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: null,
        });
        return;
      }

      setProfileBridgeSnapshot({
        isLoading: true,
        profile: null,
        auth0User: user,
      });
      setSubscriptionBridgeSnapshot({
        isLoading: true,
        subscription: null,
      });

      try {
        const handoff = getPendingAuthHandoff();

        await apiRequest<{ profile: Profile; created: boolean }>("/auth/sync-profile", {
          method: "POST",
          body: JSON.stringify({
            email: handoff?.email ?? user.email ?? null,
            fullName: handoff?.fullName ?? user.name ?? user.nickname ?? user.email ?? "User",
            mode: handoff?.mode ?? "login",
          }),
        });
        const response = await apiRequest<{ profile: Profile | null; auth0: Record<string, unknown> }>("/me");
        const subscriptionResponse = await apiRequest<{ data: Subscription | null }>("/subscription/current");

        if (cancelled) return;

        clearPendingAuthHandoff();

        setProfileBridgeSnapshot({
          isLoading: false,
          profile: response.profile,
          auth0User: response.auth0,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: subscriptionResponse.data,
        });
      } catch (syncError) {
        console.error("[Auth0] profile sync failed", syncError);
        if (cancelled) return;
        setProfileBridgeSnapshot({
          isLoading: false,
          profile: null,
          auth0User: user,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: null,
        });
      }
    }

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, isAuthenticated, requiresEmailVerification, user]);

  return null;
}

export function AppAuth0Provider({ appKind, children }: { appKind: AuthAppKind; children: React.ReactNode }) {
  const auth0Config = getAuth0Config(appKind);

  if (!isAuth0Configured(appKind)) {
    setAuth0BridgeSnapshot({
      isLoading: false,
      isAuthenticated: false,
      requiresEmailVerification: false,
    });
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      key={appKind}
      domain={auth0Config.domain!}
      clientId={auth0Config.clientId!}
      cacheLocation="localstorage"
      useRefreshTokens
      authorizationParams={{
        audience: auth0Config.audience,
        redirect_uri: auth0Config.redirectUri,
      }}
      onRedirectCallback={(appState) => {
        const target = typeof appState?.returnTo === "string" ? appState.returnTo : "/";
        window.history.replaceState({}, document.title, target);
      }}>
      <Auth0BridgeSync />
      {children}
    </Auth0Provider>
  );
}
