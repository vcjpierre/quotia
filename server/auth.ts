import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  image?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let expectedIssuer: string | undefined;

const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

if (jwksUrl && authBaseUrl) {
  try {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    expectedIssuer = new URL(authBaseUrl).origin;
  } catch {
    console.error("[auth] Invalid NEON_AUTH_JWKS_URL or NEON_AUTH_BASE_URL; protected routes will return 401");
  }
} else {
  console.error(
    "[auth] Missing NEON_AUTH_BASE_URL or NEON_AUTH_JWKS_URL; protected routes will return 401",
  );
}

function categorizeJwtError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (code.includes("JWKS")) {
    return "jwks-fetch";
  }
  if (code.includes("EXPIRED")) {
    return "expired";
  }
  if (code.includes("CLAIM") || code.includes("AUDIENCE") || code.includes("ISSUER")) {
    return "claim-validation";
  }
  if (code.includes("SIGNATURE") || code.includes("JWS")) {
    return "signature";
  }
  return "invalid-token";
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token || !jwks || !expectedIssuer) {
    return next();
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["EdDSA"],
      issuer: expectedIssuer,
      audience: expectedIssuer,
    });

    if (!payload.sub || payload.sub === "anonymous") {
      return next();
    }

    if (typeof payload.exp !== "number") {
      return next();
    }

    req.user = {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      image: typeof payload.image === "string" ? payload.image : null,
    };
  } catch (error) {
    const category = categorizeJwtError(error);
    if (category === "jwks-fetch") {
      console.error("[auth] JWKS retrieval failed; tokens cannot be verified right now");
    } else {
      console.warn(`[auth] JWT verification failed (${category})`);
    }
  }

  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  next();
}
