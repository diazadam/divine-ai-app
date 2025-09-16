import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sermons = pgTable("sermons", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  scripture: text("scripture"),
  outline: jsonb("outline").$type<{
    sections: Array<{
      title: string;
      content: string;
      notes: string;
    }>;
  }>(),
  status: text("status").default("draft"), // draft, completed, published
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const podcasts = pgTable("podcasts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  sermonId: varchar("sermon_id").references(() => sermons.id),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url"),
  transcript: text("transcript"), // Full transcript of the podcast
  duration: integer("duration"), // in seconds
  status: text("status").default("processing"), // processing, completed, published
  playCount: integer("play_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scriptureCollections = pgTable("scripture_collections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  verses: jsonb("verses").$type<
    Array<{
      reference: string;
      text: string;
      version: string;
    }>
  >(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedImages = pgTable("generated_images", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  style: text("style"),
  aspectRatio: text("aspect_ratio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedVideos = pgTable("generated_videos", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  prompt: text("prompt").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  style: text("style"),
  aspectRatio: text("aspect_ratio"),
  status: text("status").default("processing"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedAudios = pgTable("generated_audios", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  prompt: text("prompt").notNull(),
  audioUrl: text("audio_url").notNull(),
  model: text("model"),
  format: text("format"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  sermonId: varchar("sermon_id").references(() => sermons.id),
  title: text("title"),
  audioUrl: text("audio_url").notNull(),
  transcription: text("transcription"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Social sharing ---
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  provider: text("provider").notNull(), // twitter, facebook, linkedin, mastodon, discord, bluesky, reddit, instagram, youtube, tiktok
  accountHandle: text("account_handle"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"), // e.g., mastodon instance, discord webhook, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialShares = pgTable("social_shares", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  provider: text("provider").notNull(),
  type: text("type").notNull(), // podcast | media | scripture | custom
  refId: text("ref_id"), // podcast id, media id, etc.
  url: text("url"),
  title: text("title"),
  caption: text("caption"),
  imageUrl: text("image_url"),
  status: text("status").default("pending"), // pending | posted | failed
  error: text("error"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scheduled posts table
export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  platform: text("platform").notNull(), // instagram | facebook | twitter | ...
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  status: text("status").default("scheduled"), // scheduled | posted | failed
  type: text("type").default("custom"),
  error: text("error"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// pgvector support (BAAI/bge-small-en-v1.5 => 384 dim)
export const vector = (dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(",")}]`;
    },
  });

// Embeddings table for semantic search (RAG)
export const embeddings = pgTable("embeddings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // content type: verse | topic | sermon | other
  type: text("type").notNull(),
  refId: text("ref_id"),
  content: text("content").notNull(),
  embedding: (vector(384) as any)("embedding"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Safety flags + PII redactions per generation
export const safetyFlags = pgTable("safety_flags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  podcastId: varchar("podcast_id").references(() => podcasts.id),
  correlationId: text("correlation_id"),
  toxicityScore: integer("toxicity_score"),
  flagged: boolean("flagged").default(false),
  labels: jsonb("labels"),
  piiRedactions: jsonb("pii_redactions"),
  overridden: boolean("overridden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Generation logs for cost/latency monitoring
export const generationLogs = pgTable("generation_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  correlationId: text("correlation_id").notNull(),
  stage: text("stage").notNull(), // e.g., hf.textGeneration, hf.emotion, rag.search
  provider: text("provider").notNull(), // hf | gemini | elevenlabs | system
  model: text("model"),
  inputChars: integer("input_chars"),
  outputChars: integer("output_chars"),
  durationMs: integer("duration_ms"),
  costUsd: text("cost_usd"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Church management system integrations
export const integrations = pgTable("integrations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(), // planning-center, church-community-builder, pushpay, etc.
  name: text("name").notNull(),
  status: text("status").default("connected"), // connected, error, syncing
  credentials: jsonb("credentials").$type<Record<string, string>>(), // encrypted credentials
  settings: jsonb("settings").$type<Record<string, any>>(), // integration-specific settings
  dataTypes: jsonb("data_types").$type<string[]>(), // attendance, giving, members, etc.
  lastSync: timestamp("last_sync"),
  syncFrequency: text("sync_frequency").default("daily"), // daily, weekly, manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertSermonSchema = createInsertSchema(sermons).pick({
  title: true,
  scripture: true,
  outline: true,
  status: true,
});

export const insertPodcastSchema = createInsertSchema(podcasts).pick({
  sermonId: true,
  title: true,
  description: true,
  audioUrl: true,
  transcript: true,
  duration: true,
});

export const insertScriptureCollectionSchema = createInsertSchema(
  scriptureCollections
).pick({
  name: true,
  description: true,
  verses: true,
});

export const insertGeneratedImageSchema = createInsertSchema(
  generatedImages
).pick({
  prompt: true,
  imageUrl: true,
  style: true,
  aspectRatio: true,
});

export const insertGeneratedVideoSchema = createInsertSchema(
  generatedVideos
).pick({
  prompt: true,
  videoUrl: true,
  thumbnailUrl: true,
  duration: true,
  style: true,
  aspectRatio: true,
  status: true,
});

export const insertGeneratedAudioSchema = createInsertSchema(
  generatedAudios
).pick({
  prompt: true,
  audioUrl: true,
  model: true,
  format: true,
  duration: true,
});

export const insertVoiceRecordingSchema = createInsertSchema(
  voiceRecordings
).pick({
  sermonId: true,
  title: true,
  audioUrl: true,
  transcription: true,
  duration: true,
});

export const insertSocialAccountSchema = createInsertSchema(
  socialAccounts
).pick({
  provider: true,
  accountHandle: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
  metadata: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).pick({
  provider: true,
  type: true,
  refId: true,
  url: true,
  title: true,
  caption: true,
  imageUrl: true,
  status: true,
  error: true,
});

export const insertScheduledPostSchema = createInsertSchema(
  scheduledPosts
).pick({
  platform: true,
  content: true,
  imageUrl: true,
  scheduledTime: true,
  status: true,
  type: true,
  error: true,
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).pick({
  type: true,
  refId: true,
  content: true,
  metadata: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  type: true,
  name: true,
  status: true,
  credentials: true,
  settings: true,
  dataTypes: true,
  lastSync: true,
  syncFrequency: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Sermon = typeof sermons.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Podcast = typeof podcasts.$inferSelect;
export type InsertScriptureCollection = z.infer<
  typeof insertScriptureCollectionSchema
>;
export type ScriptureCollection = typeof scriptureCollections.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedVideo = z.infer<typeof insertGeneratedVideoSchema>;
export type GeneratedVideo = typeof generatedVideos.$inferSelect;
export type InsertGeneratedAudio = z.infer<typeof insertGeneratedAudioSchema>;
export type GeneratedAudio = typeof generatedAudios.$inferSelect;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type SocialShare = typeof socialShares.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;
