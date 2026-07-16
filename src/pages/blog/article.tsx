import { Navigate, useParams } from "react-router";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/pages/blog/content";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function BlogArticlePage() {
  const { slug = "" } = useParams();
  const post = getBlogPostBySlug(slug);
  const relatedPosts = post ? getRelatedBlogPosts(post.slug) : [];

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_30%),linear-gradient(180deg,rgba(15,118,110,0.05),transparent_48%)]" />
          <div className="container relative mx-auto max-w-4xl px-4">
            <div
              className={`mb-8 rounded-[2rem] border bg-gradient-to-br ${post.accentClass} bg-cover bg-center`}
              style={
                post.coverImageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.3)), url(${post.coverImageUrl})`,
                    }
                  : undefined
              }
            >
              <div className="flex h-64 items-end justify-between gap-4 p-6 md:h-72 md:p-8">
                <Badge variant="secondary" className="border-primary/20 bg-background/85 text-foreground">
                  Featured article
                </Badge>
                {post.coverAttribution ? (
                  <a
                    href={post.coverAttribution.url}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-xs text-right text-xs leading-5 text-foreground/75 transition hover:text-foreground"
                  >
                    {post.coverAttribution.label}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="mb-8 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
              <p className="max-w-2xl text-sm text-foreground/80 md:text-base">
                Actionable guidance for service businesses improving invoicing systems, collections, and recurring billing workflows.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{post.category}</Badge>
              <span className="text-sm text-muted-foreground">{post.readTime}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">{post.description}</p>
            <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border bg-background/80 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                TI
              </div>
              <div>
                <p className="text-sm font-medium">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">{post.author.role}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <Card className="border-primary/10">
                  <CardContent className="space-y-10 p-8 md:p-12">
                    {post.body.map((section) => (
                      <article key={section.heading} className="space-y-4">
                        <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph} className="text-base leading-8 text-foreground/90">
                            {paragraph}
                          </p>
                        ))}
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-6">
                <Card className="border-primary/15 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Want the platform behind the process?</CardTitle>
                    <CardDescription>
                      Explore how The Invoice Pro supports cleaner invoicing and subscription operations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link
                      to="/services/pricing"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
                    >
                      View pricing <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Related reading
                  </h3>
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.slug}>
                      <div
                        className={`h-32 rounded-t-xl bg-gradient-to-br ${relatedPost.accentClass} bg-cover bg-center`}
                        style={
                          relatedPost.coverImageUrl
                            ? {
                                backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.22)), url(${relatedPost.coverImageUrl})`,
                              }
                            : undefined
                        }
                      />
                      <CardHeader>
                        <Badge variant="outline" className="w-fit">{relatedPost.category}</Badge>
                        <CardTitle className="text-lg leading-tight">{relatedPost.title}</CardTitle>
                        <CardDescription>{relatedPost.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link
                          to={`/blog/${relatedPost.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
                        >
                          Read article <ArrowRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
