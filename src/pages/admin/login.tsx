import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { ShieldCheck, AlertTriangle, AlertCircle, KeyRound } from "lucide-react";

const DEMO_EMAIL = "admin@theinvoicepro.co.za";
const DEMO_PASSWORD = "Admin@123";
const DEMO_FLAG = "admin_demo_mode";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const isInternalMode = import.meta.env.VITE_AUTH_MODE === "internal";

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleUseDemoCredentials = () => {
    form.setValue("email", DEMO_EMAIL, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      // Demo credentials shortcut — bypass Supabase
      if (values.email === DEMO_EMAIL && values.password === DEMO_PASSWORD) {
        localStorage.setItem(DEMO_FLAG, "true");
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        const msg = error.message || "";
        if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
          setLoginError("Invalid email or password. Please check your credentials and try again.");
        } else if (msg.includes("Email not confirmed") || msg.includes("email_not_confirmed")) {
          setLoginError("Please confirm your email address before logging in.");
        } else {
          setLoginError(msg || "Login failed. Please try again.");
        }
        return;
      }

      if (data.user) {
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-9 h-9 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              InvoicePro <span className="text-purple-400">Admin</span>
            </span>
          </div>
          <p className="text-sm text-slate-400">Platform Administration Portal</p>
        </div>

        {/* Restricted access banner (shown when VITE_AUTH_MODE=internal) */}
        {isInternalMode && (
          <Alert className="border-amber-500/60 bg-amber-500/10 text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-300 font-semibold">Restricted Access</AlertTitle>
            <AlertDescription className="text-amber-400/90">
              This is a restricted admin portal. Unauthorized access is prohibited. All login attempts are monitored and
              logged.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="shadow-2xl border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Alert */}
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                          disabled={isLoading}
                          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Password</FormLabel>
                      <FormControl>
                        <InputPassword
                          {...field}
                          disabled={isLoading}
                          placeholder="Enter your password"
                          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                  disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials Hint */}
            <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-purple-300">Demo Admin Access</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16 shrink-0">Email</span>
                  <span className="text-purple-200">{DEMO_EMAIL}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-16 shrink-0">Password</span>
                  <span className="text-purple-200">{DEMO_PASSWORD}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseDemoCredentials}
                className="w-full border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/60 text-xs">
                Use Demo Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">Authorised personnel only · All activity is logged</p>
      </div>
    </div>
  );
};
