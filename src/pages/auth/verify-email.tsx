import { Link, useSearchParams } from "react-router";
import { MailCheck, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get("email");
  const planId = params.get("plan");
  const isAdmin = params.get("next") === "admin";
  const returnPath = isAdmin
    ? "/admin/login"
    : `/login${planId ? `?plan=${encodeURIComponent(planId)}` : ""}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Confirm your email</CardTitle>
          <CardDescription>
            We sent a verification link{email ? ` to ${email}` : ""}. Open that email, confirm your account, then sign in.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Your account will only be activated in the app after email verification. Once verified, signing in will sync your
            profile into the database automatically.
          </p>
          {!isAdmin && planId ? (
            <p>
              Your selected plan has been saved. After you confirm your email and sign in, you will continue to secure card
              setup to start your trial.
            </p>
          ) : null}
          <p>
            If you do not see the message, check spam or promotions and verify that Auth0 email verification is enabled for
            this application.
          </p>

          <Button asChild className="w-full" size="lg">
            <Link to={returnPath}>{!isAdmin && planId ? "Continue to login" : "Return to login"}</Link>
          </Button>

          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
