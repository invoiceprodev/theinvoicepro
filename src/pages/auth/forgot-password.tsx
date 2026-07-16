import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendAuth0PasswordResetEmail } from "@/lib/auth0-db";
import { getAdminRoute } from "@/lib/admin-routing";
import { cn } from "@/lib/utils";
import type { AuthAppKind } from "@/lib/auth0-config";

type ForgotPasswordPageProps = {
  appKind?: AuthAppKind;
};

export function ForgotPasswordPage({ appKind = "customer" }: ForgotPasswordPageProps) {
  const isAdmin = appKind === "admin";
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const backToLogin = isAdmin ? getAdminRoute("/login") : "/login";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSending(true);
      await sendAuth0PasswordResetEmail({
        appKind,
        email,
      });
      toast.success("Password reset email sent", {
        description: `Check ${email} for a secure reset link.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send password reset email.";
      toast.error("Password reset failed", {
        description: message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center px-4 py-8",
        isAdmin ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-primary/5 via-background to-background",
      )}>
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            {isAdmin ? <ShieldCheck className="w-9 h-9 text-purple-400" /> : <FileText className="w-8 h-8 text-primary" />}
            <span className={cn("text-2xl font-bold", isAdmin && "text-white")}>
              InvoicePro {isAdmin ? <span className="text-purple-400">Admin</span> : null}
            </span>
          </div>
          <p className={cn("text-sm", isAdmin ? "text-slate-400" : "text-muted-foreground")}>
            Send yourself a secure password reset link
          </p>
        </div>

        <Card className={cn("shadow-lg", isAdmin && "shadow-2xl border-slate-700 bg-slate-800/80 backdrop-blur")}>
          <CardHeader className="space-y-1">
            <CardTitle className={cn("text-2xl font-bold", isAdmin && "text-white")}>Forgot Password</CardTitle>
            <CardDescription className={cn(isAdmin && "text-slate-400")}>
              Enter your account email and we will send a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className={cn(isAdmin && "text-slate-200")}>
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={isAdmin ? "admin@example.com" : "you@example.com"}
                  required
                  disabled={isSending}
                  className={cn(
                    isAdmin &&
                      "bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-purple-500",
                  )}
                />
              </div>

              <Button
                type="submit"
                className={cn("w-full", isAdmin && "bg-purple-600 hover:bg-purple-700 text-white")}
                size="lg"
                disabled={isSending}>
                {isSending ? "Sending reset link..." : "Send Reset Link"}
              </Button>
            </form>

            <Button variant="link" className={cn("mt-4 h-auto px-0", isAdmin && "text-purple-300 hover:text-purple-200")} asChild>
              <Link to={backToLogin} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
