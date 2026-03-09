import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { hasSelectedPlanCheckout } from "@/lib/plan-selection";

export function AuthCallbackPage() {
  const { user, isAuthenticated, loading, requiresEmailVerification, verificationEmail } = useAuth();
  const location = useLocation();
  const isAdminCallback = location.pathname.startsWith("/admin");

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
    return <Navigate to={`/verify-email?${params.toString()}`} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={isAdminCallback ? "/admin/login" : "/login"} replace />;
  }

  if (isAdminCallback && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAdminCallback && hasSelectedPlanCheckout()) {
    return <Navigate to="/auth/card-setup" replace />;
  }

  return <Navigate to={isAdminCallback ? "/admin/dashboard" : "/dashboard"} replace />;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

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
    if (isAdminRoute && user?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
