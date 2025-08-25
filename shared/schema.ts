import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sermons = pgTable("sermons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sermonId: varchar("sermon_id").references(() => sermons.id),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url"),
  duration: integer("duration"), // in seconds
  status: text("status").default("processing"), // processing, completed, published
  playCount: integer("play_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scriptureCollections = pgTable("scripture_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  verses: jsonb("verses").$type<Array<{
    reference: string;
    text: string;
    version: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  style: text("style"),
  aspectRatio: text("aspect_ratio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceRecordings = pgTable("voice_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sermonId: varchar("sermon_id").references(() => sermons.id),
  title: text("title"),
  audioUrl: text("audio_url").notNull(),
  transcription: text("transcription"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow(),
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
  duration: true,
});

export const insertScriptureCollectionSchema = createInsertSchema(scriptureCollections).pick({
  name: true,
  description: true,
  verses: true,
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).pick({
  prompt: true,
  imageUrl: true,
  style: true,
  aspectRatio: true,
});

export const insertVoiceRecordingSchema = createInsertSchema(voiceRecordings).pick({
  sermonId: true,
  title: true,
  audioUrl: true,
  transcription: true,
  duration: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSermon = z.infer<typeof insertSermonSchema>;
export type Sermon = typeof sermons.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Podcast = typeof podcasts.$inferSelect;
export type InsertScriptureCollection = z.infer<typeof insertScriptureCollectionSchema>;
export type ScriptureCollection = typeof scriptureCollections.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
