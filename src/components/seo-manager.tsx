import { useEffect } from "react";
import { useLocation } from "react-router";
import { blogPosts } from "@/pages/blog/content";

const DEFAULT_SITE_URL = "https://theinvoicepro.co.za";
const DEFAULT_IMAGE_URL = `${DEFAULT_SITE_URL}/og-image-card.png`;
const BASE_TITLE = "The Invoice Pro";
const DEFAULT_TITLE =
  "The Invoice Pro – Simple Invoicing for South African Businesses";
const DEFAULT_DESCRIPTION =
  "Create invoices, manage clients, track expenses, and get paid faster with The Invoice Pro.";
const BUSINESS_NAME = "The Invoice Pro";
const SUPPORT_EMAIL = "support@theinvoicepro.co.za";
const SOCIAL_IMAGE_ALT = "The Invoice Pro dashboard and invoicing platform";
const GOOGLE_SITE_VERIFICATION = (
  import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || ""
).trim();
const BING_SITE_VERIFICATION = (
  import.meta.env.VITE_BING_SITE_VERIFICATION || ""
).trim();

type SeoConfig = {
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  type?: "website" | "article";
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

function getSiteUrl() {
  const configured = (import.meta.env.VITE_SITE_URL || "").trim();
  return configured || DEFAULT_SITE_URL;
}

function buildOrganizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS_NAME,
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["en"],
      },
    ],
    sameAs: [],
  };
}

function buildSoftwareJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BUSINESS_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    image: `${siteUrl}/og-image-card.png`,
    offers: {
      "@type": "Offer",
      price: "150",
      priceCurrency: "ZAR",
    },
  };
}

function buildWebsiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BUSINESS_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-ZA",
  };
}

function buildBreadcrumbJsonLd(
  siteUrl: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

function buildWebPageJsonLd(
  siteUrl: string,
  pathname: string,
  name: string,
  description: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${siteUrl}${pathname}`,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: BUSINESS_NAME,
      url: siteUrl,
    },
  };
}

function buildArticleJsonLd(
  siteUrl: string,
  pathname: string,
  headline: string,
  description: string,
  datePublished: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: `${siteUrl}${pathname}`,
    author: {
      "@type": "Organization",
      name: BUSINESS_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: BUSINESS_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.ico`,
      },
    },
    image: DEFAULT_IMAGE_URL,
  };
}

function buildPricingFaqJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need a card to start using The Invoice Pro?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Trial plans can begin without card setup. You can add a payment method later before renewal for eligible plans.",
        },
      },
      {
        "@type": "Question",
        name: "Does The Invoice Pro support South African billing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The Invoice Pro is built for South African businesses and supports ZAR pricing and local billing flows.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel my subscription?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Paid subscriptions can be cancelled before renewal from your client dashboard.",
        },
      },
      {
        "@type": "Question",
        name: "Where can I view pricing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can compare plans and start a subscription at ${siteUrl}/services/pricing.`,
        },
      },
    ],
  };
}

