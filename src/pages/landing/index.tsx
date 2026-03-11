import { useState, type FormEvent } from "react";
import { useList } from "@refinedev/core";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockPlans } from "@/data/plans";
import type { Plan } from "@/types";
import { setSelectedPlanCheckout } from "@/lib/plan-selection";

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
  { name: "TechCorp", color: "from-blue-600 to-blue-400" },
  { name: "DesignHub", color: "from-purple-600 to-purple-400" },
  { name: "StartupX", color: "from-green-600 to-green-400" },
  { name: "Creative Co", color: "from-orange-600 to-orange-400" },
  { name: "BuildIt", color: "from-red-600 to-red-400" },
  { name: "MarketPro", color: "from-indigo-600 to-indigo-400" },
];

const paymentMethods = [
  { name: "PayPal", color: "bg-blue-600" },
  { name: "Stripe", color: "bg-purple-600" },
  { name: "PayFast", color: "bg-orange-600" },
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
  const [subscribeState, setSubscribeState] = useState<"idle" | "submitting" | "success" | "error">("idle");
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
            if (name.includes("starter") || name.includes("trial") || name === "basic") return 0;
            if (name === "pro") return 1;
            if (name === "enterprise") return 2;
            return 10;
          };
          return rank(a) - rank(b) || a.price - b.price;
        })
      : plansResult
        ? mockPlans
        : [];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const beginPlanSignup = (plan: Plan) => {
    setSelectedPlanCheckout(plan);
    navigate(`/register?plan=${encodeURIComponent(plan.id)}`);
  };

  const handleHeroStartTrial = () => {
    const starterPlan = pricingPlans.find((plan) => {
      const name = plan.name.toLowerCase();
      return name.includes("starter") || name.includes("trial") || name === "basic";
    });

    if (starterPlan) {
      beginPlanSignup(starterPlan);
      return;
    }

    navigate("/register");
  };

  const handleFooterSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submit = async () => {
      setSubscribeState("submitting");
      setSubscribeMessage("");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: subscriberName.trim(),
          email: subscriberEmail.trim(),
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

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
      setSubscribeMessage(error instanceof Error ? error.message : "Failed to subscribe");
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-1 text-sm">
              <Zap className="w-3 h-3 mr-1 inline" />
              Trusted by 10,000+ businesses worldwide
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Professional Invoicing
              <br />
              Made Simple
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create, send, and track invoices in minutes. Get paid faster with automated reminders and multi-currency
              support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                onClick={handleHeroStartTrial}
                className="w-full sm:w-auto text-base px-8 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center transition-all duration-300 hover:scale-110">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Bank-Level Security</p>
              </div>
              <div className="text-center transition-all duration-300 hover:scale-110">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Fast Payments</p>
              </div>
              <div className="text-center transition-all duration-300 hover:scale-110">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium">TRUSTED BY LEADING COMPANIES</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {trustedByLogos.map((logo, index) => (
              <div
                key={logo.name}
                className="flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards`,
                }}>
                <div
                  className={cn(
                    "px-6 py-3 rounded-lg bg-gradient-to-r font-bold text-white text-sm shadow-md hover:shadow-lg transition-shadow",
                    logo.color,
                  )}>
                  {logo.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">
              Choose the perfect plan for your business. Plans are managed centrally and reflected here automatically.
            </p>

            {/* Payment Methods */}
            <div className="flex flex-wrap justify-center gap-3 pt-6">
              <span className="text-sm text-muted-foreground self-center">Accepted payments:</span>
              {paymentMethods.map((method) => (
                <Badge
                  key={method.name}
                  variant="secondary"
                  className={cn(
                    "px-3 py-1 text-white hover:scale-110 transition-transform cursor-default",
                    method.color,
                  )}>
                  {method.name}
                </Badge>
              ))}
            </div>
          </div>

          {plansResult ? (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {pricingPlans.map((tier, index) => {
              const isPopular = !!(tier.is_popular || tier.isPopular);
              const trialDays = Number(tier.trial_days || 0);
              const requiresCard = Boolean(tier.requires_card);
              const cta = trialDays > 0 ? "Start Trial" : "Buy Plan";

              return (
              <Card
                key={tier.id}
                className={cn(
                  "relative transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2",
                  isPopular && "border-primary shadow-lg scale-105 md:scale-110",
                )}
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`,
                }}>
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-primary to-primary/60 text-white px-4 py-1 shadow-lg animate-pulse">
                      <Star className="w-3 h-3 mr-1 inline fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                {trialDays > 0 && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-1 shadow-lg">
                      <Zap className="w-3 h-3 mr-1 inline" />
                      {trialDays}-Day Free Trial
                    </Badge>
                  </div>
                )}
                <CardHeader className={cn((isPopular || trialDays > 0) && "pt-8")}>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description || "Professional invoicing plan"}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">
                      {tier.currency === "ZAR" ? currencySymbols.ZAR : tier.currency === "USD" ? currencySymbols.USD : tier.currency === "EUR" ? currencySymbols.EUR : `${tier.currency} `}
                      {Number(tier.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/{tier.billing_cycle}</span>
                  </div>
                  {(trialDays > 0 || requiresCard) && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs font-normal border-orange-500 text-orange-600">
                        {requiresCard ? "Card required via PayFast" : `${trialDays}-day trial available`}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {trialDays > 0 && tier.auto_renew && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Auto-renews after {trialDays} days unless cancelled before renewal.</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full transition-all duration-300 hover:scale-105 active:scale-95",
                      isPopular && "bg-primary hover:bg-primary/90 shadow-md",
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => beginPlanSignup(tier)}>
                    {cta}
                  </Button>
                </CardFooter>
              </Card>
            )})}
          </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Loading pricing plans...</p>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Loved by Businesses Worldwide</h2>
            <p className="text-lg text-muted-foreground">
              See what our customers have to say about their experience with InvoicePro.
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
                  {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="text-lg md:text-xl leading-relaxed text-muted-foreground italic">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>

                <div>
                  <p className="font-semibold text-lg">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTestimonial}
                className="transition-all duration-300 hover:scale-110 active:scale-95">
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
                className="transition-all duration-300 hover:scale-110 active:scale-95">
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Join thousands of businesses that trust InvoicePro for their invoicing needs. Start your free trial
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="text-base px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95">
                  <Link to="/dashboard/invoices">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-base px-8 bg-white/10 hover:bg-white/20 border-white/30 text-white transition-all duration-300 hover:scale-105 active:scale-95">
                  <Link to="/dashboard/invoices">Contact Sales</Link>
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
                  <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
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
                <Button type="submit" className="w-full md:w-auto" disabled={subscribeState === "submitting"}>
                  {subscribeState === "submitting" ? "Submitting..." : "Subscribe"}
                </Button>
                {subscribeMessage ? (
                  <p className={cn("text-sm", subscribeState === "error" ? "text-destructive" : "text-muted-foreground")}>
                    {subscribeMessage}
                  </p>
                ) : null}
              </form>
            </div>
            <div className="text-sm text-muted-foreground md:text-right">
              <p>© 2024 InvoicePro. All rights reserved.</p>
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
