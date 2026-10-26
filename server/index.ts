import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { registerRoutes } from "./routes";
import { attachUser } from "./auth";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.disable("x-powered-by");

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Content-Security-Policy", "frame-ancestors 'none'");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (isProduction) {
    res.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }
  next();
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Probá de nuevo en un minuto." },
});

const shareLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Probá de nuevo en un minuto." },
});

// Reject abusive traffic before parsing or authenticating it.
app.use("/api", apiLimiter);
app.use("/api/shared", shareLimiter);

// Disable compressed request bodies: body-parser's inflate path was the crash
// vector, and browsers never compress JSON payloads.
app.use(express.json({ inflate: false }));
app.use(express.urlencoded({ extended: false, inflate: false }));
app.use(attachUser);

app.use((req, res, next) => {
  const start = Date.now();
  // A share token is a credential, so it must never reach the logs.
  const path = req.path.replace(/^\/api\/shared\/[^/]+/, "/api/shared/:token");
  // Response bodies carry quote data (client contact details) and, for the share
  // endpoints, tokens. Keep that noise out of production logs.
  const logResponseBody = app.get("env") === "development";
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && logResponseBody) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // The share page URL contains the access token. Keep it out of search indexes
  // and caches, and stop it leaking through Referer to third-party assets.
  app.use("/s", (_req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    res.set("Referrer-Policy", "no-referrer");
    res.set("Cache-Control", "no-store");
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Last middleware: normalize errors, log only server-side failures and never
  // expose internal messages. Rethrowing here made Express write to a socket
  // that had already received a response.
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const rawStatus = Number(err?.status ?? err?.statusCode);
    const status =
      Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;

    if (status >= 500) {
      console.error("[error]", err instanceof Error ? err.stack ?? err.message : err);
    }

    if (res.headersSent) {
      next(err);
      return;
    }

    res.status(status).json({
      message: status >= 500 ? "Internal Server Error" : "Solicitud inválida",
    });
  });

  // PaaS platforms (Railway, Render, Fly) inject the port to bind through
  // $PORT. Fall back to 5000 for local development.
  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
