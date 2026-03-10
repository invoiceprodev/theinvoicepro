import type React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { getAdminRoute, isAdminContext } from "@/lib/admin-routing";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = isAdminContext(location.pathname);
  const adminLoginRedirect = `${getAdminRoute("/login")}?error=unauthorized`;

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

  if (!isAuthenticated) {
    return <Navigate to={isAdminRoute ? getAdminRoute("/login") : "/login"} replace state={{ from: location }} />;
  }

  if (isAdminRoute && !canAccessAdminPortal(user?.role)) {
    return <Navigate to={adminLoginRedirect} replace />;
  }

  return <>{children}</>;
};
