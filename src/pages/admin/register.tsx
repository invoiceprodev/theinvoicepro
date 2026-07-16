import { useRegister } from "@refinedev/core";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { getAdminRoute } from "@/lib/admin-routing";
import { cn } from "@/lib/utils";

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

export const AdminRegisterPage = () => {
  const { mutate: register, error: registerError } = useRegister<RegisterFormValues>();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register(values);
  };

  const isLoading = form.formState.isSubmitting;

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
          <p className="text-sm text-slate-400">Create an admin account and verify your email</p>
        </div>

        <Card className="shadow-2xl border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">Admin Registration</CardTitle>
            <CardDescription className="text-slate-400">
              This creates the account only. Admin access still requires the admin role in Auth0.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {registerError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{(registerError as any).message || "Unable to create admin account."}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Admin User"
                          {...field}
                          disabled={isLoading}
                          autoComplete="name"
                          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
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
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                          disabled={isLoading}
                          autoComplete="email"
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
                          placeholder="Create a password"
                          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
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
                      <FormLabel className="text-slate-200">Confirm Password</FormLabel>
                      <FormControl>
                        <InputPassword
                          {...field}
                          disabled={isLoading}
                          placeholder="Confirm your password"
                          className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Admin Account"}
                </Button>

                <p className="text-center text-xs text-slate-500">
                  After signup, confirm your email. An Auth0 admin role must still be assigned before admin login will work.
                </p>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-slate-400">
              Already have an admin account?{" "}
              <Link
                to={getAdminRoute("/login")}
                className={cn("text-purple-300 font-semibold hover:underline", isLoading && "pointer-events-none opacity-50")}>
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
