import { getAuth0BridgeSnapshot } from "@/lib/auth0-bridge";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export class ApiClientError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

async function getAccessToken() {
  const auth = getAuth0BridgeSnapshot();
  if (!auth.isAuthenticated || !auth.getAccessTokenSilently) {
    return null;
  }

  return auth.getAccessTokenSilently();
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_URL or VITE_API_BASE_URL.");
  }

  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const bodyMessage =
      typeof body === "object" && body && "error" in body
        ? String((body as Record<string, unknown>).error)
        : typeof body === "object" && body && "message" in body
          ? String((body as Record<string, unknown>).message)
          : typeof body === "string"
            ? body
            : `API request failed: ${response.status}`;
    const bodyDescription =
      typeof body === "object" && body && "description" in body
        ? String((body as Record<string, unknown>).description)
        : "";

    throw new ApiClientError(bodyDescription ? `${bodyMessage} ${bodyDescription}` : bodyMessage, response.status, body);
  }

  return body as T;
}

export function hasApiBaseUrl() {
  return Boolean(API_BASE_URL);
}
