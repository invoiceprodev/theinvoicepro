import { useEffect } from "react";
import { useList, useLogin } from "@refinedev/core";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSelectedPlanCheckout, setSelectedPlanCheckout } from "@/lib/plan-selection";
import type { Plan } from "@/types";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { mutate: login, error: loginError } = useLogin<LoginFormValues & { password?: string }>();
  const [searchParams] = useSearchParams();
  const selectedPlanId = searchParams.get("plan");
  const selectedPlan = getSelectedPlanCheckout();
  const { result: plansResult } = useList<Plan>({
    resource: "plans",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: Boolean(selectedPlanId && !selectedPlan),
    },
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!selectedPlanId || selectedPlan || !plansResult?.data?.length) {
      return;
    }

    const matchedPlan = (plansResult.data as Plan[]).find((plan) => plan.id === selectedPlanId);
    if (matchedPlan) {
      setSelectedPlanCheckout(matchedPlan);
    }
  }, [plansResult, selectedPlan, selectedPlanId]);

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">InvoicePro</span>
          </div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your email to access your account</CardDescription>
            {selectedPlanId && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                Sign in to continue with your selected plan and complete card setup.
              </div>
            )}
          </CardHeader>

          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{(loginError as any).message || "Unable to start login."}</AlertDescription>
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
                        <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
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

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Secure sign-in continues automatically after you submit.
                </p>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className={cn("text-primary font-semibold hover:underline", isLoading && "pointer-events-none opacity-50")}>
                Sign up
              </Link>
            </div>
            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link to="/register" className={cn(isLoading && "pointer-events-none opacity-50")}>
                Create Account
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
