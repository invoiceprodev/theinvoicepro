import { useEffect } from "react";
import { useLocation } from "react-router";

const DEFAULT_SITE_URL = "https://theinvoicepro.co.za";
const DEFAULT_IMAGE_URL = `${DEFAULT_SITE_URL}/og-image-card.png`;
const BASE_TITLE = "The Invoice Pro";
const DEFAULT_TITLE = "The Invoice Pro – Simple Invoicing for South African Businesses";
const DEFAULT_DESCRIPTION =
  "Create invoices, manage clients, track expenses, and get paid faster with The Invoice Pro.";

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
    name: "The Invoice Pro",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    sameAs: [],
  };
}

function buildSoftwareJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "The Invoice Pro",
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

function getSeoConfig(pathname: string, siteUrl: string): SeoConfig {
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
      description: "Manage invoices, clients, plans, expenses, and compliance in your The Invoice Pro dashboard.",
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

  switch (pathname) {
    case "/":
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        robots: "index,follow",
        canonicalPath: "/",
        structuredData: [buildOrganizationJsonLd(siteUrl), buildSoftwareJsonLd(siteUrl)],
      };
    case "/services/pricing":
      return {
        title: `Pricing | ${BASE_TITLE}`,
        description: "Explore The Invoice Pro pricing plans for South African businesses and start your free trial.",
        robots: "index,follow",
        canonicalPath: "/services/pricing",
      };
    case "/privacy":
    case "/privacy-policy":
      return {
        title: `Privacy Policy | ${BASE_TITLE}`,
        description: "Read The Invoice Pro privacy policy and how we collect, use, and protect your information.",
        robots: "index,follow",
        canonicalPath: "/privacy-policy",
        type: "article",
      };
    case "/terms":
      return {
        title: `Terms of Service | ${BASE_TITLE}`,
        description: "Review The Invoice Pro terms of service for using the platform and subscription services.",
        robots: "index,follow",
        canonicalPath: "/terms",
        type: "article",
      };
    case "/refund-policy":
      return {
        title: `Refund Policy | ${BASE_TITLE}`,
        description: "Understand how refunds are handled for The Invoice Pro subscriptions and billing.",
        robots: "index,follow",
        canonicalPath: "/refund-policy",
        type: "article",
      };
    case "/cookie-policy":
      return {
        title: `Cookie Policy | ${BASE_TITLE}`,
        description: "Learn how The Invoice Pro uses cookies and similar technologies across the website and platform.",
        robots: "index,follow",
        canonicalPath: "/cookie-policy",
        type: "article",
      };
    case "/acceptable-use":
      return {
        title: `Acceptable Use Policy | ${BASE_TITLE}`,
        description: "Read the acceptable use policy for The Invoice Pro and the standards for platform usage.",
        robots: "index,follow",
        canonicalPath: "/acceptable-use",
        type: "article",
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

    upsertMeta('meta[name="description"]', { name: "description", content: seo.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: seo.robots });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: seo.type || "website" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: DEFAULT_IMAGE_URL });
    upsertMeta('meta[property="og:image:type"]', { property: "og:image:type", content: "image/png" });
    upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: "1200" });
    upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: "630" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: BASE_TITLE });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: DEFAULT_IMAGE_URL });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    const existingStructuredData = document.head.querySelectorAll('script[data-seo-jsonld="true"]');
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
