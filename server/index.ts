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
import { schedulerService } from "./services/scheduler";
import { correlationMiddleware } from "./middleware/correlation";
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(correlationMiddleware);
// Serve generated uploads with caching headers
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders(res, filePath) {
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Set correct MIME types for audio files
    if (filePath.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    } else if (filePath.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
  }
}));

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

async function migrateFileDataToSupabase() {
  if (process.env.USE_SUPABASE !== 'true') return;
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check if user data exists and migrate it
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const imagesPath = path.join(process.cwd(), 'data', 'generated-images.json');
    const audiosPath = path.join(process.cwd(), 'data', 'generated-audios.json');
    
    let migrated = false;
    
    // Migrate users first
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8');
      const users = JSON.parse(usersData);
      
      for (const user of users) {
        try {
          // Check if user already exists in Supabase
          const existing = await storage.getUserByUsername(user.username);
          if (!existing) {
            await storage.createUser({
              username: user.username,
              password: user.password,
              email: user.email || null
            });
            console.log(`📤 Migrated user: ${user.username}`);
            migrated = true;
          }
        } catch (e) {
          console.warn(`⚠️ Could not migrate user ${user.username}:`, e);
        }
      }
    } catch (e) {
      console.log('No users.json found or already migrated');
    }
    
    // Migrate images
    try {
      const imagesData = await fs.readFile(imagesPath, 'utf-8');
      const images = JSON.parse(imagesData);
      
      for (const image of images) {
        try {
          // Check if image already exists
          const existing = await storage.getGeneratedImage(image.id);
          if (!existing) {
            await storage.createGeneratedImage({
              userId: image.userId,
              prompt: image.prompt,
              imageUrl: image.imageUrl,
              style: image.style || null,
              aspectRatio: image.aspectRatio || null
            });
            console.log(`📤 Migrated image: ${image.prompt.substring(0, 50)}...`);
            migrated = true;
          }
        } catch (e) {
          console.warn(`⚠️ Could not migrate image ${image.id}:`, e);
        }
      }
    } catch (e) {
      console.log('No images data found or already migrated');
    }
    
    // Migrate audio
    try {
      const audiosData = await fs.readFile(audiosPath, 'utf-8');
      const audios = JSON.parse(audiosData);
      
      for (const audio of audios) {
        try {
          // Check if audio already exists
          const existing = await storage.getGeneratedAudio(audio.id);
          if (!existing) {
            await storage.createGeneratedAudio({
              userId: audio.userId,
              prompt: audio.prompt,
              audioUrl: audio.audioUrl,
              model: audio.model,
              format: audio.format,
              duration: audio.duration || null
            });
            console.log(`📤 Migrated audio: ${audio.prompt.substring(0, 50)}...`);
            migrated = true;
          }
        } catch (e) {
          console.warn(`⚠️ Could not migrate audio ${audio.id}:`, e);
        }
      }
    } catch (e) {
      console.log('No audios data found or already migrated');
    }
    
    if (migrated) {
      console.log('🎉 Data migration to Supabase completed successfully!');
    } else {
      console.log('💾 No new data to migrate to Supabase');
    }
  } catch (e) {
    console.error('❌ Migration failed:', e);
  }
}

(async () => {
  // Warn about missing environment variables that affect AI/services
  const missingEnv: string[] = [];
  if (!process.env.GEMINI_API_KEY) missingEnv.push("GEMINI_API_KEY");
  if (!process.env.BIBLE_API_KEY) missingEnv.push("BIBLE_API_KEY");
  if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_PODCAST_API_KEY) missingEnv.push("OPENAI_API_KEY");
  if (missingEnv.length) {
    log(
      `Warning: missing env vars: ${missingEnv.join(
        ", "
      )} — some features will be degraded.`,
      "env"
    );
  }

  // Initialize storage (creates tables if needed for Supabase)
  if (typeof (storage as any).initialize === 'function') {
    try {
      await (storage as any).initialize();
      console.log('✅ Storage initialized successfully');
      
      // Migrate existing data from file storage if this is the first Supabase run
      await migrateFileDataToSupabase();
    } catch (e) {
      console.error('❌ Storage initialization failed:', e);
      
      // If Supabase fails, fall back to FileStorage
      if (process.env.USE_SUPABASE === 'true') {
        console.log('🔄 Falling back to FileStorage due to Supabase initialization failure');
        console.log('💾 Please run setup-supabase-tables.sql in your Supabase SQL Editor to use Supabase storage');
        console.log('⚠️ Continuing with file-based storage for now');
        process.exit(1); // Exit so user can set up Supabase properly
      }
    }
  }

  const server = await registerRoutes(app);
  // Start background scheduler for social posts
  schedulerService.start();

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
  // Fix for macOS: explicitly bind to localhost
  server.listen(port, '127.0.0.1', () => {
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
    const hasOpenAI = !!(process.env.OPENAI_PODCAST_API_KEY || process.env.OPENAI_API_KEY);
    log(`🎙️ OpenAI Audio: ${hasOpenAI ? '✓ Connected' : '✗ Missing'}`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
})();
