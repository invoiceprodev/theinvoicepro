import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DEMO_EMAIL = "demo@theinvoicepro.co.za";
const DEMO_PASSWORD = "Demo@1234!";

export const useDemoLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (error) {
        toast.error("Demo account not available yet", {
          description: "Please sign up or contact support to access the demo.",
        });
        return;
      }

      if (data.user) {
        toast.success("Welcome to the demo!", {
          description: "You're now logged in with the demo account.",
        });
        navigate("/dashboard");
      }
    } catch {
      toast.error("Demo account not available yet", {
        description: "Please sign up or contact support to access the demo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleDemoLogin, isLoading };
};
