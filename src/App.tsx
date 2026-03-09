import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router";
import { Layout } from "@/components/refine-ui/layout/layout";
import { dataProvider } from "@/providers/data";
import { authProvider } from "@/providers/auth";
import { adminAuthProvider } from "@/providers/admin-auth";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { RefineAiErrorComponent } from "@/components/catch-all";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { AppAuth0Provider } from "@/components/auth0-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { LayoutDashboard, FileText, Users, CreditCard, Home, ShieldCheck, Settings, Layers } from "lucide-react";

// Customer app pages
import { LandingPage } from "@/pages/landing/index";
import { DashboardPage } from "@/pages/dashboard/index";
import { InvoiceListPage } from "@/pages/dashboard/invoices/list";
import { InvoiceCreatePage } from "@/pages/dashboard/invoices/create";
import { InvoiceShowPage } from "@/pages/dashboard/invoices/show";
import { InvoiceEditPage } from "@/pages/dashboard/invoices/edit";
import { ClientListPage } from "@/pages/dashboard/clients/list";
import { ClientCreatePage } from "@/pages/dashboard/clients/create";
import { ClientEditPage } from "@/pages/dashboard/clients/edit";
import { PlansPage } from "@/pages/dashboard/plans/index";
import { ExpenseListPage } from "@/pages/dashboard/expenses/list";
import { ExpenseCreatePage } from "@/pages/dashboard/expenses/create";
import { ExpenseEditPage } from "@/pages/dashboard/expenses/edit";
import { ExpenseShowPage } from "@/pages/dashboard/expenses/show";
import { CompliancePage } from "@/pages/dashboard/compliance/index";
import { SettingsPage } from "@/pages/dashboard/settings/index";
import { LoginPage } from "@/pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { VerifyEmailPage } from "@/pages/auth/verify-email";
import { CardSetupPage } from "@/pages/auth/card-setup";
import CardSetupSuccess from "./pages/auth/card-setup-success";
import { AuthCallbackPage, PublicOnlyRoute } from "@/pages/auth/callback";
import { PricingPage } from "@/pages/services/pricing";
import { SignupPage } from "@/pages/services/signup";

// Admin app pages
import { AdminDashboard } from "@/pages/admin/index";
import PlanListPage from "@/pages/admin/plans/list";
import CreatePlanPage from "@/pages/admin/plans/create";
import EditPlanPage from "@/pages/admin/plans/edit";
import SubscriptionListPage from "@/pages/admin/subscriptions/list";
import { AdminLoginPage } from "@/pages/admin/login";
import { AdminRegisterPage } from "@/pages/admin/register";
import { TenantListPage } from "@/pages/admin/tenants/list";
import TenantShowPage from "@/pages/admin/tenants/show";
import AdminSettingsPage from "@/pages/admin/settings/index";

