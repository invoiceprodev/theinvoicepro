import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

type LegalLayoutProps = {
  title: string;
  summary: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalLayout({
  title,
  summary,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <div className="mb-10 space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{summary}</p>
          <p className="text-sm text-muted-foreground">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-7 text-muted-foreground">
          {children}
        </div>
      </main>
    </div>
  );
}
