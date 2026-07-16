import { useEffect } from "react";
import { LandingPage } from "@/pages/landing/index";

export function PricingPage() {
  useEffect(() => {
    const scrollToPricing = () => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = window.requestAnimationFrame(scrollToPricing);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <LandingPage />;
}
