import "dotenv/config";
import express, { NextFunction, Response, type Request } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
// @ts-ignore - memorystore has no types
import { scryptSync, timingSafeEqual } from "crypto";
import MemoryStoreFactory from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { log, serveStatic, setupVite } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
// In production, only allow explicit origins from CORS_ORIGIN (comma-separated).
// In development, reflect the request origin (or '*' as a last resort).
app.use((req, res, next) => {
  const reqOrigin = (req.headers.origin as string) || undefined;
  const isProd = process.env.NODE_ENV === "production";
  const allowed = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let originToSet: string | undefined;

  if (allowed.length > 0) {
    if (reqOrigin && allowed.includes(reqOrigin)) originToSet = reqOrigin;
  } else if (!isProd) {
    originToSet = reqOrigin || "*";
  }

  if (originToSet) {
    res.header("Access-Control-Allow-Origin", originToSet);
    res.header("Vary", "Origin");
    // Credentials cannot be used with wildcard origin
    if (originToSet !== "*") {
      res.header("Access-Control-Allow-Credentials", "true");
    }
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    // For disallowed origins in prod, end preflight quickly
    if (
      isProd &&
      allowed.length > 0 &&
      (!reqOrigin || !allowed.includes(reqOrigin))
    ) {
      return res.status(204).end();
    }
    return res.sendStatus(204);
  }

  if (isProd && allowed.length > 0) {
    if (!reqOrigin || !allowed.includes(reqOrigin)) {
      return res.status(403).json({ error: "CORS origin not allowed" });
    }
  }

  next();
});

// Simple in-memory rate limiter
type Counter = { count: number; resetAt: number };
const rateMap = new Map<string, Counter>();
function rateLimiter({
  windowMs,
  max,
  prefix,
}: {
  windowMs: number;
  max: number;
  prefix: string;
}) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const key = `${prefix}:${ip}`;
    const now = Date.now();
    const entry = rateMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    }
    entry.count += 1;
    next();
  };
}

// Apply targeted rate limits (auth endpoints stricter)
app.use(
  "/api/auth/",
  rateLimiter({ windowMs: 60_000, max: 15, prefix: "auth" })
);
app.use(
  "/api/share/",
  rateLimiter({ windowMs: 60_000, max: 120, prefix: "share" })
);

// Session + Auth
const MemoryStore = MemoryStoreFactory(session);
const sessionSecret = process.env.SESSION_SECRET || "dev-secret";
app.use(
  session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    secret: sessionSecret,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

function verifyPassword(stored: string, supplied: string): boolean {
  if (stored?.startsWith("scrypt$")) {
    const [, b64salt, b64hash] = stored.split("$");
    if (!b64salt || !b64hash) return false;
    const salt = Buffer.from(b64salt, "base64");
    const hash = Buffer.from(b64hash, "base64");
    const test = scryptSync(supplied, salt, hash.length);
    return timingSafeEqual(hash, test);
  }
  // Fallback for legacy dev user
  return stored === supplied;
}

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false, { message: "Invalid credentials" });
      if (!verifyPassword(user.password, password))
        return done(null, false, { message: "Invalid credentials" });
      return done(null, { id: user.id, username: user.username });
    } catch (e) {
      return done(e as any);
    }
  })
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);
    done(null, { id: user.id, username: user.username });
  } catch (e) {
    done(e as any);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
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
      if (capturedJsonResponse) {
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
  // Warn about missing environment variables that affect AI/services
  const missingEnv: string[] = [];
  if (!process.env.GEMINI_API_KEY) missingEnv.push("GEMINI_API_KEY");
  if (!process.env.BIBLE_API_KEY) missingEnv.push("BIBLE_API_KEY");
  if (!process.env.OPENAI_API_KEY) missingEnv.push("OPENAI_API_KEY");
  if (missingEnv.length) {
    log(
      `Warning: missing env vars: ${missingEnv.join(
        ", "
      )} — some features will be degraded.`,
      "env"
    );
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  // Fix for macOS: use simple listen() format
  server.listen(port, () => {
    log(`🚀 Divine AI Server running on http://localhost:${port}`);
    log(
      `📖 Bible API: ${
        process.env.BIBLE_API_KEY ? "✓ Connected" : "⚠ Using fallback"
      }`
    );
    log(
      `🤖 Gemini AI: ${
        process.env.GEMINI_API_KEY ? "✓ Connected" : "✗ Missing"
      }`
    );
    log(
      `🎙️ OpenAI Audio: ${
        process.env.OPENAI_API_KEY ? "✓ Connected" : "✗ Missing"
      }`
    );
  });
})();
