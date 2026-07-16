import { useEffect, useMemo, useState } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { getAuth0Config, isAuth0Configured, type AuthAppKind } from "@/lib/auth0-config";
import { setAuth0BridgeSnapshot } from "@/lib/auth0-bridge";
import { isAuth0EmailVerified } from "@/lib/auth0-identity";
import { apiRequest, hasApiBaseUrl, ApiClientError } from "@/lib/api-client";
import { setProfileBridgeSnapshot } from "@/lib/profile-bridge";
import { setSubscriptionBridgeSnapshot } from "@/lib/subscription-bridge";
import { clearPendingAuthHandoff, getPendingAuthHandoff } from "@/lib/auth0-handoff";
import type { Profile, Subscription } from "@/types";
import { shouldBypassEmailVerification } from "@/lib/customer-email-bypass";

function Auth0BridgeSync({ appKind }: { appKind: AuthAppKind }) {
  const { isLoading, isAuthenticated, user, error, loginWithRedirect, logout, getAccessTokenSilently, getIdTokenClaims } = useAuth0();
  const [resolvedEmailVerified, setResolvedEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveEmailVerification() {
      if (!isAuthenticated || !user?.email) {
        setResolvedEmailVerified(null);
        return;
      }

      if (isAuth0EmailVerified(user)) {
        setResolvedEmailVerified(true);
        return;
      }

      setResolvedEmailVerified(null);

      try {
        await getAccessTokenSilently({ cacheMode: "off" });
        const claims = await getIdTokenClaims();
        const emailVerified = claims?.email_verified === true;
        if (!cancelled) {
          setResolvedEmailVerified(emailVerified);
        }
      } catch {
        if (!cancelled) {
          setResolvedEmailVerified(false);
        }
      }
    }

    void resolveEmailVerification();

    return () => {
      cancelled = true;
    };
  }, [getAccessTokenSilently, getIdTokenClaims, isAuthenticated, user]);

  const waitingOnEmailVerificationRefresh = useMemo(
    () => isAuthenticated && !!user?.email && !isAuth0EmailVerified(user) && resolvedEmailVerified === null,
    [isAuthenticated, resolvedEmailVerified, user],
  );

  const requiresEmailVerification =
    isAuthenticated &&
    !!user?.email &&
    resolvedEmailVerified === false &&
    !shouldBypassEmailVerification(appKind);

  useEffect(() => {
    setAuth0BridgeSnapshot({
      isLoading: isLoading || waitingOnEmailVerificationRefresh,
      isAuthenticated,
      user,
      error: error ? new Error(error.message) : undefined,
      requiresEmailVerification,
      verificationEmail: user?.email,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
    });
  }, [
    appKind,
    error,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    requiresEmailVerification,
    user,
    waitingOnEmailVerificationRefresh,
  ]);

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

        let syncProfile: Profile | null = null;
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const syncResponse = await apiRequest<{ profile: Profile; created: boolean }>("/auth/sync-profile", {
              method: "POST",
              body: JSON.stringify({
                email: handoff?.email ?? user.email ?? null,
                fullName: handoff?.fullName ?? user.name ?? user.nickname ?? user.email ?? "User",
                mode: handoff?.mode ?? "login",
              }),
            });
            // Use the profile returned by sync immediately — avoids an extra /me round-trip
            syncProfile = syncResponse.profile ?? null;
            break;
          } catch (err) {
            const isClientError =
              err instanceof ApiClientError && err.status >= 400 && err.status < 500;
            if (isClientError || attempt === maxAttempts) {
              throw err;
            }
            console.warn(
              `[Auth0] profile sync attempt ${attempt} failed, retrying in ${attempt}s…`,
              err,
            );
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }

        // Run /me and /subscription/current in parallel to cut one RTT from the critical path
        const [meResponse, subscriptionResponse] = await Promise.all([
          syncProfile
            ? Promise.resolve({ profile: syncProfile, auth0: user as Record<string, unknown> })
            : apiRequest<{ profile: Profile | null; auth0: Record<string, unknown> }>("/me"),
          appKind !== "admin"
            ? apiRequest<{ data: Subscription | null }>("/subscription/current")
            : Promise.resolve({ data: null }),
        ]);

        if (cancelled) return;

        clearPendingAuthHandoff();

        setProfileBridgeSnapshot({
          isLoading: false,
          profile: meResponse.profile,
          auth0User: meResponse.auth0,
        });
        setSubscriptionBridgeSnapshot({
          isLoading: false,
          subscription: subscriptionResponse.data,
        });
      } catch (syncError) {
        const isTimeout =
          syncError instanceof DOMException && syncError.name === "TimeoutError";
        const isNetworkError =
          syncError instanceof TypeError && syncError.message.toLowerCase().includes("fetch");
        if (isTimeout || isNetworkError) {
          console.error(
            "[Auth0] profile sync failed — API server is unreachable. Check that VITE_API_URL is set correctly and the API is running.",
            syncError,
          );
        } else {
          console.error("[Auth0] profile sync failed", syncError);
        }
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
  }, [appKind, getAccessTokenSilently, isAuthenticated, requiresEmailVerification, user]);

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
      useRefreshTokensFallback
      authorizationParams={{
        audience: auth0Config.audience,
        scope: "openid profile email offline_access",
        redirect_uri: auth0Config.redirectUri,
      }}
      onRedirectCallback={(appState) => {
        const target = typeof appState?.returnTo === "string" ? appState.returnTo : "/";
        window.history.replaceState({}, document.title, target);
      }}>
      <Auth0BridgeSync appKind={appKind} />
      {children}
    </Auth0Provider>
  );
}
