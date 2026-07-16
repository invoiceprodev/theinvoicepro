import { isAdminContext } from "@/lib/admin-routing";
import type { Profile } from "@/types";

interface DashboardBrandingOptions {
  pathname: string;
  hostname: string;
  defaultTitleText: string;
  profile: Profile | null;
}

export function getDashboardBranding(options: DashboardBrandingOptions) {
  const allowClientBranding = !isAdminContext(options.pathname, options.hostname);
  const companyName = options.profile?.company_name?.trim() || options.profile?.full_name?.trim() || options.defaultTitleText;

  return {
    companyName,
    logoUrl: allowClientBranding ? options.profile?.logo_url || null : null,
  };
}
