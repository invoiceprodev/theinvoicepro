const DEFAULT_ROLE_CLAIM = "https://theinvoicepro.co.za/roles";

export type AuthAppKind = "customer" | "admin";

export interface ResolvedAuth0Config {
  domain?: string;
  clientId?: string;
  audience?: string;
  redirectUri: string;
  connection?: string;
  roleClaim: string;
}

export function getAuth0Config(appKind: AuthAppKind): ResolvedAuth0Config {
  const isAdmin = appKind === "admin";

  return {
    domain: isAdmin
      ? import.meta.env.VITE_ADMIN_AUTH0_DOMAIN || import.meta.env.VITE_AUTH0_DOMAIN
      : import.meta.env.VITE_CUSTOMER_AUTH0_DOMAIN || import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: isAdmin
      ? import.meta.env.VITE_ADMIN_AUTH0_CLIENT_ID || import.meta.env.VITE_AUTH0_CLIENT_ID
      : import.meta.env.VITE_CUSTOMER_AUTH0_CLIENT_ID || import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: isAdmin
      ? import.meta.env.VITE_ADMIN_AUTH0_AUDIENCE || import.meta.env.VITE_AUTH0_AUDIENCE
      : import.meta.env.VITE_CUSTOMER_AUTH0_AUDIENCE || import.meta.env.VITE_AUTH0_AUDIENCE,
    redirectUri: isAdmin
      ? import.meta.env.VITE_ADMIN_AUTH0_REDIRECT_URI || `${window.location.origin}/admin/callback`
      : import.meta.env.VITE_CUSTOMER_AUTH0_REDIRECT_URI ||
        import.meta.env.VITE_AUTH0_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`,
    connection: isAdmin
      ? import.meta.env.VITE_ADMIN_AUTH0_CONNECTION
      : import.meta.env.VITE_CUSTOMER_AUTH0_CONNECTION,
    roleClaim: import.meta.env.VITE_AUTH0_ROLE_CLAIM || DEFAULT_ROLE_CLAIM,
  };
}

export function isAuth0Configured(appKind: AuthAppKind) {
  const config = getAuth0Config(appKind);
  return Boolean(config.domain && config.clientId);
}
