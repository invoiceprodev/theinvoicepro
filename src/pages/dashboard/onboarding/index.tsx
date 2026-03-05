import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Welcome to TheInvoicePro</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">Let's get your account set up</p>
      <Button size="lg" onClick={() => navigate("/dashboard")}>
        Go to Dashboard
      </Button>
    </div>
  );
}
