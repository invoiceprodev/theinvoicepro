import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CreditCard, FileText, Receipt, Users } from "lucide-react";
import { Link } from "react-router";

const services = [
  {
    title: "Invoice Management",
    description: "Create polished invoices quickly, manage line items, and keep billing consistent across clients.",
    outcome: "Faster invoice creation with a more professional customer experience.",
    icon: FileText,
  },
  {
    title: "Client Management",
    description: "Organize customer records, billing details, and account history in one place.",
    outcome: "Less time hunting for information and fewer billing mistakes.",
    icon: Users,
  },
  {
    title: "Expense Tracking",
    description: "Track operating costs alongside billing activity so you can see the real picture of your business.",
    outcome: "Clearer visibility into margin, spend, and operating rhythm.",
    icon: Receipt,
  },
  {
    title: "Subscription Billing",
    description: "Run card-required subscription flows and recurring billing through Paystack, with PayPal available as a supported payment option.",
    outcome: "A cleaner recurring revenue workflow for paid plans and renewals.",
    icon: CreditCard,
  },
];

const useCases = [
  "Consultants who bill multiple retainers every month",
  "Agencies managing client work, expenses, and recurring subscriptions",
  "Small teams replacing spreadsheet-heavy invoicing routines",
];

export function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.10),transparent_35%),linear-gradient(315deg,rgba(15,118,110,0.08),transparent_30%)]" />
          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <Badge variant="secondary" className="mb-6">Services</Badge>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  The workflows your team needs to invoice confidently and keep revenue moving.
                </h1>
                <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
                  The Invoice Pro combines client billing, invoicing, expense visibility, and subscription handling in one
                  practical operating layer for service businesses.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/services/pricing">
                      Compare Plans <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/register">Start With The Platform</Link>
                  </Button>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>Best fit for teams that need</CardTitle>
                  <CardDescription>
                    A billing workflow that feels more operational than accounting-heavy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {useCases.map((item) => (
                    <div key={item} className="rounded-xl border bg-background/80 px-4 py-3 text-sm text-foreground/90">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Core service areas</h2>
              <p className="mt-3 text-muted-foreground">
                Each part of the platform is shaped around a clear business outcome, not just another menu item.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.title} className="h-full">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-foreground/90">
                        <span className="font-medium">Outcome:</span> {service.outcome}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
