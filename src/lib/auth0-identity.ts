import type { User } from "@auth0/auth0-react";
import { getAuth0Config } from "./auth0-config";

export interface AppIdentity {
  id: string;
  name: string;
  email?: string;
  role: "user" | "admin";
}

export function isAuth0EmailVerified(user?: User): boolean {
  if (!user?.email) return true;
  return (user as User & { email_verified?: boolean }).email_verified === true;
}

export function getAuth0Roles(user?: User): string[] {
  if (!user) return [];
  const roleClaim = getAuth0Config("customer").roleClaim;
  const roles = user[roleClaim];
  return Array.isArray(roles) ? roles.map(String) : [];
}

export function getAppRoleFromUser(user?: User): "user" | "admin" {
  const roles = getAuth0Roles(user).map((role) => role.toLowerCase());
  return roles.includes("admin") ? "admin" : "user";
}

export function getAppIdentityFromUser(user?: User): AppIdentity | null {
  if (!user?.sub) return null;

  return {
    id: user.sub,
    name: user.name || user.nickname || user.email || "User",
    email: user.email,
    role: getAppRoleFromUser(user),
  };
}
