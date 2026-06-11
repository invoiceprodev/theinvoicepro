import { Router, type Request, type Response } from "express";
import { apiConfig } from "./config.js";

const authRouter = Router();

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
  domain: string,
  clientId: string,
  connection: string,
  path: string,
  body: Record<string, unknown>,
  parseAsText = false,
): Promise<T> {
  const response = await fetch(`https://${domain}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      connection: connection,
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

/**
 * POST /auth/signup
 * Backend proxy for Auth0 Database Connection signup
 * 
 * Body:
 * - domain: Auth0 domain (customer or admin)
 * - clientId: Auth0 client ID
 * - connection: Auth0 database connection name
 * - name: User's full name
 * - username: Username
 * - email: Email address
 * - password: User password
 */
authRouter.post("/signup", async (req: Request, res: Response) => {
  try {
    const { domain, clientId, connection, name, username, email, password } = req.body;

    if (!domain || !clientId || !connection || !name || !username || !email || !password) {
      res.status(400).json({
        name: "ValidationError",
        message: "Missing required fields: domain, clientId, connection, name, username, email, password",
      });
      return;
    }

    const result = await auth0DbRequest<Record<string, unknown>>(
      domain,
      clientId,
      connection,
      "/dbconnections/signup",
      {
        username,
        email,
        password,
        name,
        given_name: name,
        user_metadata: {
          full_name: name,
        },
      },
    );

    res.json(result);
  } catch (error) {
    const normalized =
      error && typeof error === "object" && "message" in error
        ? (error as Auth0DbErrorShape)
        : {
            name: "Auth0RequestError",
            message: "We could not complete signup right now. Please try again.",
          };

    const userFacingError = {
      ...normalized,
      message: toUserFacingSignupMessage(normalized),
    };

    res.status(400).json(userFacingError);
  }
});

/**
 * POST /auth/forgot-password
 * Backend proxy for Auth0 Database Connection password reset
 * 
 * Body:
 * - domain: Auth0 domain (customer or admin)
 * - clientId: Auth0 client ID
 * - connection: Auth0 database connection name
 * - email: Email address for password reset
 */
authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { domain, clientId, connection, email } = req.body;

    if (!domain || !clientId || !connection || !email) {
      res.status(400).json({
        name: "ValidationError",
        message: "Missing required fields: domain, clientId, connection, email",
      });
      return;
    }

    const result = await auth0DbRequest<string>(
      domain,
      clientId,
      connection,
      "/dbconnections/change_password",
      {
        email,
      },
      true,
    );

    res.json({ message: result });
  } catch (error) {
    const normalized =
      error && typeof error === "object" && "message" in error
        ? (error as Auth0DbErrorShape)
        : {
            name: "Auth0RequestError",
            message: "Failed to send password reset email. Please try again.",
          };

    res.status(400).json(normalized);
  }
});

export { authRouter };
