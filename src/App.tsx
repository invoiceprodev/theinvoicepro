import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  Navigate,
} from "react-router";
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
import { BrandingFaviconSync } from "@/components/branding-favicon-sync";
import { SeoManager } from "@/components/seo-manager";
import { ProtectedRoute } from "@/components/protected-route";
import {
  getAdminRoute,
  isAdminContext,
  isAdminHostname,
  stripAdminPrefix,
} from "@/lib/admin-routing";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Home,
  ShieldCheck,
  Settings,
  Layers,
} from "lucide-react";

import { lazy, Suspense } from "react";
import { PublicOnlyRoute } from "@/pages/auth/callback";

// Customer app pages
const LandingPage = lazy(() => import("@/pages/landing/index").then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import("@/pages/dashboard/index").then(m => ({ default: m.DashboardPage })));
const InvoiceListPage = lazy(() => import("@/pages/dashboard/invoices/list").then(m => ({ default: m.InvoiceListPage })));
const InvoiceCreatePage = lazy(() => import("@/pages/dashboard/invoices/create").then(m => ({ default: m.InvoiceCreatePage })));
const InvoiceShowPage = lazy(() => import("@/pages/dashboard/invoices/show").then(m => ({ default: m.InvoiceShowPage })));
const InvoiceEditPage = lazy(() => import("@/pages/dashboard/invoices/edit").then(m => ({ default: m.InvoiceEditPage })));
const ClientListPage = lazy(() => import("@/pages/dashboard/clients/list").then(m => ({ default: m.ClientListPage })));
const ClientCreatePage = lazy(() => import("@/pages/dashboard/clients/create").then(m => ({ default: m.ClientCreatePage })));
const ClientEditPage = lazy(() => import("@/pages/dashboard/clients/edit").then(m => ({ default: m.ClientEditPage })));
const PlansPage = lazy(() => import("@/pages/dashboard/plans/index").then(m => ({ default: m.PlansPage })));
const ExpenseListPage = lazy(() => import("@/pages/dashboard/expenses/list").then(m => ({ default: m.ExpenseListPage })));
const ExpenseCreatePage = lazy(() => import("@/pages/dashboard/expenses/create").then(m => ({ default: m.ExpenseCreatePage })));
const ExpenseEditPage = lazy(() => import("@/pages/dashboard/expenses/edit").then(m => ({ default: m.ExpenseEditPage })));
const ExpenseShowPage = lazy(() => import("@/pages/dashboard/expenses/show").then(m => ({ default: m.ExpenseShowPage })));
const ContractListPage = lazy(() => import("@/pages/dashboard/contracts/list").then(m => ({ default: m.ContractListPage })));
const ContractCreatePage = lazy(() => import("@/pages/dashboard/contracts/create").then(m => ({ default: m.ContractCreatePage })));
const ContractShowPage = lazy(() => import("@/pages/dashboard/contracts/show").then(m => ({ default: m.ContractShowPage })));
const CompliancePage = lazy(() => import("@/pages/dashboard/compliance/index").then(m => ({ default: m.CompliancePage })));
const SettingsPage = lazy(() => import("@/pages/dashboard/settings/index").then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import("@/pages/auth/login").then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password").then(m => ({ default: m.ForgotPasswordPage })));
const RegisterPage = lazy(() => import("./pages/auth/register").then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import("@/pages/auth/verify-email").then(m => ({ default: m.VerifyEmailPage })));
const CardSetupPage = lazy(() => import("@/pages/auth/card-setup").then(m => ({ default: m.CardSetupPage })));
const CardSetupSuccess = lazy(() => import("./pages/auth/card-setup-success"));
const AuthCallbackPage = lazy(() => import("@/pages/auth/callback").then(m => ({ default: m.AuthCallbackPage })));
const PricingPage = lazy(() => import("@/pages/services/pricing").then(m => ({ default: m.PricingPage })));
const SignupPage = lazy(() => import("@/pages/services/signup").then(m => ({ default: m.SignupPage })));
const AboutPage = lazy(() => import("@/pages/about/index").then(m => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import("@/pages/services/index").then(m => ({ default: m.ServicesPage })));
const BlogPage = lazy(() => import("@/pages/blog/index").then(m => ({ default: m.BlogPage })));
const BlogArticlePage = lazy(() => import("@/pages/blog/article").then(m => ({ default: m.BlogArticlePage })));
const PrivacyPolicyPage = lazy(() => import("@/pages/legal/privacy").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import("@/pages/legal/terms").then(m => ({ default: m.TermsOfServicePage })));
const RefundPolicyPage = lazy(() => import("@/pages/legal/refund-policy").then(m => ({ default: m.RefundPolicyPage })));
const CookiePolicyPage = lazy(() => import("@/pages/legal/cookie-policy").then(m => ({ default: m.CookiePolicyPage })));
const AcceptableUsePolicyPage = lazy(() => import("@/pages/legal/acceptable-use").then(m => ({ default: m.AcceptableUsePolicyPage })));

// Admin app pages
const AdminDashboard = lazy(() => import("@/pages/admin/index").then(m => ({ default: m.AdminDashboard })));
const PlanListPage = lazy(() => import("@/pages/admin/plans/list"));
const CreatePlanPage = lazy(() => import("@/pages/admin/plans/create"));
const EditPlanPage = lazy(() => import("@/pages/admin/plans/edit"));
const SubscriptionListPage = lazy(() => import("@/pages/admin/subscriptions/list"));
const AdminLoginPage = lazy(() => import("@/pages/admin/login").then(m => ({ default: m.AdminLoginPage })));
const AdminRegisterPage = lazy(() => import("@/pages/admin/register").then(m => ({ default: m.AdminRegisterPage })));
const TenantListPage = lazy(() => import("@/pages/admin/tenants/list").then(m => ({ default: m.TenantListPage })));
const TenantShowPage = lazy(() => import("@/pages/admin/tenants/show"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings/index"));

function AdminPrefixedRedirect() {
  const location = useLocation();
  const destination = `${stripAdminPrefix(location.pathname)}${
    location.search
  }${location.hash}`;
  return <Navigate to={destination} replace />;
}

// ─── Admin App ────────────────────────────────────────────────────────────────
function AdminApp({ adminHost }: { adminHost: boolean }) {
  const adminRoute = (path: string) => getAdminRoute(path, adminHost);

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
              list: adminRoute("/dashboard"),
              meta: {
                label: "Dashboard",
                icon: <LayoutDashboard />,
              },
            },
            {
              name: "tiers",
              list: adminRoute("/tiers"),
              create: adminRoute("/tiers/create"),
              edit: adminRoute("/tiers/:id/edit"),
              meta: {
                label: "Pricing Tiers",
                icon: <Layers />,
              },
            },
            {
              name: "subscriptions",
              list: adminRoute("/subscriptions"),
              meta: {
                label: "Subscriptions",
                icon: <CreditCard />,
              },
            },
            {
              name: "tenants",
              list: adminRoute("/tenants"),
              show: adminRoute("/tenants/:id"),
              edit: adminRoute("/tenants/:id/edit"),
              meta: {
                label: "Tenants",
                icon: <Users />,
              },
            },
            {
              name: "settings",
              list: adminRoute("/settings"),
              meta: {
                label: "Settings",
                icon: <Settings />,
              },
            },
          ]}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              {/* Admin root redirects */}
              <Route
                path="/"
                element={<Navigate to={adminRoute("/login")} replace />}
              />
              <Route
                path="/admin"
                element={<Navigate to={adminRoute("/login")} replace />}
              />

              {/* Admin Public Route */}
              <Route
                path={adminRoute("/login")}
                element={
                  <PublicOnlyRoute>
                    <AdminLoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={adminRoute("/register")}
                element={
                  <PublicOnlyRoute>
                    <AdminRegisterPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={adminRoute("/forgot-password")}
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage appKind="admin" />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={adminRoute("/verify-email")}
                element={<VerifyEmailPage />}
              />
              <Route
                path={adminRoute("/callback")}
                element={<AuthCallbackPage />}
              />

              {/* Admin Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route
                  path={adminRoute("/dashboard")}
                  element={<AdminDashboard />}
                />
                <Route path={adminRoute("/tiers")} element={<PlanListPage />} />
                <Route
                  path={adminRoute("/tiers/create")}
                  element={<CreatePlanPage />}
                />
                <Route
                  path={adminRoute("/tiers/:id/edit")}
                  element={<EditPlanPage />}
                />
                <Route
                  path={adminRoute("/subscriptions")}
                  element={<SubscriptionListPage />}
                />
                <Route
                  path={adminRoute("/tenants")}
                  element={<TenantListPage />}
                />
                <Route
                  path={adminRoute("/tenants/:id")}
                  element={<TenantShowPage />}
                />
                <Route
                  path={adminRoute("/settings")}
                  element={<AdminSettingsPage />}
                />
              </Route>

              {adminHost ? (
                <Route path="/admin/*" element={<AdminPrefixedRedirect />} />
              ) : null}
              <Route
                path={adminHost ? "*" : "/admin/*"}
                element={<RefineAiErrorComponent />}
              />
            </Routes>
          </Suspense>
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
              name: "quotes",
              list: "/quotes",
              create: "/quotes/create",
              show: "/quotes/:id",
              edit: "/quotes/:id/edit",
              meta: {
                label: "Quotes",
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
              name: "contracts",
              list: "/contracts",
              create: "/contracts/create",
              show: "/contracts/:id",
              meta: {
                label: "AI Contracts",
                icon: <FileText />,
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
          ]}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route
                path="/acceptable-use"
                element={<AcceptableUsePolicyPage />}
              />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogArticlePage />} />
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
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
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
              <Route
                path="/auth/card-setup/success"
                element={<CardSetupSuccess />}
              />
              <Route path="/card-setup/success" element={<CardSetupSuccess />} />

              {/* Dashboard Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/invoices" element={<InvoiceListPage />} />
                <Route path="/invoices/create" element={<InvoiceCreatePage />} />
                <Route path="/invoices/:id" element={<InvoiceShowPage />} />
                <Route path="/invoices/:id/edit" element={<InvoiceEditPage />} />
                <Route
                  path="/quotes"
                  element={<InvoiceListPage documentType="quote" />}
                />
                <Route
                  path="/quotes/create"
                  element={<InvoiceCreatePage documentType="quote" />}
                />
                <Route
                  path="/quotes/:id"
                  element={<InvoiceShowPage documentType="quote" />}
                />
                <Route
                  path="/quotes/:id/edit"
                  element={<InvoiceEditPage documentType="quote" />}
                />
                <Route path="/clients" element={<ClientListPage />} />
                <Route path="/clients/create" element={<ClientCreatePage />} />
                <Route path="/clients/:id/edit" element={<ClientEditPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/dashboard/plans" element={<PlansPage />} />
                <Route path="/expenses" element={<ExpenseListPage />} />
                <Route path="/expenses/create" element={<ExpenseCreatePage />} />
                <Route path="/expenses/:id" element={<ExpenseShowPage />} />
                <Route path="/expenses/:id/edit" element={<ExpenseEditPage />} />
                <Route path="/contracts" element={<ContractListPage />} />
                <Route
                  path="/contracts/create"
                  element={<ContractCreatePage />}
                />
                <Route path="/contracts/:id" element={<ContractShowPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<RefineAiErrorComponent />} />
            </Routes>
          </Suspense>
          <Toaster />
        </Refine>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ─── Path-based Router ────────────────────────────────────────────────────────
function DomainRedirect() {
  // Support both the apex and www customer domains without client-side
  // redirects, since the frontend can be served from either host.
  return null;
}

function AppRouter() {
  const location = useLocation();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const adminHost = isAdminHostname(hostname);
  const isAdmin = isAdminContext(location.pathname, hostname);
  return (
    <AppAuth0Provider appKind={isAdmin ? "admin" : "customer"}>
      <DomainRedirect />
      <BrandingFaviconSync />
      <SeoManager />
      {isAdmin ? <AdminApp adminHost={adminHost} /> : <CustomerApp />}
    </AppAuth0Provider>
  );
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