function getSeoConfig(pathname: string, siteUrl: string): SeoConfig {
  const blogPost = pathname.startsWith("/blog/")
    ? blogPosts.find((post) => pathname === `/blog/${post.slug}`) || null
    : null;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/settings");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/auth");

  if (isAdminRoute) {
    return {
      title: `Admin Portal | ${BASE_TITLE}`,
      description: "Admin access for The Invoice Pro platform.",
      robots: "noindex,nofollow",
      canonicalPath: pathname,
    };
  }

  if (isAppRoute) {
    return {
      title: `Client Dashboard | ${BASE_TITLE}`,
      description:
        "Manage invoices, clients, plans, expenses, and compliance in your The Invoice Pro dashboard.",
      robots: "noindex,nofollow",
      canonicalPath: pathname,
    };
  }

  if (isAuthRoute) {
    return {
      title: `Secure Access | ${BASE_TITLE}`,
      description: "Sign in or create your The Invoice Pro account.",
      robots: "noindex,nofollow",
      canonicalPath: pathname,
    };
  }

  if (blogPost) {
    return {
      title: `${blogPost.title} | ${BASE_TITLE}`,
      description: blogPost.description,
      robots: "index,follow",
      canonicalPath: `/blog/${blogPost.slug}`,
      type: "article",
      structuredData: [
        buildWebPageJsonLd(
          siteUrl,
          `/blog/${blogPost.slug}`,
          `${blogPost.title} | ${BASE_TITLE}`,
          blogPost.description,
        ),
        buildArticleJsonLd(
          siteUrl,
          `/blog/${blogPost.slug}`,
          blogPost.title,
          blogPost.description,
          blogPost.publishedAt,
        ),
        buildBreadcrumbJsonLd(siteUrl, [
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: blogPost.title, path: `/blog/${blogPost.slug}` },
        ]),
      ],
    };
  }

  switch (pathname) {
    case "/":
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        robots: "index,follow",
        canonicalPath: "/",
        structuredData: [
          buildOrganizationJsonLd(siteUrl),
          buildWebsiteJsonLd(siteUrl),
          buildSoftwareJsonLd(siteUrl),
          buildBreadcrumbJsonLd(siteUrl, [{ name: "Home", path: "/" }]),
        ],
      };
    case "/services/pricing":
      return {
        title: `Pricing Plans | ${BASE_TITLE}`,
        description:
          "Compare The Invoice Pro pricing plans for South African businesses, from starter trials to Pro and Enterprise subscriptions.",
        robots: "index,follow",
        canonicalPath: "/services/pricing",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/services/pricing",
            `Pricing Plans | ${BASE_TITLE}`,
            "Compare The Invoice Pro pricing plans for South African businesses.",
          ),
          buildPricingFaqJsonLd(siteUrl),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/services/pricing" },
          ]),
        ],
      };
    case "/about":
      return {
        title: `About Us | ${BASE_TITLE}`,
        description:
          "Learn more about The Invoice Pro and the approach behind our invoicing and billing platform for South African businesses.",
        robots: "index,follow",
        canonicalPath: "/about",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/about",
            `About Us | ${BASE_TITLE}`,
            "Learn more about The Invoice Pro.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about" },
          ]),
        ],
      };
    case "/services":
      return {
        title: `Services | ${BASE_TITLE}`,
        description:
          "Explore The Invoice Pro services for invoicing, client management, expense tracking, and subscription billing.",
        robots: "index,follow",
        canonicalPath: "/services",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/services",
            `Services | ${BASE_TITLE}`,
            "Explore The Invoice Pro services.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        ],
      };
    case "/blog":
      return {
        title: `Blog | ${BASE_TITLE}`,
        description:
          "Read upcoming guides and insights from The Invoice Pro on invoicing, subscriptions, and business operations.",
        robots: "index,follow",
        canonicalPath: "/blog",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/blog",
            `Blog | ${BASE_TITLE}`,
            "Insights from The Invoice Pro.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ],
      };
    case "/privacy":
    case "/privacy-policy":
      return {
        title: `Privacy Policy | ${BASE_TITLE}`,
        description:
          "Read The Invoice Pro privacy policy and how we collect, use, and protect your information.",
        robots: "index,follow",
        canonicalPath: "/privacy-policy",
        type: "article",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/privacy-policy",
            `Privacy Policy | ${BASE_TITLE}`,
            "The Invoice Pro privacy policy.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ]),
        ],
      };
    case "/terms":
      return {
        title: `Terms of Service | ${BASE_TITLE}`,
        description:
          "Review The Invoice Pro terms of service for using the platform and subscription services.",
        robots: "index,follow",
        canonicalPath: "/terms",
        type: "article",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/terms",
            `Terms of Service | ${BASE_TITLE}`,
            "The Invoice Pro terms of service.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Terms of Service", path: "/terms" },
          ]),
        ],
      };
    case "/refund-policy":
      return {
        title: `Refund Policy | ${BASE_TITLE}`,
        description:
          "Understand how refunds are handled for The Invoice Pro subscriptions and billing.",
        robots: "index,follow",
        canonicalPath: "/refund-policy",
        type: "article",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/refund-policy",
            `Refund Policy | ${BASE_TITLE}`,
            "The Invoice Pro refund policy.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Refund Policy", path: "/refund-policy" },
          ]),
        ],
      };
    case "/cookie-policy":
      return {
        title: `Cookie Policy | ${BASE_TITLE}`,
        description:
          "Learn how The Invoice Pro uses cookies and similar technologies across the website and platform.",
        robots: "index,follow",
        canonicalPath: "/cookie-policy",
        type: "article",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/cookie-policy",
            `Cookie Policy | ${BASE_TITLE}`,
            "The Invoice Pro cookie policy.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Cookie Policy", path: "/cookie-policy" },
          ]),
        ],
      };
    case "/acceptable-use":
      return {
        title: `Acceptable Use Policy | ${BASE_TITLE}`,
        description:
          "Read the acceptable use policy for The Invoice Pro and the standards for platform usage.",
        robots: "index,follow",
        canonicalPath: "/acceptable-use",
        type: "article",
        structuredData: [
          buildWebPageJsonLd(
            siteUrl,
            "/acceptable-use",
            `Acceptable Use Policy | ${BASE_TITLE}`,
            "The Invoice Pro acceptable use policy.",
          ),
          buildBreadcrumbJsonLd(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Acceptable Use Policy", path: "/acceptable-use" },
          ]),
        ],
      };
    default:
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        robots: "index,follow",
        canonicalPath: pathname,
      };
  }
}

