import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { getSelectedPlanCheckout, hasSelectedPlanCheckout } from "@/lib/plan-selection";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { canStartTrialWithoutCard } from "@/lib/trial-bypass";
import { getAdminRoute, isAdminContext } from "@/lib/admin-routing";

function buildAdminLoginRedirect(reason?: string) {
  const params = new URLSearchParams();
  if (reason) params.set("error", reason);
  const query = params.toString();
  const base = getAdminRoute("/login");
  return query ? `${base}?${query}` : base;
}

export function AuthCallbackPage() {
  const { user, isAuthenticated, loading, requiresEmailVerification, verificationEmail } = useAuth();
  const location = useLocation();
  const isAdminCallback = isAdminContext(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Completing sign in</h1>
          <p className="text-sm text-muted-foreground">We are preparing your account.</p>
        </div>
      </div>
    );
  }

  if (requiresEmailVerification) {
    const params = new URLSearchParams();
    if (verificationEmail) params.set("email", verificationEmail);
    if (isAdminCallback) params.set("next", "admin");
    return <Navigate to={`${isAdminCallback ? getAdminRoute("/verify-email") : "/verify-email"}?${params.toString()}`} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={isAdminCallback ? getAdminRoute("/login") : "/login"} replace />;
  }

  if (isAdminCallback && !canAccessAdminPortal(user?.role)) {
    return <Navigate to={buildAdminLoginRedirect("unauthorized")} replace />;
  }

  if (!isAdminCallback && hasSelectedPlanCheckout()) {
    const selectedPlan = getSelectedPlanCheckout();
    return <Navigate to={canStartTrialWithoutCard(selectedPlan) ? "/plans" : "/auth/card-setup"} replace />;
  }

  return <Navigate to={isAdminCallback ? getAdminRoute("/dashboard") : "/dashboard"} replace />;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = isAdminContext(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Loading your session</h1>
          <p className="text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isAdminRoute && canAccessAdminPortal(user?.role)) {
      return <Navigate to={getAdminRoute("/dashboard")} replace />;
    }

    if (isAdminRoute) {
      return <Navigate to={buildAdminLoginRedirect("unauthorized")} replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
