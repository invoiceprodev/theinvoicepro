import { useEffect } from "react";

const DEFAULT_FAVICON = "/favicon.ico";

function ensureLink(rel: string) {
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  return link;
}

export function BrandingFaviconSync() {
  useEffect(() => {
    ensureLink("icon").href = DEFAULT_FAVICON;
    ensureLink("shortcut icon").href = DEFAULT_FAVICON;
    ensureLink("apple-touch-icon").href = DEFAULT_FAVICON;
  }, []);

  return null;
}
