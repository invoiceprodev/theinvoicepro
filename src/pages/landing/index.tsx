import { useState, type FormEvent } from "react";
import { useList } from "@refinedev/core";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import {
  Check,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockPlans } from "@/data/plans";
import type { Plan } from "@/types";
import { setSelectedPlanCheckout } from "@/lib/plan-selection";
import { canStartTrialWithoutCard, planRequiresCard } from "@/lib/trial-bypass";
import { getFallbackPlans, shouldUsePlanFallback } from "@/lib/plan-fallback";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Designer",
    avatar: "SJ",
    content:
      "InvoicePro has completely transformed how I manage my client billing. The interface is clean and professional, and my clients love the polished invoices.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Small Business Owner",
    avatar: "MC",
    content:
      "Switching to InvoicePro was the best decision for our business. Payment tracking and automated reminders have improved our cash flow significantly.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Consulting Agency",
    avatar: "EW",
    content:
      "The multi-currency support and analytics features are game-changers. We can now service international clients with ease and track our revenue in real-time.",
    rating: 5,
  },
  {
    name: "David Brown",
    role: "Digital Marketing Agency",
    avatar: "DB",
    content:
      "Outstanding platform! The recurring invoice feature saves us hours every month, and the API integration with our CRM is seamless.",
    rating: 5,
  },
];

const trustedByLogos = [
  { name: "Three J Media" },
  { name: "Talent Obsession" },
  { name: "Adoracion" },
  { name: "MKH Projects" },
];

const paymentMethods = [
  { name: "Paystack", color: "bg-emerald-600" },
  { name: "PayPal", color: "bg-blue-600" },
];

const currencySymbols: Record<string, string> = {
  USD: "$",
  ZAR: "R",
  EUR: "€",
};

