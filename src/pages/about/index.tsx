import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Shield, Sparkles, Target, Users } from "lucide-react";
import { Link } from "react-router";

const principles = [
  "Build tools that reduce admin drag instead of adding more dashboards to manage.",
  "Keep billing workflows clear enough for small teams and robust enough for growing firms.",
  "Support South African businesses with practical pricing, billing, and payment flows.",
];

const values = [
  {
    title: "Clarity over clutter",
    description: "We prefer direct workflows, readable interfaces, and fewer moving parts.",
    icon: Sparkles,
  },
  {
    title: "Reliable operations",
    description: "Invoices, subscriptions, and customer records should feel dependable every single day.",
    icon: Shield,
  },
  {
    title: "Built for real teams",
    description: "The platform is shaped around the actual weekly work of service businesses, not abstract accounting ideals.",
    icon: Users,
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.08),transparent_28%)]" />
          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <Badge variant="secondary" className="mb-6">About The Invoice Pro</Badge>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  We built The Invoice Pro for businesses that want billing to feel calm, professional, and under control.
                </h1>
                <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
                  The Invoice Pro helps service businesses create invoices, manage clients, track expenses,
                  and run recurring billing without the overhead of bloated finance software.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/services/pricing">
                      View Pricing <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/services">Explore Services</Link>
                  </Button>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our focus</CardTitle>
                  <CardDescription>
                    Help growing businesses spend less time chasing admin and more time doing the work they actually sell.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-foreground/90">
                  <p>
                    We care about cash flow, consistency, and giving teams a billing system they can trust at the end of a long week.
                  </p>
                  <p>
                    That means simpler workflows, stronger client visibility, and recurring billing that feels easier to operate.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">What guides the product</h2>
              <p className="mt-3 text-muted-foreground">
                The platform direction stays anchored to a few practical principles instead of chasing every possible feature.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="h-full">
                    <CardHeader>
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                      <CardDescription>{value.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto max-w-5xl px-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle>How we think about the work</CardTitle>
                <CardDescription>
                  These are the standards we keep coming back to as the platform grows.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {principles.map((item) => (
                  <div key={item} className="rounded-xl border bg-background/80 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm text-foreground/90">{item}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
