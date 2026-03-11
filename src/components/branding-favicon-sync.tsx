import { useEffect, useState } from "react";
import { getProfileBridgeSnapshot, subscribeProfileBridge } from "@/lib/profile-bridge";

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
  const [profileSnapshot, setProfileSnapshot] = useState(getProfileBridgeSnapshot());

  useEffect(() => subscribeProfileBridge(setProfileSnapshot), []);

  useEffect(() => {
    const href = profileSnapshot.profile?.logo_url || DEFAULT_FAVICON;

    ensureLink("icon").href = href;
    ensureLink("shortcut icon").href = href;
    ensureLink("apple-touch-icon").href = href;
  }, [profileSnapshot.profile?.logo_url]);

  return null;
}
