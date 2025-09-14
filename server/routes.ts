import {
    insertGeneratedImageSchema,
    insertPodcastSchema,
    insertScriptureCollectionSchema,
    insertSermonSchema,
    insertVoiceRecordingSchema
} from "@shared/schema";
import { randomBytes, scryptSync } from 'crypto';
import type { Express, Request } from "express";
import express from "express";
import { promises as fs } from 'fs';
import { createServer, type Server } from "http";
import multer from 'multer';
import passport from 'passport';
import path from 'path';
import { sendEmail } from './mailer';
import { audioProcessorService } from "./services/audio-processor";
import { bibleApiService } from "./services/bible-api";
import { elevenLabsService } from "./services/elevenlabs";
import * as geminiService from "./services/gemini";
import { generateVideo } from "./services/veo";
import { storage } from "./storage";
import { rssGenerator } from "./services/rss-generator";
import { enhancedPodcastGenerator } from "./services/enhanced-podcast-generator";

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

function getReqUserId(req: Request) {
  return (req as any).user?.id || 'mock-user-1';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints (optional; enabled by REQUIRE_AUTH=true)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email } = req.body as { username: string; password: string; email?: string };
      if (!username || !password) return res.status(400).json({ error: 'username and password required' });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ error: 'username taken' });
      // Hash password with scrypt
      const salt = randomBytes(16);
      const hash = scryptSync(password, salt, 32);
      const stored = `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
      const user = await storage.createUser({ username, password: stored, email: email ?? null });
      res.status(201).json({ id: user.id, username: user.username });
    } catch (e) {
      res.status(400).json({ error: 'registration failed' });
    }
  });
  app.get('/api/auth/me', async (req, res) => {
    const anyReq = req as any;
    if (!anyReq.user) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ id: anyReq.user.id, username: anyReq.user.username });
  });
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const anyReq = req as any;
    res.json({ id: anyReq.user.id, username: anyReq.user.username });
  });
  app.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(204).send();
    });
  });

  // Ensure mock user exists (for dev/default access)
  const MOCK_USER_ID = 'mock-user-1';
  const existingUser = await storage.getUser(MOCK_USER_ID);
  if (!existingUser) {
    await storage.createUser({
      username: "pastor",
      password: "password",
      email: "pastor@church.com",
    });
  }

  // Health Check Endpoint with Live API Status
  app.get('/api/health', async (req, res) => {
    const health: any = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      apis: {
        bible: { configured: !!process.env.BIBLE_API_KEY, status: 'unknown' },
        gemini: { configured: !!process.env.GEMINI_API_KEY, status: 'unknown' },
        openai: { configured: !!process.env.OPENAI_API_KEY, status: 'unknown' }
      },
      features: {
        authentication: process.env.REQUIRE_AUTH === 'true',
        database: !!process.env.DATABASE_URL,
        email: !!process.env.SMTP_HOST
      }
    };

    // Test Bible API if configured
    if (process.env.BIBLE_API_KEY) {
      try {
        const start = Date.now();
        await bibleApiService.listBibles({ limit: 1 });
        health.apis.bible.status = 'operational';
        health.apis.bible.latency = Date.now() - start;
      } catch {
        health.apis.bible.status = 'error';
      }
    }

    // Test Gemini API if configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const start = Date.now();
        await geminiService.summarizeArticle('test');
        health.apis.gemini.status = 'operational';
        health.apis.gemini.latency = Date.now() - start;
      } catch {
        health.apis.gemini.status = 'error';
      }
    }

    const allOperational = Object.values(health.apis)
      .filter((api: any) => api.configured)
      .every((api: any) => api.status === 'operational');
    
    health.status = allOperational ? 'operational' : 'degraded';
    
    res.status(health.status === 'operational' ? 200 : 503).json(health);
  });

  // Minimal, non-secret health check (no external calls)
  // Returns only booleans and environment flags; safe for load balancers
  app.get('/api/healthz', (req, res) => {
    const payload = {
      ok: true,
      timestamp: new Date().toISOString(),
      env: {
        bibleApiKey: !!process.env.BIBLE_API_KEY,
        geminiApiKey: !!process.env.GEMINI_API_KEY,
        openAiApiKey: !!process.env.OPENAI_API_KEY,
        requireAuth: process.env.REQUIRE_AUTH === 'true',
      },
    } as const;
    res.status(200).json(payload);
  });

  // Optional auth gate
  app.use('/api', (req, res, next) => {
    if (process.env.REQUIRE_AUTH === 'true') {
      const p = req.path;
      if (p.startsWith('/auth') || p.startsWith('/share') || p.startsWith('/bibles') || p.startsWith('/health')) return next();
      if (!(req as any).user) return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });

  // Bible search and scripture endpoints
  app.get("/api/bibles", async (req, res) => {
    try {
      const { language, abbreviation, name, ids, includeFullDetails } = req.query as {
        language?: string; abbreviation?: string; name?: string; ids?: string; includeFullDetails?: string;
      };
      const data = await bibleApiService.listBibles({
        language,
        abbreviation,
        name,
        ids,
        includeFullDetails: includeFullDetails === 'true',
      });
      res.json(data);
    } catch (error) {
      console.error('Bibles list error:', error);
      res.status(500).json({ error: 'Failed to fetch bibles' });
    }
  });

  app.get("/api/bibles/:bibleId", async (req, res) => {
    try {
      const { bibleId } = req.params;
      const data = await bibleApiService.getBible(bibleId);
      res.json(data);
    } catch (error) {
      console.error('Bible details error:', error);
      res.status(500).json({ error: 'Failed to fetch bible details' });
    }
  });

  app.get("/api/bibles/:bibleId/books", async (req, res) => {
    try {
      const { bibleId } = req.params;
      const data = await bibleApiService.getBooks(bibleId);
      res.json(data);
    } catch (error) {
      console.error('Books fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

  app.get("/api/bibles/:bibleId/books/:bookId", async (req, res) => {
    try {
      const { bibleId, bookId } = req.params;
      const data = await bibleApiService.getBook(bibleId, bookId);
      res.json(data);
    } catch (error) {
      console.error('Book fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch book' });
    }
  });

  app.get("/api/bibles/:bibleId/books/:bookId/chapters", async (req, res) => {
    try {
      const { bibleId, bookId } = req.params;
      const data = await bibleApiService.getChaptersForBook(bibleId, bookId);
      res.json(data);
    } catch (error) {
      console.error('Book chapters fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch chapters' });
    }
  });

  app.get("/api/bibles/:bibleId/chapters/:chapterId", async (req, res) => {
    try {
      const { bibleId, chapterId } = req.params;
      const data = await bibleApiService.getChapter(bibleId, chapterId);
      res.json(data);
    } catch (error) {
      console.error('Chapter fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch chapter' });
    }
  });

  app.get("/api/bibles/:bibleId/chapters/:chapterId/verses", async (req, res) => {
    try {
      const { bibleId, chapterId } = req.params;
      const data = await bibleApiService.getChapterVerses(bibleId, chapterId);
      res.json(data);
    } catch (error) {
      console.error('Chapter verses fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch chapter verses' });
    }
  });

  app.get("/api/bibles/:bibleId/verses/:verseId", async (req, res) => {
    try {
      const { bibleId, verseId } = req.params;
      const data = await bibleApiService.getVerseById(bibleId, verseId);
      res.json(data);
    } catch (error) {
      console.error('Verse fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch verse' });
    }
  });

  app.get("/api/bibles/:bibleId/passages/:passageId", async (req, res) => {
    try {
      const { bibleId, passageId } = req.params;
      const data = await bibleApiService.getPassage(bibleId, passageId);
      res.json(data);
    } catch (error) {
      console.error('Passage fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch passage' });
    }
  });

  app.get("/api/bibles/:bibleId/verse-by-reference", async (req, res) => {
    try {
      const { bibleId } = req.params;
      const { ref, version = 'NIV' } = req.query as { ref?: string; version?: string };
      if (!ref) return res.status(400).json({ error: 'ref query parameter is required (e.g. John 3:16)' });
      const data = await bibleApiService.getVerseByReference(bibleId, ref, version);
      if (!data) return res.status(404).json({ error: 'Verse not found' });
      res.json(data);
    } catch (error) {
      console.error('Verse-by-reference error:', error);
      res.status(500).json({ error: 'Failed to fetch verse by reference' });
    }
  });

  app.get("/api/bibles/:bibleId/search", async (req, res) => {
    try {
      const { bibleId } = req.params;
      const { query, limit = '20', version = 'NIV' } = req.query as { query?: string; limit?: string; version?: string };
      if (!query) return res.status(400).json({ error: 'Query parameter is required' });
      const results = await bibleApiService.searchVerses(query, version, parseInt(limit, 10), bibleId);
      res.json(results);
    } catch (error) {
      console.error('Bible search error:', error);
      res.status(500).json({ error: 'Failed to search verses' });
    }
  });

  app.get("/api/scripture/search", async (req, res) => {
    try {
      const { query, version = 'NIV', limit = 20 } = req.query as {
        query: string;
        version?: string;
        limit?: string;
      };

      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const results = await bibleApiService.searchVerses(query, version, parseInt(limit.toString(), 10));
      res.json(results);
    } catch (error) {
      console.error('Scripture search error:', error);
      res.status(500).json({ error: "Failed to search scripture" });
    }
  });

  app.get("/api/scripture/verse/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const { version = 'NIV' } = req.query as { version?: string };

      const verse = await bibleApiService.getVerse(reference, version);
      if (!verse) {
        return res.status(404).json({ error: "Verse not found" });
      }

      res.json(verse);
    } catch (error) {
      console.error('Verse fetch error:', error);
      res.status(500).json({ error: "Failed to fetch verse" });
    }
  });

  app.get("/api/scripture/cross-references/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const crossRefs = await bibleApiService.getCrossReferences(reference);
      res.json(crossRefs);
    } catch (error) {
      console.error('Cross references error:', error);
      res.status(500).json({ error: "Failed to fetch cross references" });
    }
  });

  app.get("/api/scripture/topical/:topic", async (req, res) => {
    try {
      const { topic } = req.params;
      const verses = await bibleApiService.getTopicalVerses(topic);
      res.json(verses);
    } catch (error) {
      console.error('Topical verses error:', error);
      res.status(500).json({ error: "Failed to fetch topical verses" });
    }
  });

  // Sermon endpoints
  app.get("/api/sermons", async (req, res) => {
    try {
      const sermons = await storage.getSermonsByUser(getReqUserId(req));
      res.json(sermons);
    } catch (error) {
      console.error('Sermons fetch error:', error);
      res.status(500).json({ error: "Failed to fetch sermons" });
    }
  });

  app.get("/api/sermons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const sermon = await storage.getSermon(id);
      
      if (!sermon) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      res.json(sermon);
    } catch (error) {
      console.error('Sermon fetch error:', error);
      res.status(500).json({ error: "Failed to fetch sermon" });
    }
  });

  app.post("/api/sermons", async (req, res) => {
    try {
      const validatedData = insertSermonSchema.parse(req.body);
      const sermon = await storage.createSermon({ ...validatedData, userId: getReqUserId(req) });
      res.status(201).json(sermon);
    } catch (error) {
      console.error('Sermon creation error:', error);
      res.status(400).json({ error: "Failed to create sermon" });
    }
  });

  // AI-powered sermon generation endpoints
  app.post("/api/ai/generate-sermon-outline", async (req, res) => {
    try {
      const { topic, scripture, audienceType, sermonLength, style } = req.body;
      
      if (!topic || !scripture) {
        return res.status(400).json({ error: "Topic and scripture are required" });
      }

      const outline = await geminiService.generateAdvancedSermonOutline(
        topic, 
        scripture, 
        audienceType, 
        sermonLength, 
        style
      );
      
      res.json(outline);
    } catch (error) {
      console.error('Sermon outline generation error:', error);
      res.status(500).json({ error: "Failed to generate sermon outline" });
    }
  });

  app.post("/api/ai/biblical-insights", async (req, res) => {
    try {
      const { passage } = req.body;
      
      if (!passage) {
        return res.status(400).json({ error: "Passage is required" });
      }

      const insights = await geminiService.generateBiblicalInsights(passage);
      res.json(insights);
    } catch (error) {
      console.error('Biblical insights generation error:', error);
      res.status(500).json({ error: "Failed to generate biblical insights" });
    }
  });

  app.post("/api/ai/pastoral-guidance", async (req, res) => {
    try {
      const { question, context } = req.body;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const guidance = await geminiService.providePastoralGuidance(question, context);
      res.json({ guidance });
    } catch (error) {
      console.error('Pastoral guidance error:', error);
      res.status(500).json({ error: "Failed to provide pastoral guidance" });
    }
  });

  app.post("/api/ai/sentiment", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const sentiment = await geminiService.analyzeSentiment(text);
      res.json(sentiment);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({ error: "Failed to analyze sentiment" });
    }
  });

  app.post("/api/ai/semantic-scripture-search", async (req, res) => {
    try {
      const { query, context } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const results = await geminiService.semanticScriptureSearch(query, context);
      res.json(results);
    } catch (error) {
      console.error('Semantic scripture search error:', error);
      res.status(500).json({ error: "Failed to perform scripture search" });
    }
  });

  app.post("/api/ai/generate-illustrations", async (req, res) => {
    try {
      const { theme, audience } = req.body;
      
      if (!theme || !audience) {
        return res.status(400).json({ error: "Theme and audience are required" });
      }

      const illustrations = await geminiService.generateSermonIllustrations(theme, audience);
      res.json(illustrations);
    } catch (error) {
      console.error('Illustration generation error:', error);
      res.status(500).json({ error: "Failed to generate illustrations" });
    }
  });

  app.put("/api/sermons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSermonSchema.partial().parse(req.body);
      const sermon = await storage.updateSermon(id, validatedData);
      
      if (!sermon) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      res.json(sermon);
    } catch (error) {
      console.error('Sermon update error:', error);
      res.status(400).json({ error: "Failed to update sermon" });
    }
  });

  app.delete("/api/sermons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSermon(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Sermon not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Sermon deletion error:', error);
      res.status(500).json({ error: "Failed to delete sermon" });
    }
  });

  // Podcast endpoints
  app.get("/api/podcasts", async (req, res) => {
    try {
      const podcasts = await storage.getPodcastsByUser(getReqUserId(req));
      res.json(podcasts);
    } catch (error) {
      console.error('Podcasts fetch error:', error);
      res.status(500).json({ error: "Failed to fetch podcasts" });
    }
  });

  // RSS Feed Generation
  app.get("/api/podcasts/feed.xml", async (req, res) => {
    try {
      const podcasts = await storage.getPodcastsByUser(getReqUserId(req));
      const channel = {
        title: "Divine AI Podcast Channel",
        description: "AI-generated podcasts for pastoral ministry and spiritual growth",
        link: `${req.protocol}://${req.get('host')}`,
        language: "en-US",
        copyright: `© ${new Date().getFullYear()} Divine AI`,
        author: "Divine AI",
        email: "podcast@divine-ai.com",
        image: `${req.protocol}://${req.get('host')}/podcast-cover.jpg`,
        category: "Religion & Spirituality",
        explicit: false,
        podcasts
      };
      
      const rss = rssGenerator.generateRSS(channel);
      res.set('Content-Type', 'application/rss+xml');
      res.send(rss);
    } catch (error) {
      console.error('RSS feed generation error:', error);
      res.status(500).json({ error: "Failed to generate RSS feed" });
    }
  });

  // Get platform submission links
  app.get("/api/podcasts/platforms", async (req, res) => {
    try {
      const feedUrl = `${req.protocol}://${req.get('host')}/api/podcasts/feed.xml`;
      const platforms = rssGenerator.generatePlatformLinks(feedUrl);
      res.json({ feedUrl, platforms });
    } catch (error) {
      console.error('Platform links error:', error);
      res.status(500).json({ error: "Failed to generate platform links" });
    }
  });

  // Scripture collections endpoints
  app.get('/api/scripture-collections', async (req, res) => {
    try {
      const collections = await storage.getScriptureCollectionsByUser(getReqUserId(req));
      res.json(collections);
    } catch (error) {
      console.error('Scripture collections fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch scripture collections' });
    }
  });

  app.post('/api/scripture-collections', async (req, res) => {
    try {
      const validated = insertScriptureCollectionSchema.parse(req.body);
      const created = await storage.createScriptureCollection({ ...validated, userId: getReqUserId(req) });
      res.status(201).json(created);
    } catch (error) {
      console.error('Scripture collection create error:', error);
      res.status(400).json({ error: 'Failed to create collection' });
    }
  });

  app.patch('/api/scripture-collections/:id/add-verse', async (req, res) => {
    try {
      const { id } = req.params;
      const { reference, text, version } = req.body as { reference: string; text: string; version: string };
      if (!reference || !text) return res.status(400).json({ error: 'reference and text required' });
      const coll = await storage.getScriptureCollection(id);
      if (!coll) return res.status(404).json({ error: 'Collection not found' });
      const verses = (coll.verses || []).concat([{ reference, text, version }]);
      const updated = await storage.updateScriptureCollection(id, { verses });
      res.json(updated);
    } catch (error) {
      console.error('Scripture collection add-verse error:', error);
      res.status(400).json({ error: 'Failed to add verse' });
    }
  });

  app.patch('/api/scripture-collections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, verses } = req.body as { name?: string; description?: string; verses?: any[] };
      const updated = await storage.updateScriptureCollection(id, { name, description, verses } as any);
      if (!updated) return res.status(404).json({ error: 'Collection not found' });
      res.json(updated);
    } catch (error) {
      console.error('Scripture collection update error:', error);
      res.status(400).json({ error: 'Failed to update collection' });
    }
  });

  app.patch('/api/scripture-collections/:id/remove-verse', async (req, res) => {
    try {
      const { id } = req.params;
      const { index } = req.body as { index: number };
      const coll = await storage.getScriptureCollection(id);
      if (!coll) return res.status(404).json({ error: 'Collection not found' });
      const verses = [...(coll.verses || [])];
      if (index < 0 || index >= verses.length) return res.status(400).json({ error: 'Invalid index' });
      verses.splice(index, 1);
      const updated = await storage.updateScriptureCollection(id, { verses });
      res.json(updated);
    } catch (error) {
      console.error('Scripture collection remove-verse error:', error);
      res.status(400).json({ error: 'Failed to remove verse' });
    }
  });

  app.delete('/api/scripture-collections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteScriptureCollection(id);
      if (!ok) return res.status(404).json({ error: 'Collection not found' });
      res.status(204).send();
    } catch (error) {
      console.error('Scripture collection delete error:', error);
      res.status(400).json({ error: 'Failed to delete collection' });
    }
  });

  // Export a collection (owned by user) to JSON
  app.get('/api/scripture-collections/:id/export', async (req, res) => {
    try {
      const { id } = req.params;
      const coll = await storage.getScriptureCollection(id);
      if (!coll || coll.userId !== getReqUserId(req)) return res.status(404).json({ error: 'Collection not found' });
      res.json({ name: coll.name, description: coll.description, verses: coll.verses || [] });
    } catch (error) {
      console.error('Scripture collection export error:', error);
      res.status(400).json({ error: 'Failed to export collection' });
    }
  });

  // Import a collection JSON into the current user's account
  app.post('/api/scripture-collections/import', async (req, res) => {
    try {
      const { name, description, verses } = req.body as { name?: string; description?: string; verses?: any[] };
      if (!name || !Array.isArray(verses)) return res.status(400).json({ error: 'Invalid payload' });
      const created = await storage.createScriptureCollection({
        name,
        description: description ?? null,
        verses: verses as any,
        userId: getReqUserId(req),
      } as any);
      res.status(201).json(created);
    } catch (error) {
      console.error('Scripture collection import error:', error);
      res.status(400).json({ error: 'Failed to import collection' });
    }
  });

  app.post('/api/scripture-collections/:id/share', async (req, res) => {
    try {
      const { id } = req.params;
      const secret = process.env.SHARE_TOKEN_SECRET || 'share-secret';
      const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
      const payload = `${id}:${exp}`;
      const hmac = await import('crypto').then(m => m.createHmac('sha256', secret).update(payload).digest('hex'));
      const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
      const host = req.headers.origin || `http://${req.headers.host}`;
      res.json({ url: `${host}/api/share/collection?token=${token}` });
    } catch (e) {
      res.status(400).json({ error: 'Share failed' });
    }
  });

  app.post('/api/scripture-collections/:id/share-email', async (req, res) => {
    try {
      const { id } = req.params;
      const { to, message } = req.body as { to?: string; message?: string };
      if (!to) return res.status(400).json({ error: 'Recipient email required' });
      const secret = process.env.SHARE_TOKEN_SECRET || 'share-secret';
      const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
      const payload = `${id}:${exp}`;
      const hmac = await import('crypto').then(m => m.createHmac('sha256', secret).update(payload).digest('hex'));
      const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
      const host = req.headers.origin || `http://${req.headers.host}`;
      const url = `${host}/api/share/collection?token=${token}`;
      await sendEmail({
        to,
        subject: 'Shared Scripture Collection',
        html: `<p>A scripture collection has been shared with you.</p><p>${message ? message : ''}</p><p>View it here: <a href="${url}">${url}</a></p>`,
      });
      res.json({ status: 'sent' });
    } catch (e: any) {
      res.status(400).json({ error: `Email failed: ${e.message || e}` });
    }
  });

  app.get("/api/podcasts", async (req, res) => {
    try {
      const podcasts = await storage.getPodcastsByUser(getReqUserId(req));
      res.json(podcasts);
    } catch (error) {
      console.error('Podcasts fetch error:', error);
      res.status(500).json({ error: "Failed to fetch podcasts" });
    }
  });

  app.post("/api/podcasts", upload.single('audio'), async (req: MulterRequest, res) => {
    try {
      const validatedData = insertPodcastSchema.parse(req.body);
      
      let audioUrl = validatedData.audioUrl;
      let duration = validatedData.duration;

      // Process uploaded audio file if provided
      if (req.file) {
        const filename = `podcast-${Date.now()}-${req.file.originalname}`;
        const processedAudio = await audioProcessorService.processAudio(
          req.file.buffer,
          filename,
          {
            noiseReduction: req.body.noiseReduction === 'true',
            introOutro: req.body.introOutro === 'true',
            backgroundMusic: req.body.backgroundMusic === 'true',
            chapterMarkers: req.body.chapterMarkers === 'true',
          }
        );
        audioUrl = processedAudio.audioUrl;
        duration = processedAudio.metadata.duration;
      }

      const podcast = await storage.createPodcast({ ...validatedData, audioUrl, duration, userId: getReqUserId(req) });
      
      res.status(201).json(podcast);
    } catch (error) {
      console.error('Podcast creation error:', error);
      res.status(400).json({ error: "Failed to create podcast" });
    }
  });

  // Get available voices (ONLY ElevenLabs)
  app.get("/api/voices", async (req, res) => {
    try {
      if (!elevenLabsService.isConfigured()) {
        return res.status(503).json({ 
          error: "ElevenLabs API not configured",
          message: "Please set ELEVENLABS_API_KEY environment variable" 
        });
      }

      // ONLY return ElevenLabs voices - no OpenAI voices
      const voices = {
        elevenlabs: [
          { id: 'QTGiyJvep6bcx4WD1qAq', name: 'Brad', description: 'Professional Male Voice', gender: 'male' },
          { id: 'uYXf8XasLslADfZ2MB4u', name: 'Hope', description: 'Inspiring Female Voice', gender: 'female' },
          { id: 'Dslrhjl3ZpzrctukrQSN', name: 'Will', description: 'Strong Male Voice', gender: 'male' },
          { id: 'zGjIP4SZlMnY9m93k97r', name: 'Sarah', description: 'Gentle Female Voice', gender: 'female' },
          { id: 'Cb8NLd0sUB8jI4MW2f9M', name: 'Jedediah', description: 'Wise Pastoral Male', gender: 'male' },
          { id: '6xPz2opT0y5qtoRh1U1Y', name: 'Christian', description: 'Confident Middle-Aged Male', gender: 'male' },
          { id: 'wyWA56cQNU2KqUW4eCsI', name: 'Clyde', description: 'Authoritative Male Voice', gender: 'male' },
          { id: '4YYIPFl9wE5c4L2eu2Gb', name: 'Burt', description: 'Warm Male Narrator', gender: 'male' },
          { id: 'xctasy8XvGp2cVO9HL9k', name: 'Allison', description: 'Clear Female Voice', gender: 'female' }
        ]
      };

      console.log('✅ Returning ElevenLabs voices only');
      res.json(voices);
    } catch (error) {
      console.error('Error fetching voices:', error);
      res.status(500).json({ error: "Failed to fetch voices" });
    }
  });

  // ElevenLabs voice preview endpoint - WORKING
  app.post("/api/voices/preview", async (req, res) => {
    const { voiceId, text } = req.body;
    
    if (!voiceId || !text) {
      return res.status(400).json({ error: "Voice ID and text are required" });
    }

    try {
      if (!elevenLabsService.isConfigured()) {
        return res.status(503).json({ error: "ElevenLabs API not configured" });
      }

      console.log(`🎤 Generating preview for ElevenLabs voice: ${voiceId}`);
      
      // Generate audio using ElevenLabs with premium settings
      const audioBuffer = await elevenLabsService.generateSpeech(text, voiceId, {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      });
      
      // Send the audio buffer as response
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      res.send(audioBuffer);
      
    } catch (error) {
      console.error('Voice preview error:', error);
      res.status(500).json({ error: "Failed to generate voice preview" });
    }
  });

  // Podcast generation endpoint with real ElevenLabs integration
  app.post("/api/podcasts/generate", async (req, res) => {
    const { type, title, prompt, script, youtubeUrl, hosts = [], useElevenLabs = true, description } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required" });
    }

    // Check for required content based on type
    if (type === 'ai-generate' && !prompt) {
      return res.status(400).json({ error: "AI prompt is required" });
    }
    if (type === 'script' && !script) {
      return res.status(400).json({ error: "Script content is required" });
    }
    if (type === 'youtube' && !youtubeUrl) {
      return res.status(400).json({ error: "YouTube URL is required" });
    }

    try {
      // Generate podcast content based on type
      let podcastContent = "";
      
      switch (type) {
        case 'script':
          podcastContent = script;
          break;
        case 'ai-generate':
          // Use Enhanced Podcast Generator for superior conversation flow
          console.log(`🚀 Using Enhanced Podcast Generator for topic: "${prompt}"`);
          
          const enhancedResult = await enhancedPodcastGenerator.generatePodcast(
            prompt, 
            hosts, 
            type === 'ai-generate' ? 3 : 1 // Generate longer content for AI requests
          );
          
          podcastContent = enhancedResult.script;
          console.log(`✨ Enhanced script generated with ${enhancedResult.structure.segments.length} segments and natural conversation flow`);
          break;
        case 'youtube':
          // For YouTube, we'd need to fetch and transcribe content (simplified for now)
          podcastContent = `Welcome to our podcast discussing the YouTube video: ${youtubeUrl}. Today we'll explore the key points and insights from this content.`;
          break;
        default:
          podcastContent = `Welcome to ${title}. This is your AI-generated podcast.`;
      }

      // Parse speaker-based content for multiple hosts
      let contentParts = [];
      
      if (hosts.length > 1 && podcastContent.includes(':')) {
        // Parse speaker-labeled content (e.g., "John: Hello there...")
        const lines = podcastContent.split('\n').filter(line => line.trim() && !line.startsWith('---'));
        
        for (const line of lines) {
          if (line.includes(':') && !line.includes('---')) {
            const [speakerPart, ...contentParts_] = line.split(':');
            const speakerName = speakerPart.replace('[pause]', '').trim();
            const content = contentParts_.join(':').trim();
            
            if (content.length > 10) { // Only include substantial content
              // Find the host index by matching speaker name
              const hostIndex = hosts.findIndex(h => 
                h.name.toLowerCase() === speakerName.toLowerCase()
              );
              
              contentParts.push({
                hostIndex: hostIndex >= 0 ? hostIndex : 0,
                text: content
              });
            }
          }
        }
        
        // If no speaker format detected, split by sentences
        if (contentParts.length === 0) {
          const sentences = podcastContent.split('.').filter(s => s.trim().length > 20);
          sentences.forEach((sentence, i) => {
            contentParts.push({
              hostIndex: i % hosts.length,
              text: sentence.trim() + '.'
            });
          });
        }
      } else {
        // Single host or no speaker format
        contentParts = [{
          hostIndex: 0,
          text: podcastContent
        }];
      }

      // Generate audio for each part using ElevenLabs
      const audioBuffers = [];
      
      for (const contentPart of contentParts) {
        const host = hosts[contentPart.hostIndex];
        const text = contentPart.text;
        
        if (!text || text.trim().length === 0) continue;
        
        console.log(`🎙️ Generating ElevenLabs audio for ${host.name} with voice ${host.voiceName} (${host.voice})`);
        console.log(`📝 Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        
        // Use ElevenLabs to generate speech with the specific voice ID
        const audioBuffer = await audioProcessorService.generateSpeech(
          text,
          host.voice, // This is the ElevenLabs voice ID
          true // Use ElevenLabs
        );
        
        audioBuffers.push(audioBuffer);
      }

      // Combine all audio segments into one file
      if (audioBuffers.length > 0) {
        const timestamp = Date.now();
        const audioFilename = `podcast-${timestamp}.mp3`;
        const audioPath = path.join(process.cwd(), 'uploads', 'audio', audioFilename);
        
        // Ensure uploads directory exists
        await fs.mkdir(path.join(process.cwd(), 'uploads', 'audio'), { recursive: true });
        
        // Combine all audio buffers (simple concatenation for now)
        const combinedBuffer = Buffer.concat(audioBuffers);
        console.log(`🎧 Combined ${audioBuffers.length} audio segments into ${Math.floor(combinedBuffer.length/1024)}KB file`);
        
        // Save the combined audio file
        await fs.writeFile(audioPath, combinedBuffer);
        
        // Save podcast to database
        const podcastData = {
          title,
          description: description || `AI-generated podcast about ${title}`,
          audioUrl: `/uploads/audio/${audioFilename}`,
          transcript: podcastContent.substring(0, 1000), // Store first 1000 chars as transcript
          duration: Math.floor(combinedBuffer.length / 16000), // Rough estimate based on combined length
        };
        
        const savedPodcast = await storage.createPodcast({
          ...podcastData,
          userId: getReqUserId(req)
        });
        
        // Create response with additional metadata
        const podcastResponse = {
          ...savedPodcast,
          message: `🎉 Podcast generated successfully using ElevenLabs Premium Voices!`,
          type,
          hosts: hosts.map(h => ({
            name: h.name,
            voiceId: h.voice,
            voiceName: h.voiceName,
            gender: h.gender
          })),
          voiceEngine: 'elevenlabs'
        };
        
        res.status(201).json(podcastResponse);
      } else {
        throw new Error('No audio content was generated');
      }
      
    } catch (error) {
      console.error('Podcast generation error:', error);
      res.status(500).json({ 
        error: "Failed to generate podcast",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Voice recording endpoints
  app.get("/api/voice-recordings", async (req, res) => {
    try {
      const recordings = await storage.getVoiceRecordingsByUser(getReqUserId(req));
      res.json(recordings);
    } catch (error) {
      console.error('Voice recordings fetch error:', error);
      res.status(500).json({ error: "Failed to fetch voice recordings" });
    }
  });

  app.post("/api/voice-recordings", upload.single('audio'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file is required" });
      }

      const filename = `recording-${Date.now()}-${req.file.originalname}`;
      const processedAudio = await audioProcessorService.processAudio(
        req.file.buffer,
        filename
      );

      // Transcribe the audio
      const transcription = await audioProcessorService.transcribeAudio(
        path.join(process.cwd(), 'uploads', 'audio', filename)
      );

      const validatedData = insertVoiceRecordingSchema.parse({
        ...req.body,
        audioUrl: processedAudio.audioUrl,
        transcription: transcription.text,
        duration: processedAudio.metadata.duration,
      });

      const recording = await storage.createVoiceRecording({ ...validatedData, userId: getReqUserId(req) });
      
      res.status(201).json(recording);
    } catch (error) {
      console.error('Voice recording creation error:', error);
      res.status(400).json({ error: "Failed to create voice recording" });
    }
  });

  // Scripture collection endpoints
  app.get("/api/scripture-collections", async (req, res) => {
    try {
      const collections = await storage.getScriptureCollectionsByUser(getReqUserId(req));
      res.json(collections);
    } catch (error) {
      console.error('Scripture collections fetch error:', error);
      res.status(500).json({ error: "Failed to fetch scripture collections" });
    }
  });

  app.post("/api/scripture-collections", async (req, res) => {
    try {
      const validatedData = insertScriptureCollectionSchema.parse(req.body);
      const collection = await storage.createScriptureCollection({ 
        ...validatedData, 
        userId: getReqUserId(req) 
      });
      res.status(201).json(collection);
    } catch (error) {
      console.error('Scripture collection creation error:', error);
      res.status(400).json({ error: "Failed to create scripture collection" });
    }
  });

  // Image generation endpoints
  app.get("/api/generated-images", async (req, res) => {
    try {
      const images = await storage.getGeneratedImagesByUser(getReqUserId(req));
      res.json(images);
    } catch (error) {
      console.error('Generated images fetch error:', error);
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  // Video generation endpoints
  app.get("/api/generated-videos", async (req, res) => {
    try {
      const videos = await storage.getGeneratedVideosByUser(getReqUserId(req));
      res.json(videos);
    } catch (error) {
      console.error('Generated videos fetch error:', error);
      res.status(500).json({ error: "Failed to fetch generated videos" });
    }
  });

  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, duration, style, aspectRatio } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Start video generation
      const video = await generateVideo({ 
        prompt, 
        duration: duration || 5, 
        style: style || 'cinematic',
        aspectRatio: aspectRatio || '16:9'
      });

      // Save to database
      const savedVideo = await storage.createGeneratedVideo({
        userId: getReqUserId(req),
        prompt,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: duration || 5,
        style: style || 'cinematic',
        aspectRatio: aspectRatio || '16:9',
        status: 'completed'
      });

      res.json(savedVideo);
    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: "Failed to generate video" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, style = 'cinematic', aspectRatio = '16:9' } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Import Gemini service dynamically to avoid initialization issues
      const { generateImage } = await import('./services/gemini');

      // Generate unique filename
      const filename = `generated-${Date.now()}.png`;
      const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);

      // Ensure upload directory exists
      await fs.mkdir(path.dirname(imagePath), { recursive: true });

      // Generate image using Gemini
      await generateImage(prompt, imagePath);

      const imageUrl = `/uploads/images/${filename}`;

      const validatedData = insertGeneratedImageSchema.parse({
        prompt,
        imageUrl,
        style,
        aspectRatio,
      });

      const image = await storage.createGeneratedImage({ ...validatedData, userId: getReqUserId(req) });
      
      res.status(201).json(image);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Enhanced Chat/AI assistance endpoint with multiple AI capabilities
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context, type } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const { 
        summarizeArticle, 
        providePastoralGuidance, 
        generateAdvancedSermonOutline,
        semanticScriptureSearch,
        generateSermonIllustrations,
        generatePodcastScript,
        generateSermonVisualPrompts
      } = await import('./services/gemini');

      let response;

      switch (type) {
        case 'pastoral_guidance':
          response = await providePastoralGuidance(message, context);
          break;
        case 'sermon_outline':
          const { topic, scripture } = JSON.parse(context || '{}');
          response = await generateAdvancedSermonOutline(topic || message, scripture || '');
          break;
        case 'semantic_search':
          response = await semanticScriptureSearch(message, context);
          break;
        case 'illustrations':
          const { theme, audience } = JSON.parse(context || '{}');
          response = await generateSermonIllustrations(theme || message, audience || 'general');
          break;
        case 'podcast_script':
          response = await generatePodcastScript(message);
          break;
        case 'visual_prompts':
          const { style } = JSON.parse(context || '{}');
          response = await generateSermonVisualPrompts(message, style || 'inspirational');
          break;
        default:
          // Default conversational response
          const conversationalPrompt = context ? 
            `${context}\n\nUser: ${message}\n\nPlease respond in a friendly, conversational way as a helpful personal assistant. Keep responses engaging and natural.` :
            `Please respond to this message in a friendly, conversational way as a helpful personal assistant: ${message}`;
          response = await summarizeArticle(conversationalPrompt);
      }
      
      res.json({ response });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Serve static files from uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Public share endpoint for collections
  app.get('/api/share/collection', async (req, res) => {
    try {
      const { token } = req.query as { token?: string };
      if (!token) return res.status(400).json({ error: 'Missing token' });
      const secret = process.env.SHARE_TOKEN_SECRET || 'share-secret';
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const [id, expStr, sig] = decoded.split(':');
      const exp = Number(expStr);
      const expected = await import('crypto').then(m => m.createHmac('sha256', secret).update(`${id}:${exp}`).digest('hex'));
      if (sig !== expected) return res.status(401).json({ error: 'Invalid token' });
      if (Date.now() > exp) return res.status(401).json({ error: 'Token expired' });
      const coll = await storage.getScriptureCollection(id);
      if (!coll) return res.status(404).json({ error: 'Not found' });
      res.json({ name: coll.name, description: coll.description, verses: coll.verses || [] });
    } catch (e) {
      res.status(400).json({ error: 'Invalid token' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
