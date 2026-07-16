import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { blogPosts } from "@/pages/blog/content";

const contentThemes = [
  "Invoicing best practices",
  "Cash flow and collections",
  "Recurring billing operations",
  "Client communication systems",
];

export function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.12),transparent_28%),linear-gradient(180deg,rgba(15,118,110,0.06),transparent_50%)]" />
          <div className="container relative mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <Badge variant="secondary" className="mb-6">Blog</Badge>
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  Practical writing for businesses that want cleaner invoicing operations.
                </h1>
                <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
                  We’re building a library of useful guides on invoicing, subscriptions, client billing, and the small operational decisions that shape cash flow.
                </p>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>What this section will cover</CardTitle>
                  <CardDescription>
                    Content will be aimed at founders, operators, and finance-minded teams who want simpler systems.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {contentThemes.map((theme) => (
                    <div key={theme} className="rounded-xl border bg-background/80 px-4 py-3 text-sm text-foreground/90">
                      {theme}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Planned articles</h2>
                <p className="mt-3 text-muted-foreground">
                  We’ve already mapped out the first set of practical guides to publish here.
                </p>
              </div>
              <Button variant="outline" asChild className="hidden md:inline-flex">
                <Link to="/services/pricing">
                  Explore Pricing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {blogPosts.map((post, index) => (
                <Card key={post.title} className="h-full">
                  <div
                    className={`rounded-t-xl bg-gradient-to-br ${post.accentClass} bg-cover bg-center`}
                    style={
                      post.coverImageUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.28)), url(${post.coverImageUrl})`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex h-44 items-end justify-between p-4">
                      {index === 0 ? (
                        <Badge variant="secondary" className="border-primary/20 bg-background/85 text-foreground">
                          Featured story
                        </Badge>
                      ) : (
                        <span />
                      )}
                      {post.coverAttribution ? (
                        <a
                          href={post.coverAttribution.url}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[14rem] text-right text-[11px] leading-4 text-foreground/70 transition hover:text-foreground"
                        >
                          {post.coverAttribution.label}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">{post.category}</Badge>
                    <CardTitle className="leading-tight">{post.title}</CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{post.readTime}</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
                    >
                      Read article <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
