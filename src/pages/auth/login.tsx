import { useLogin } from "@refinedev/core";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertCircle, Mail, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { resendConfirmationEmail } from "@/providers/auth";
import { useState } from "react";
import { useNavigate } from "react-router";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_EMAIL = "demo@theinvoicepro.co.za";
const DEMO_PASSWORD = "Demo@123";

export const LoginPage = () => {
  const { mutate: login, error: loginError } = useLogin<LoginFormValues>();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();

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

  const onSubmit = (values: LoginFormValues) => {
    setResendSuccess(false);
    login(values);
  };

  const handleResendConfirmation = async () => {
    const email = form.getValues("email");
    if (!email) {
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);

    const result = await resendConfirmationEmail(email);

    setResendLoading(false);

    if (result.success) {
      setResendSuccess(true);
    }
  };

  const isLoading = form.formState.isSubmitting;
  const isEmailNotConfirmed = loginError && (loginError as any).name === "EmailNotConfirmed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">InvoicePro</span>
          </div>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your email and password to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {loginError && (
              <Alert variant={isEmailNotConfirmed ? "default" : "destructive"} className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{isEmailNotConfirmed ? "Email Not Confirmed" : "Login Failed"}</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>{(loginError as any).message}</p>
                  {isEmailNotConfirmed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading || resendSuccess}
                      className="mt-2 w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      {resendLoading ? "Sending..." : resendSuccess ? "Email Sent!" : "Resend Confirmation Email"}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert for Resend */}
            {resendSuccess && (
              <Alert className="mb-4 border-green-500 text-green-700 dark:text-green-400">
                <Mail className="h-4 w-4" />
                <AlertTitle>Email Sent!</AlertTitle>
                <AlertDescription>
                  Please check your inbox and click the confirmation link to verify your account.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          disabled={isLoading}
                          className="transition-all"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <InputPassword {...field} disabled={isLoading} placeholder="Enter your password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className={cn(
                      "text-sm text-primary hover:underline",
                      "transition-colors",
                      isLoading && "pointer-events-none opacity-50",
                    )}>
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>

            {/* Demo Credentials Hint */}
            <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Demo Access</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground/70">Email</span>
                  <span className="text-purple-700 dark:text-purple-200">{DEMO_EMAIL}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-muted-foreground/70">Password</span>
                  <span className="text-purple-700 dark:text-purple-200">{DEMO_PASSWORD}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseDemoCredentials}
                className="w-full border-purple-500/40 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 text-xs">
                Use Demo Credentials
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className={cn(
                  "text-primary font-semibold hover:underline",
                  "transition-colors",
                  isLoading && "pointer-events-none opacity-50",
                )}>
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back to home link */}
        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};
