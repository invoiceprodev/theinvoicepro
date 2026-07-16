const ADMIN_SUBDOMAIN = "admin.theinvoicepro.co.za";

const normalizePath = (path: string) => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const isAdminHostname = (hostname?: string) => {
  const currentHostname = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  return currentHostname === ADMIN_SUBDOMAIN;
};

export const isAdminPathname = (pathname?: string) => {
  const currentPathname = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return currentPathname === "/admin" || currentPathname.startsWith("/admin/");
};

export const isAdminContext = (pathname?: string, hostname?: string) =>
  isAdminHostname(hostname) || isAdminPathname(pathname);

export const getAdminRoute = (path: string, adminHost = isAdminHostname()) => {
  const normalizedPath = normalizePath(path);
  if (adminHost) {
    return normalizedPath;
  }
  if (normalizedPath === "/") {
    return "/admin";
  }
  return `/admin${normalizedPath}`;
};

export const stripAdminPrefix = (pathname: string) => {
  if (!isAdminPathname(pathname)) {
    return pathname;
  }

  const stripped = pathname.slice("/admin".length);
  return stripped || "/";
};