export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const siteUrl = getSiteUrl();
    const seo = getSeoConfig(location.pathname, siteUrl);
    const canonicalUrl = `${siteUrl}${seo.canonicalPath}`;
    const jsonLd = seo.structuredData
      ? Array.isArray(seo.structuredData)
        ? seo.structuredData
        : [seo.structuredData]
      : [];

    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });
    upsertMeta('meta[name="robots"]', { name: "robots", content: seo.robots });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: seo.type || "website",
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: DEFAULT_IMAGE_URL,
    });
    upsertMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: SOCIAL_IMAGE_ALT,
    });
    upsertMeta('meta[property="og:image:type"]', {
      property: "og:image:type",
      content: "image/png",
    });
    upsertMeta('meta[property="og:image:width"]', {
      property: "og:image:width",
      content: "1200",
    });
    upsertMeta('meta[property="og:image:height"]', {
      property: "og:image:height",
      content: "630",
    });
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "en_ZA",
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: BASE_TITLE,
    });
    upsertMeta('meta[name="author"]', {
      name: "author",
      content: BUSINESS_NAME,
    });
    upsertMeta('meta[name="application-name"]', {
      name: "application-name",
      content: BUSINESS_NAME,
    });
    upsertMeta('meta[name="apple-mobile-web-app-title"]', {
      name: "apple-mobile-web-app-title",
      content: BUSINESS_NAME,
    });
    if (GOOGLE_SITE_VERIFICATION) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: "google-site-verification",
        content: GOOGLE_SITE_VERIFICATION,
      });
    }
    if (BING_SITE_VERIFICATION) {
      upsertMeta('meta[name="msvalidate.01"]', {
        name: "msvalidate.01",
        content: BING_SITE_VERIFICATION,
      });
    }
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: DEFAULT_IMAGE_URL,
    });
    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });

    const existingStructuredData = document.head.querySelectorAll(
      'script[data-seo-jsonld="true"]',
    );
    existingStructuredData.forEach((node) => node.remove());

    jsonLd.forEach((entry) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoJsonld = "true";
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [location.pathname]);

  return null;
}
