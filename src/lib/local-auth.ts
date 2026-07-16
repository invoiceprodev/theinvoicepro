import type { Profile, Subscription } from "@/types";

const STORAGE_KEY = "invoicepro_local_auth";

interface LocalAuthSession {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
}

function readSession(): LocalAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalAuthSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: LocalAuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function isLocalAuthEnabled() {
  return import.meta.env.DEV;
}

export function getLocalAuthSession() {
  return readSession();
}

export async function signInLocally(
  email: string,
  password: string,
  role: "user" | "admin" = "user",
  displayName?: string,
) {
  if (!isLocalAuthEnabled()) {
    throw new Error("Local auth is only available in development mode.");
  }

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const session: LocalAuthSession = {
    userId: `local-${role}-${normalizedEmail.replace(/[^a-z0-9]+/g, "-")}`,
    email: normalizedEmail,
    name: displayName?.trim() || normalizedEmail.split("@")[0] || "Local User",
    role,
    createdAt: new Date().toISOString(),
  };

  writeSession(session);
  return session;
}

export async function signUpLocally(
  name: string,
  email: string,
  password: string,
  role: "user" | "admin" = "user",
) {
  if (!isLocalAuthEnabled()) {
    throw new Error("Local auth is only available in development mode.");
  }

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }

  return signInLocally(email, password, role, name);
}

export function signOutLocally() {
  writeSession(null);
}

export function getLocalProfile(): Profile | null {
  const session = readSession();
  if (!session) return null;

  return {
    id: session.userId,
    full_name: session.name,
    role: session.role,
    business_email: session.email,
    company_name: session.name,
    account_status: "active",
    created_at: session.createdAt,
    updated_at: session.createdAt,
  };
}

export function getLocalSubscription(): Subscription | null {
  const session = readSession();
  if (!session) return null;

  return {
    id: `${session.userId}-subscription`,
    user_id: session.userId,
    plan_id: "local-starter",
    status: "active",
    start_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    plan: {
      id: "local-starter",
      name: "Starter",
      description: "Local development plan",
      price: 0,
      currency: "ZAR",
      billing_cycle: "monthly",
      features: ["Local dev access"],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  } as Subscription;
}