export const LandingPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const navigate = useNavigate();
  const { result: plansResult } = useList<Plan>({
    resource: "plans",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { mode: "off" },
  });

  const pricingPlans =
    plansResult?.data && plansResult.data.length > 0
      ? [...(plansResult.data as Plan[])].sort((a, b) => {
          const rank = (plan: Plan) => {
            const name = plan.name.toLowerCase();
            if (
              name.includes("starter") ||
              name.includes("trial") ||
              name === "basic"
            )
              return 0;
            if (name === "pro") return 1;
            if (name === "enterprise") return 2;
            return 10;
          };
          return rank(a) - rank(b) || a.price - b.price;
        })
      : plansResult &&
        !shouldUsePlanFallback((plansResult as { error?: unknown }).error)
      ? mockPlans
      : getFallbackPlans();
  const publicTrialPlans = pricingPlans.filter((plan) =>
    canStartTrialWithoutCard(plan),
  );

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const beginPlanSignup = (plan: Plan) => {
    setSelectedPlanCheckout(plan);
    navigate(`/register?plan=${encodeURIComponent(plan.id)}`);
  };

  const handleHeroStartTrial = () => {
    const starterPlan = publicTrialPlans.find((plan) => {
      const name = plan.name.toLowerCase();
      return (
        name.includes("starter") || name.includes("trial") || name === "basic"
      );
    });

    if (starterPlan) {
      beginPlanSignup(starterPlan);
      return;
    }

    if (publicTrialPlans.length > 0) {
      beginPlanSignup(publicTrialPlans[0]);
      return;
    }

    navigate("/services/pricing");
  };

  const handleFooterSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submit = async () => {
      setSubscribeState("submitting");
      setSubscribeMessage("");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_API_BASE_URL ||
          "https://api.theinvoicepro.co.za"
        }/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: subscriberName.trim(),
            email: subscriberEmail.trim(),
          }),
        },
      );

      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Failed to subscribe");
      }

      setSubscriberName("");
      setSubscriberEmail("");
      setSubscribeState("success");
      setSubscribeMessage("Thanks. We received your details.");
    };

    void submit().catch((error) => {
      setSubscribeState("error");
      setSubscribeMessage(
        error instanceof Error ? error.message : "Failed to subscribe",
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden bg-slate-950 py-20 text-white md:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.82)_0%,rgba(2,6,23,0.58)_42%,rgba(15,23,42,0.18)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_45%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.14),transparent_42%)] lg:block" />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8 text-center animate-fade-in lg:text-left">
              <Badge
                variant="secondary"
                className="border border-white/10 bg-white/8 px-4 py-1 text-sm text-white backdrop-blur hover:bg-white/8"
              >
                <Zap className="mr-1 inline h-3 w-3" />
                Trusted by Influencers and start up businesses alike.
              </Badge>

              <div className="space-y-6">
                <h1 className="bg-gradient-to-r from-white via-white to-white/72 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl lg:text-7xl">
                  Your Invoicing, Simplified. <br />
                  <br />
                  Real Business.
                </h1>

                <p className="max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl lg:max-w-xl">
                  Create professional invoices, accept payments, and track your
                  income from anywhere with a mobile-first platform built for
                  South African businesses.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2 lg:justify-start">
                <Button
                  size="lg"
                  onClick={handleHeroStartTrial}
                  className="w-full text-base px-8 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 sm:w-auto"
                >
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-3">
                <div className="text-center transition-all duration-300 hover:scale-105 lg:text-left">
                  <div className="mb-2 flex items-center justify-center lg:justify-start">
                    <Shield className="h-8 w-8 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-white">
                    Bank-Level Security
                  </p>
                </div>
                <div className="text-center transition-all duration-300 hover:scale-105 lg:text-left">
                  <div className="mb-2 flex items-center justify-center lg:justify-start">
                    <TrendingUp className="h-8 w-8 text-sky-400" />
                  </div>
                  <p className="text-sm font-medium text-white">
                    Fast Payments
                  </p>
                </div>
                <div className="text-center transition-all duration-300 hover:scale-105 lg:text-left">
                  <div className="mb-2 flex items-center justify-center lg:justify-start">
                    <Users className="h-8 w-8 text-cyan-300" />
                  </div>
                  <p className="text-sm font-medium text-white">24/7 Support</p>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[620px]">
                <div className="absolute inset-0 translate-y-8 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_58%)] blur-3xl" />
                <div className="relative mx-auto w-[350px] rounded-[3rem] bg-[linear-gradient(180deg,#3f3f46_0%,#18181b_20%,#09090b_100%)] p-[3px] shadow-[0_44px_110px_rgba(2,6,23,0.6)] ring-1 ring-white/10 lg:rotate-[-16deg]">
                  <div className="absolute -left-[4px] top-24 hidden h-14 w-[3px] rounded-full bg-white/18 lg:block" />
                  <div className="absolute -left-[4px] top-40 hidden h-16 w-[3px] rounded-full bg-white/18 lg:block" />
                  <div className="absolute -right-[4px] top-32 hidden h-20 w-[3px] rounded-full bg-white/18 lg:block" />
                  <div className="rounded-[2.85rem] border border-white/6 bg-slate-950 p-2">
                    <div className="mx-auto mb-2 flex h-7 w-32 items-center justify-center rounded-full bg-black shadow-inner">
                      <div className="absolute h-2.5 w-2.5 rounded-full bg-slate-800" />
                      <div className="h-1.5 w-14 rounded-full bg-slate-800" />
                    </div>
                    <div className="overflow-hidden rounded-[2.2rem] bg-white">
                      <div className="border-b border-slate-200 bg-white px-4 py-3">
                        <div className="mb-3 flex items-center justify-between text-slate-500">
                          <span className="text-xs font-semibold">9:41</span>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span>5G</span>
                            <span className="h-2.5 w-6 rounded-full border border-slate-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 shadow-sm">
                          <Globe className="h-3.5 w-3.5 text-sky-600" />
                          <span className="font-medium">
                            theinvoicepro.co.za
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="border border-slate-300 bg-white">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                              Invoice
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                              Contact
                            </p>
                          </div>

                          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
                            <div>
                              <p className="text-[13px] font-medium text-slate-900">
                                Lerato Catering PTY LTD
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                Cape Town, South Africa
                              </p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500">
                              <p>Client Ref 40.187</p>
                              <p className="mt-1">10:09</p>
                            </div>
                          </div>

                          <div className="px-4 py-3">
                            <div className="rounded-xl border border-slate-300 bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[12px] font-semibold text-slate-900">
                                    Lerato Catering
                                  </p>
                                  <p className="text-[12px] font-semibold text-slate-900">
                                    PTY LTD
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    Company
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-500">
                                    INV-2025-0042
                                  </p>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    30 Apr 2025
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-200 px-4 py-3">
                            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] items-center gap-2 text-[10px] text-slate-500">
                              <p className="font-semibold text-slate-900">
                                Invoice
                              </p>
                              <p className="text-center">Subtotal</p>
                              <p className="text-right">100%</p>
                            </div>
                          </div>

                          <div className="px-4 pb-2">
                            <div className="grid grid-cols-[1.35fr_0.85fr_0.8fr] gap-0 text-[10px]">
                              <div className="border-b border-slate-300 py-2 text-slate-900">
                                The Company
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-slate-500">
                                New design
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-right text-slate-500">
                                R 12k
                              </div>
                              <div className="border-b border-slate-300 py-2 text-slate-900">
                                Cliquot
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-slate-500">
                                SEO
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-right text-slate-500">
                                R 3.5k
                              </div>
                              <div className="border-b border-slate-300 py-2 text-slate-900">
                                Consulting
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-slate-500">
                                4 hours
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-right text-slate-500">
                                R 3.4k
                              </div>
                              <div className="border-b border-slate-300 py-2 text-slate-900">
                                Adjustment
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-slate-500">
                                VAT
                              </div>
                              <div className="border-b border-l border-slate-300 py-2 pl-2 text-right text-slate-500">
                                R 2.8k
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 px-1">
                          <div className="flex items-start justify-between text-[11px]">
                            <div>
                              <p className="uppercase tracking-[0.16em] text-slate-500">
                                Total due
                              </p>
                              <p className="mt-1 text-[18px] font-semibold text-slate-900">
                                R 21,235.00
                              </p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500">
                              <p>Invoice terms</p>
                              <p className="mt-1 font-medium text-slate-900">
                                Net 30
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-slate-800"
                          >
                            Send Invoice Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              No paperwork. No accounting stress. Just get paid.
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the perfect plan for your business. Plans are managed
              centrally and reflected here automatically.
            </p>

            {/* Payment Methods */}
            <div className="flex flex-wrap justify-center gap-3 pt-6">
              <span className="text-sm text-muted-foreground self-center">
                Accepted payments:
              </span>
              {paymentMethods.map((method) => (
                <Badge
                  key={method.name}
                  variant="secondary"
                  className={cn(
                    "px-3 py-1 text-white hover:scale-110 transition-transform cursor-default",
                    method.color,
                  )}
                >
                  {method.name}
                </Badge>
              ))}
            </div>
          </div>

          {plansResult ? (
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {pricingPlans.map((tier, index) => {
                const trialDays = Number(tier.trial_days || 0);
                const requiresCard = planRequiresCard(tier);
                const isPopular = !!(tier.is_popular || tier.isPopular);
                const canStartPublicTrial = canStartTrialWithoutCard(tier);
                const canStartSignup = canStartPublicTrial || requiresCard;
                const cta = canStartPublicTrial
                  ? "Start Trial"
                  : requiresCard
                  ? "Get Started"
                  : "Coming Soon";

                return (
                  <Card
                    key={tier.id}
                    className={cn(
                      "relative border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.98)_100%)] text-white shadow-[0_24px_70px_rgba(2,6,23,0.46)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-[0_28px_90px_rgba(2,6,23,0.56)]",
                      isPopular &&
                        "border-emerald-400 shadow-[0_24px_80px_rgba(16,185,129,0.24)] scale-105 md:scale-110",
                    )}
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${
                        index * 0.1
                      }s backwards`,
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-1 text-white shadow-lg animate-pulse">
                          <Star className="w-3 h-3 mr-1 inline fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {canStartPublicTrial && trialDays > 0 && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-1 shadow-lg">
                          <Zap className="w-3 h-3 mr-1 inline" />
                          {trialDays}-Day Free Trial
                        </Badge>
                      </div>
                    )}
                    <CardHeader
                      className={cn((isPopular || trialDays > 0) && "pt-8")}
                    >
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <CardDescription className="text-slate-300">
                        {tier.description || "Professional invoicing plan"}
                      </CardDescription>
                      <div className="pt-4">
                        <span className="text-4xl font-bold">
                          {tier.currency === "ZAR"
                            ? currencySymbols.ZAR
                            : tier.currency === "USD"
                            ? currencySymbols.USD
                            : tier.currency === "EUR"
                            ? currencySymbols.EUR
                            : `${tier.currency} `}
                          {Number(tier.price).toFixed(2)}
                        </span>
                        <span className="text-slate-400">
                          /{tier.billing_cycle}
                        </span>
                      </div>
                      {(trialDays > 0 || requiresCard) && (
                        <div className="pt-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-normal bg-transparent",
                              canStartPublicTrial
                                ? "border-green-500/70 text-green-300"
                                : "border-orange-400/70 text-orange-300",
                            )}
                          >
                            {canStartPublicTrial
                              ? `${trialDays}-day trial available`
                              : requiresCard
                              ? "Card setup required before billing starts"
                              : "Paid signup temporarily unavailable"}
                          </Badge>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                            <span className="text-sm text-slate-100">
                              {feature}
                            </span>
                          </li>
                        ))}
                        {trialDays > 0 && tier.auto_renew && (
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                            <span className="text-sm text-slate-100">
                              Auto-renews after {trialDays} days unless
                              cancelled before renewal.
                            </span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={cn(
                          "w-full bg-white text-slate-950 shadow-md transition-all duration-300 hover:scale-105 hover:bg-slate-100 active:scale-95",
                        )}
                        variant="default"
                        onClick={() => beginPlanSignup(tier)}
                        disabled={!canStartSignup}
                      >
                        {cta}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Loading pricing plans...
            </p>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Still sending invoices on WhatsApp or Excel?
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our customers have to say about their experience with
              InvoicePro.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <Card className="p-8 md:p-12 shadow-xl transition-all duration-500">
              <div className="flex flex-col items-center text-center space-y-6">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {testimonials[currentTestimonial].avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex gap-1">
                  {Array.from({
                    length: testimonials[currentTestimonial].rating,
                  }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <blockquote className="text-lg md:text-xl leading-relaxed text-muted-foreground italic">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>

                <div>
                  <p className="font-semibold text-lg">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[currentTestimonial].role}
                  </p>
                </div>
              </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2 items-center">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      currentTestimonial === index
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={nextTestimonial}
                className="transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/10" />
            <CardContent className="p-12 md:p-16 text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Join hundreds of businesses that trust InvoicePro for their
                invoicing needs. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                  onClick={handleHeroStartTrial}
                  disabled={publicTrialPlans.length === 0}
                >
                  <>
                    Start For Free <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-base px-8 bg-white/10 hover:bg-white/20 border-white/30 text-white transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <a href="mailto:hello@theinvoicepro.co.za">Contact Sales</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">InvoicePro</h3>
              <p className="text-sm text-muted-foreground">
                Professional invoicing made simple for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#pricing"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/privacy"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund-policy"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookie-policy"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/acceptable-use"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Acceptable Use
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@theinvoicepro.co.za"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-sm">
              <h4 className="font-semibold text-foreground mb-3">Subscribe</h4>
              <form onSubmit={handleFooterSubscribe} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={subscriberName}
                  onChange={(event) => setSubscriberName(event.target.value)}
                  required
                  disabled={subscribeState === "submitting"}
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={subscriberEmail}
                  onChange={(event) => setSubscriberEmail(event.target.value)}
                  required
                  disabled={subscribeState === "submitting"}
                />
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={subscribeState === "submitting"}
                >
                  {subscribeState === "submitting"
                    ? "Submitting..."
                    : "Subscribe"}
                </Button>
                {subscribeMessage ? (
                  <p
                    className={cn(
                      "text-sm",
                      subscribeState === "error"
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {subscribeMessage}
                  </p>
                ) : null}
              </form>
            </div>
            <div className="text-sm text-muted-foreground md:text-right">
              <p>
                © 2026 InvoicePro is powered by Three J Media. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .bg-grid-white\/10 {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};
