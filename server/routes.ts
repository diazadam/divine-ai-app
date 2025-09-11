import type { Express, Request } from "express";
import express from "express";
import passport from 'passport';
import { createServer, type Server } from "http";
import { randomBytes, scryptSync } from 'crypto';
import { sendEmail } from './mailer';
import { storage } from "./storage";
import { bibleApiService } from "./services/bible-api";
import { audioProcessorService } from "./services/audio-processor";
import { generateVideo } from "./services/veo";
import * as geminiService from "./services/gemini";
import { 
  insertSermonSchema, 
  insertPodcastSchema, 
  insertScriptureCollectionSchema,
  insertGeneratedImageSchema,
  insertGeneratedVideoSchema,
  insertVoiceRecordingSchema 
} from "@shared/schema";
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

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