// ─── Admin App ────────────────────────────────────────────────────────────────
function AdminApp() {
  return (
    <ThemeProvider forcedTheme="light">
      <AuthProvider>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={adminAuthProvider}
          notificationProvider={useNotificationProvider}
          options={{
            title: {
              text: "InvoicePro Admin",
              icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
            },
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
          resources={[
            {
              name: "dashboard",
              list: "/admin/dashboard",
              meta: {
                label: "Dashboard",
                icon: <LayoutDashboard />,
              },
            },
            {
              name: "tiers",
              list: "/admin/tiers",
              create: "/admin/tiers/create",
              edit: "/admin/tiers/:id/edit",
              meta: {
                label: "Pricing Tiers",
                icon: <Layers />,
              },
            },
            {
              name: "subscriptions",
              list: "/admin/subscriptions",
              meta: {
                label: "Subscriptions",
                icon: <CreditCard />,
              },
            },
            {
              name: "tenants",
              list: "/admin/tenants",
              show: "/admin/tenants/:id",
              edit: "/admin/tenants/:id/edit",
              meta: {
                label: "Tenants",
                icon: <Users />,
              },
            },
            {
              name: "settings",
              list: "/admin/settings",
              meta: {
                label: "Settings",
                icon: <Settings />,
              },
            },
          ]}>
          <Routes>
            {/* Admin root redirects */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            {/* Admin Public Route */}
            <Route
              path="/admin/login"
              element={
                <PublicOnlyRoute>
                  <AdminLoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/admin/register"
              element={
                <PublicOnlyRoute>
                  <AdminRegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/admin/callback" element={<AuthCallbackPage />} />

            {/* Admin Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
              }>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/tiers" element={<PlanListPage />} />
              <Route path="/admin/tiers/create" element={<CreatePlanPage />} />
              <Route path="/admin/tiers/:id/edit" element={<EditPlanPage />} />
              <Route path="/admin/subscriptions" element={<SubscriptionListPage />} />
              <Route path="/admin/tenants" element={<TenantListPage />} />
              <Route path="/admin/tenants/:id" element={<TenantShowPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/admin/*" element={<RefineAiErrorComponent />} />
          </Routes>
          <Toaster />
        </Refine>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ─── Customer App ─────────────────────────────────────────────────────────────
function CustomerApp() {
  return (
    <ThemeProvider forcedTheme="light">
      <AuthProvider>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          options={{
            title: {
              text: "InvoicePro",
              icon: <FileText className="w-6 h-6" />,
            },
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
          resources={[
            {
              name: "dashboard",
              list: "/dashboard",
              meta: {
                label: "Dashboard",
                icon: <LayoutDashboard />,
              },
            },
            {
              name: "invoices",
              list: "/invoices",
              create: "/invoices/create",
              show: "/invoices/:id",
              edit: "/invoices/:id/edit",
              meta: {
                label: "Invoices",
                icon: <FileText />,
              },
            },
            {
              name: "clients",
              list: "/clients",
              create: "/clients/create",
              edit: "/clients/:id/edit",
              meta: {
                label: "Clients",
                icon: <Users />,
              },
            },
            {
              name: "plans",
              list: "/plans",
              meta: {
                label: "Plans",
                icon: <CreditCard />,
              },
            },
            {
              name: "expenses",
              list: "/expenses",
              create: "/expenses/create",
              show: "/expenses/:id",
              edit: "/expenses/:id/edit",
              meta: {
                label: "Expenses",
                icon: <CreditCard />,
              },
            },
            {
              name: "compliance",
              list: "/compliance",
              meta: {
                label: "Compliance",
                icon: <Home />,
              },
            },
            {
              name: "settings",
              list: "/settings",
              meta: {
                label: "Settings",
                icon: <Settings />,
              },
            },
          ]}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services/pricing" element={<PricingPage />} />
            <Route path="/services/signup" element={<SignupPage />} />

            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <SignupPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicOnlyRoute>
                  <SignupPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/card-setup" element={<CardSetupPage />} />
            <Route path="/auth/card-setup/success" element={<CardSetupSuccess />} />
            <Route path="/card-setup/success" element={<CardSetupSuccess />} />

            {/* Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
              }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/invoices/create" element={<InvoiceCreatePage />} />
              <Route path="/invoices/:id" element={<InvoiceShowPage />} />
              <Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />
              <Route path="/clients" element={<ClientListPage />} />
              <Route path="/clients/create" element={<ClientCreatePage />} />
              <Route path="/clients/:id/edit" element={<ClientEditPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/expenses" element={<ExpenseListPage />} />
              <Route path="/expenses/create" element={<ExpenseCreatePage />} />
              <Route path="/expenses/:id" element={<ExpenseShowPage />} />
              <Route path="/expenses/:id/edit" element={<ExpenseEditPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<RefineAiErrorComponent />} />
          </Routes>
          <Toaster />
        </Refine>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ─── Path-based Router ────────────────────────────────────────────────────────
function AppRouter() {
  const location = useLocation();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isAdminDomain = hostname === "admin.theinvoicepro.co.za";
  const isAdmin = isAdminDomain || location.pathname.startsWith("/admin");
  return <AppAuth0Provider appKind={isAdmin ? "admin" : "customer"}>{isAdmin ? <AdminApp /> : <CustomerApp />}</AppAuth0Provider>;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
