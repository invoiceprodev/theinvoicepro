import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { apiConfig } from "./config.js";

const jwks = createRemoteJWKSet(new URL(`https://${apiConfig.auth0Domain}/.well-known/jwks.json`));

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  roles: string[];
}

export async function verifyAccessToken(token: string): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://${apiConfig.auth0Domain}/`,
    audience: apiConfig.auth0Audience,
  });

  return mapPayload(payload);
}

function mapPayload(payload: JWTPayload): AuthenticatedUser {
  const roleClaim = payload["https://theinvoicepro.co.za/roles"];
  const roles = Array.isArray(roleClaim) ? roleClaim.map(String) : [];

  return {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    nickname: typeof payload.nickname === "string" ? payload.nickname : undefined,
    roles,
  };
}
