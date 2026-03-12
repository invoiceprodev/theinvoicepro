import { useEffect } from "react";
import { useList, useRegister } from "@refinedev/core";
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
import { clearSelectedPlanCheckout, getSelectedPlanCheckout, setSelectedPlanCheckout } from "@/lib/plan-selection";
import { canStartTrialWithoutCard } from "@/lib/trial-bypass";
import type { Plan } from "@/types";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { mutate: register, error: registerError } = useRegister<RegisterFormValues>();
  const [searchParams] = useSearchParams();
  const selectedPlan = getSelectedPlanCheckout();
  const selectedPlanId = searchParams.get("plan");
  const { result: plansResult } = useList<Plan>({
    resource: "plans",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: Boolean(selectedPlanId && !selectedPlan),
    },
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (selectedPlan && !canStartTrialWithoutCard(selectedPlan)) {
      clearSelectedPlanCheckout();
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (!selectedPlanId || selectedPlan || !plansResult?.data?.length) {
      return;
    }

    const matchedPlan = (plansResult.data as Plan[]).find((plan) => plan.id === selectedPlanId);
    if (matchedPlan && canStartTrialWithoutCard(matchedPlan)) {
      setSelectedPlanCheckout(matchedPlan);
    }
  }, [plansResult, selectedPlan, selectedPlanId]);

  const activeSelectedPlan =
    selectedPlan && canStartTrialWithoutCard(selectedPlan) ? selectedPlan : null;

  const onSubmit = (values: RegisterFormValues) => {
    register(values);
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
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
            <CardDescription>Enter your details and we will send a confirmation link to your email</CardDescription>
            {activeSelectedPlan &&
              (!selectedPlanId || activeSelectedPlan.id === selectedPlanId) && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                Selected plan: <strong>{activeSelectedPlan.name}</strong>
                {activeSelectedPlan.trial_days
                  ? ` with a ${activeSelectedPlan.trial_days}-day trial`
                  : ""}
              </div>
            )}
            {selectedPlanId && !activeSelectedPlan ? (
              <Alert className="border-orange-200 bg-orange-50 text-orange-900">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Plan unavailable</AlertTitle>
                <AlertDescription>
                  Public signup is temporarily limited to trials that do not
                  require card setup.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardHeader>

          <CardContent>
            {registerError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>
                  {(registerError as any).message || "Unable to start signup. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="John Doe" {...field} disabled={isLoading} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                        <InputPassword {...field} disabled={isLoading} placeholder="Create a password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <InputPassword {...field} disabled={isLoading} placeholder="Confirm your password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  After signup, confirm your email before your account is activated in the app.
                </p>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className={cn("text-primary font-semibold hover:underline", isLoading && "pointer-events-none opacity-50")}>
                Login
              </Link>
            </div>
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
