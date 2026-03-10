import { useMemo, useState } from "react";
import { useLogin } from "@refinedev/core";
import { Link, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const isInternalMode = import.meta.env.VITE_AUTH_MODE === "internal";

export const AdminLoginPage = () => {
  const { mutate: login, error: loginError } = useLogin<LoginFormValues & { password?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const unauthorized = useMemo(() => new URLSearchParams(location.search).get("error") === "unauthorized", [location.search]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      login(values);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-9 h-9 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              InvoicePro <span className="text-purple-400">Admin</span>
            </span>
          </div>
          <p className="text-sm text-slate-400">Restricted access for authorised administrators</p>
        </div>

        {isInternalMode && (
          <Alert className="border-amber-500/60 bg-amber-500/10 text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-amber-300 font-semibold">Restricted Access</AlertTitle>
            <AlertDescription className="text-amber-400/90">
              This is a restricted admin portal. Unauthorized access is prohibited.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-2xl border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials to access the admin portal</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {unauthorized && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Admin access required</AlertTitle>
                <AlertDescription>This account does not have admin access for this portal.</AlertDescription>
              </Alert>
            )}

            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{(loginError as any).message || "Unable to start admin login."}</AlertDescription>
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
                  {isLoading ? "Signing in..." : "Login"}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  Secure sign-in continues automatically after you submit.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">Authorised personnel only</p>
        <div className="text-center text-sm text-slate-400">
          Need an admin account?{" "}
          <Link to="/admin/register" className="text-purple-300 font-semibold hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
