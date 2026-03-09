import { getAuth0Config, type AuthAppKind } from "@/lib/auth0-config";

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

function normalizeAuth0Error(payload: unknown, fallback: string): Auth0DbErrorShape {
  if (typeof payload === "string") {
    const text = payload.trim();
    return {
      name: "Auth0RequestError",
      message: text || fallback,
    };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const description =
      typeof record.description === "string"
        ? record.description
        : typeof record.error_description === "string"
          ? record.error_description
          : typeof record.message === "string"
            ? record.message
            : typeof record.error === "string"
              ? record.error
              : fallback;

    return {
      name: typeof record.error === "string" ? record.error : "Auth0RequestError",
      code: typeof record.code === "string" ? record.code : undefined,
      message: description,
    };
  }

  return {
    name: "Auth0RequestError",
    message: fallback,
  };
}

async function auth0DbRequest<T>(
  appKind: AuthAppKind,
  path: string,
  body: Record<string, unknown>,
  parseAsText = false,
): Promise<T> {
  const config = getAuth0Config(appKind);

  if (!config.domain || !config.clientId || !config.connection) {
    throw {
      name: "Auth0ConfigError",
      message: `Missing Auth0 ${appKind} database connection configuration. Check the ${appKind.toUpperCase()} Auth0 connection env vars.`,
    } satisfies Auth0DbErrorShape;
  }

  const response = await fetch(`https://${config.domain}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      connection: config.connection,
      ...body,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload =
    parseAsText || !contentType.includes("application/json") ? await response.text() : await response.json();

  if (!response.ok) {
    throw normalizeAuth0Error(payload, `Auth0 request failed with status ${response.status}.`);
  }

  return payload as T;
}

export async function signupWithAuth0Database(input: {
  appKind: AuthAppKind;
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  try {
    return await auth0DbRequest<Record<string, unknown>>(input.appKind, "/dbconnections/signup", {
      username: input.username,
      email: input.email,
      password: input.password,
      name: input.name,
      given_name: input.name,
      user_metadata: {
        full_name: input.name,
      },
    });
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
  return auth0DbRequest<string>(
    input.appKind,
    "/dbconnections/change_password",
    {
      email: input.email,
    },
    true,
  );
}
