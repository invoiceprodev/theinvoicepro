import { getAuth0Config, type AuthAppKind } from "@/lib/auth0-config";
import { apiRequest, hasApiBaseUrl } from "@/lib/api-client";

export interface Auth0DbErrorShape {
  name: string;
  code?: string;
  message: string;
}

function toUserFacingSignupMessage(error: Auth0DbErrorShape): string {
  const message = error.message.toLowerCase();

  if (message.includes("user already exists") || message.includes("already exists")) {
    return "An account with this email already exists. Try logging in or resetting your password.";
  }

  if (message.includes("password is too weak") || message.includes("passwordstrengtherror")) {
    return "Your password is too weak. Use at least 8 characters with a mix of upper and lowercase letters, numbers, and symbols.";
  }

  if (message.includes("missing username")) {
    return "Signup is temporarily unavailable because the account connection requires a username. Contact support if this continues.";
  }

  if (message.includes("connection must be enabled for this client")) {
    return "Signup is temporarily unavailable for this app. Please try again later.";
  }

  if (message.includes("invalid password")) {
    return "That password does not meet the security requirements. Try a stronger password.";
  }

  if (message.includes("invalid sign up")) {
    return "We could not create your account. Check that the email is not already registered and that your password meets the requirements, then try again.";
  }

  if (message.includes("invalid signup") || message.includes("signup")) {
    return "We could not complete signup right now. Please review your details and try again.";
  }

  return error.message;
}

export async function signupWithAuth0Database(input: {
  appKind: AuthAppKind;
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  try {
    const config = getAuth0Config(input.appKind);

    if (!config.domain || !config.clientId || !config.connection) {
      throw {
        name: "Auth0ConfigError",
        message: `Missing Auth0 ${input.appKind} database connection configuration.`,
      } satisfies Auth0DbErrorShape;
    }

    // Check if we have an API base URL, otherwise fall back to direct call (not recommended for production)
    if (!hasApiBaseUrl()) {
      throw {
        name: "ConfigError",
        message: "API gateway is not configured. Please check your environment setup.",
      } satisfies Auth0DbErrorShape;
    }

    // Call the backend API endpoint instead of Auth0 directly
    const result = await apiRequest<Record<string, unknown>>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        domain: config.domain,
        clientId: config.clientId,
        connection: config.connection,
        name: input.name,
        username: input.username,
        email: input.email,
        password: input.password,
      }),
    });

    return result;
  } catch (error) {
    const normalized =
      error && typeof error === "object" && "message" in error
        ? (error as Auth0DbErrorShape)
        : {
            name: "Auth0RequestError",
            message: "We could not complete signup right now. Please try again.",
          };

    throw {
      ...normalized,
      message: toUserFacingSignupMessage(normalized),
    } satisfies Auth0DbErrorShape;
  }
}

export async function sendAuth0PasswordResetEmail(input: { appKind: AuthAppKind; email: string }) {
  const config = getAuth0Config(input.appKind);

  if (!config.domain || !config.clientId || !config.connection) {
    throw {
      name: "Auth0ConfigError",
      message: `Missing Auth0 ${input.appKind} database connection configuration.`,
    } satisfies Auth0DbErrorShape;
  }

  // Check if we have an API base URL
  if (!hasApiBaseUrl()) {
    throw {
      name: "ConfigError",
      message: "API gateway is not configured. Please check your environment setup.",
    } satisfies Auth0DbErrorShape;
  }

  // Call the backend API endpoint instead of Auth0 directly
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      domain: config.domain,
      clientId: config.clientId,
      connection: config.connection,
      email: input.email,
    }),
  });
}
