import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for development (in production, use authentication)
  const MOCK_USER_ID = "mock-user-1";

  // Ensure mock user exists
  const existingUser = await storage.getUser(MOCK_USER_ID);
  if (!existingUser) {
    await storage.createUser({
      username: "pastor",
      password: "password",
      email: "pastor@church.com",
    });
  }

  // Bible search and scripture endpoints
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

      const results = await bibleApiService.searchVerses(query, version, parseInt(limit.toString()));
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
      const sermons = await storage.getSermonsByUser(MOCK_USER_ID);
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
      const sermon = await storage.createSermon({ ...validatedData, userId: MOCK_USER_ID });
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
      const podcasts = await storage.getPodcastsByUser(MOCK_USER_ID);
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

      const podcast = await storage.createPodcast({ 
        ...validatedData, 
        audioUrl,
        duration,
        userId: MOCK_USER_ID 
      });
      
      res.status(201).json(podcast);
    } catch (error) {
      console.error('Podcast creation error:', error);
      res.status(400).json({ error: "Failed to create podcast" });
    }
  });

  // Voice recording endpoints
  app.get("/api/voice-recordings", async (req, res) => {
    try {
      const recordings = await storage.getVoiceRecordingsByUser(MOCK_USER_ID);
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

      const recording = await storage.createVoiceRecording({ 
        ...validatedData, 
        userId: MOCK_USER_ID 
      });
      
      res.status(201).json(recording);
    } catch (error) {
      console.error('Voice recording creation error:', error);
      res.status(400).json({ error: "Failed to create voice recording" });
    }
  });

  // Scripture collection endpoints
  app.get("/api/scripture-collections", async (req, res) => {
    try {
      const collections = await storage.getScriptureCollectionsByUser(MOCK_USER_ID);
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
        userId: MOCK_USER_ID 
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
      const images = await storage.getGeneratedImagesByUser(MOCK_USER_ID);
      res.json(images);
    } catch (error) {
      console.error('Generated images fetch error:', error);
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  // Video generation endpoints
  app.get("/api/generated-videos", async (req, res) => {
    try {
      const videos = await storage.getGeneratedVideosByUser(MOCK_USER_ID);
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
        userId: MOCK_USER_ID,
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

      const image = await storage.createGeneratedImage({ 
        ...validatedData, 
        userId: MOCK_USER_ID 
      });
      
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

  const httpServer = createServer(app);
  return httpServer;
}
