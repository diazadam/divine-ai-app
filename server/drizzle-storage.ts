import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { and, desc, eq } from 'drizzle-orm';
import type { IStorage } from './storage';
import {
  users,
  sermons,
  scriptureCollections,
  type InsertUser,
  type User,
  type Sermon,
  type InsertSermon,
  type ScriptureCollection,
  type InsertScriptureCollection,
  podcasts,
  type Podcast,
  generatedImages,
  type GeneratedImage,
  generatedVideos,
  type GeneratedVideo,
  generatedAudios,
  type GeneratedAudio,
  voiceRecordings,
  type VoiceRecording,
  type InsertPodcast,
  type InsertGeneratedImage,
  type InsertGeneratedVideo,
  type InsertGeneratedAudio,
  type InsertVoiceRecording,
} from '@shared/schema';

export class DrizzleStorage implements IStorage {
  private db = drizzle(neon(process.env.DATABASE_URL!));

  // Users (minimal: use username-based management)
  async getUser(id: string): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return rows[0];
  }
  async createUser(u: InsertUser): Promise<User> {
    const rows = await this.db.insert(users).values({ username: u.username, password: u.password, email: u.email ?? null }).returning();
    return rows[0]!;
  }

  // Sermons
  async getSermon(id: string): Promise<Sermon | undefined> {
    const rows = await this.db.select().from(sermons).where(eq(sermons.id, id)).limit(1);
    return rows[0];
  }
  async getSermonsByUser(userId: string): Promise<Sermon[]> {
    const rows = await this.db.select().from(sermons).where(eq(sermons.userId, userId)).orderBy(desc(sermons.createdAt));
    return rows;
  }
  async createSermon(s: InsertSermon & { userId: string }): Promise<Sermon> {
    const rows = await this.db.insert(sermons).values({
      userId: s.userId,
      title: s.title,
      scripture: s.scripture ?? null,
      outline: (s.outline ?? null) as any,
      status: s.status ?? 'draft',
    }).returning();
    return rows[0]!;
  }
  async updateSermon(id: string, s: Partial<InsertSermon>): Promise<Sermon | undefined> {
    const rows = await this.db.update(sermons).set({
      title: s.title as any,
      scripture: (s.scripture as any) ?? undefined,
      outline: (s.outline as any) ?? undefined,
      status: (s.status as any) ?? undefined,
      updatedAt: new Date() as any,
    }).where(eq(sermons.id, id)).returning();
    return rows[0];
  }
  async deleteSermon(id: string): Promise<boolean> {
    const rows = await this.db.delete(sermons).where(eq(sermons.id, id)).returning();
    return rows.length > 0;
  }

  // Scripture Collections
  async getScriptureCollection(id: string): Promise<ScriptureCollection | undefined> {
    const rows = await this.db.select().from(scriptureCollections).where(eq(scriptureCollections.id, id)).limit(1);
    return rows[0];
  }
  async getScriptureCollectionsByUser(userId: string): Promise<ScriptureCollection[]> {
    const rows = await this.db.select().from(scriptureCollections).where(eq(scriptureCollections.userId, userId)).orderBy(desc(scriptureCollections.createdAt));
    return rows;
  }
  async createScriptureCollection(c: InsertScriptureCollection & { userId: string }): Promise<ScriptureCollection> {
    const rows = await this.db.insert(scriptureCollections).values({
      userId: c.userId,
      name: c.name,
      description: c.description ?? null,
      verses: (c.verses ?? null) as any,
    }).returning();
    return rows[0]!;
  }
  async updateScriptureCollection(id: string, c: Partial<InsertScriptureCollection>): Promise<ScriptureCollection | undefined> {
    const rows = await this.db.update(scriptureCollections).set({
      name: (c.name as any) ?? undefined,
      description: (c.description as any) ?? undefined,
      verses: (c.verses as any) ?? undefined,
    }).where(eq(scriptureCollections.id, id)).returning();
    return rows[0];
  }
  async deleteScriptureCollection(id: string): Promise<boolean> {
    const rows = await this.db.delete(scriptureCollections).where(eq(scriptureCollections.id, id)).returning();
    return rows.length > 0;
  }

  // The following are not yet persisted; kept as no-ops or simple returns for compatibility
  // Implemented with Drizzle
  async getPodcast(id: string): Promise<Podcast | undefined> {
    const rows = await this.db.select().from(podcasts).where(eq(podcasts.id, id)).limit(1);
    return rows[0];
  }
  async getPodcastsByUser(userId: string): Promise<Podcast[]> {
    return await this.db.select().from(podcasts).where(eq(podcasts.userId, userId)).orderBy(desc(podcasts.createdAt));
  }
  async createPodcast(p: InsertPodcast & { userId: string }): Promise<Podcast> {
    const rows = await this.db.insert(podcasts).values({
      userId: p.userId,
      sermonId: p.sermonId ?? null,
      title: p.title,
      description: p.description ?? null,
      audioUrl: p.audioUrl ?? null,
      duration: p.duration ?? null,
      status: 'processing' as any,
      playCount: 0 as any,
    }).returning();
    return rows[0]!;
  }
  async updatePodcast(id: string, p: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    const rows = await this.db.update(podcasts).set({
      sermonId: (p.sermonId as any) ?? undefined,
      title: (p.title as any) ?? undefined,
      description: (p.description as any) ?? undefined,
      audioUrl: (p.audioUrl as any) ?? undefined,
      duration: (p.duration as any) ?? undefined,
    }).where(eq(podcasts.id, id)).returning();
    return rows[0];
  }
  async deletePodcast(id: string): Promise<boolean> {
    const rows = await this.db.delete(podcasts).where(eq(podcasts.id, id)).returning();
    return rows.length > 0;
  }

  async getGeneratedImage(id: string): Promise<GeneratedImage | undefined> {
    const rows = await this.db.select().from(generatedImages).where(eq(generatedImages.id, id)).limit(1);
    return rows[0];
  }
  async getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]> {
    return await this.db.select().from(generatedImages).where(eq(generatedImages.userId, userId)).orderBy(desc(generatedImages.createdAt));
  }
  async createGeneratedImage(img: InsertGeneratedImage & { userId: string }): Promise<GeneratedImage> {
    const rows = await this.db.insert(generatedImages).values({
      userId: img.userId,
      prompt: img.prompt,
      imageUrl: img.imageUrl,
      style: (img.style as any) ?? null,
      aspectRatio: (img.aspectRatio as any) ?? null,
    }).returning();
    return rows[0]!;
  }
  async deleteGeneratedImage(id: string): Promise<boolean> {
    const rows = await this.db.delete(generatedImages).where(eq(generatedImages.id, id)).returning();
    return rows.length > 0;
  }

  async getGeneratedVideo(id: string): Promise<GeneratedVideo | undefined> {
    const rows = await this.db.select().from(generatedVideos).where(eq(generatedVideos.id, id)).limit(1);
    return rows[0];
  }
  async getGeneratedVideosByUser(userId: string): Promise<GeneratedVideo[]> {
    return await this.db.select().from(generatedVideos).where(eq(generatedVideos.userId, userId)).orderBy(desc(generatedVideos.createdAt));
  }
  async createGeneratedVideo(v: InsertGeneratedVideo & { userId: string }): Promise<GeneratedVideo> {
    const rows = await this.db.insert(generatedVideos).values({
      userId: v.userId,
      prompt: v.prompt,
      videoUrl: (v.videoUrl as any) ?? null,
      thumbnailUrl: (v.thumbnailUrl as any) ?? null,
      duration: (v.duration as any) ?? null,
      style: (v.style as any) ?? null,
      aspectRatio: (v.aspectRatio as any) ?? null,
      status: (v.status as any) ?? 'processing',
    }).returning();
    return rows[0]!;
  }
  async deleteGeneratedVideo(id: string): Promise<boolean> {
    const rows = await this.db.delete(generatedVideos).where(eq(generatedVideos.id, id)).returning();
    return rows.length > 0;
  }

  async getGeneratedAudio(id: string): Promise<GeneratedAudio | undefined> {
    const rows = await this.db.select().from(generatedAudios).where(eq(generatedAudios.id, id)).limit(1);
    return rows[0];
  }
  async getGeneratedAudiosByUser(userId: string): Promise<GeneratedAudio[]> {
    return await this.db.select().from(generatedAudios).where(eq(generatedAudios.userId, userId)).orderBy(desc(generatedAudios.createdAt));
  }
  async createGeneratedAudio(a: InsertGeneratedAudio & { userId: string }): Promise<GeneratedAudio> {
    const rows = await this.db.insert(generatedAudios).values({
      userId: a.userId,
      prompt: a.prompt,
      audioUrl: a.audioUrl,
      model: (a.model as any) ?? null,
      format: (a.format as any) ?? null,
      duration: (a.duration as any) ?? null,
    }).returning();
    return rows[0]!;
  }
  async deleteGeneratedAudio(id: string): Promise<boolean> {
    const rows = await this.db.delete(generatedAudios).where(eq(generatedAudios.id, id)).returning();
    return rows.length > 0;
  }

  async getVoiceRecording(id: string): Promise<VoiceRecording | undefined> {
    const rows = await this.db.select().from(voiceRecordings).where(eq(voiceRecordings.id, id)).limit(1);
    return rows[0];
  }
  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    return await this.db.select().from(voiceRecordings).where(eq(voiceRecordings.userId, userId)).orderBy(desc(voiceRecordings.createdAt));
  }
  async createVoiceRecording(r: InsertVoiceRecording & { userId: string }): Promise<VoiceRecording> {
    const rows = await this.db.insert(voiceRecordings).values({
      userId: r.userId,
      sermonId: (r.sermonId as any) ?? null,
      title: (r.title as any) ?? null,
      audioUrl: r.audioUrl,
      transcription: (r.transcription as any) ?? null,
      duration: (r.duration as any) ?? null,
    }).returning();
    return rows[0]!;
  }
  async updateVoiceRecording(id: string, r: Partial<InsertVoiceRecording>): Promise<VoiceRecording | undefined> {
    const rows = await this.db.update(voiceRecordings).set({
      sermonId: (r.sermonId as any) ?? undefined,
      title: (r.title as any) ?? undefined,
      audioUrl: (r.audioUrl as any) ?? undefined,
      transcription: (r.transcription as any) ?? undefined,
      duration: (r.duration as any) ?? undefined,
    }).where(eq(voiceRecordings.id, id)).returning();
    return rows[0];
  }
  async deleteVoiceRecording(id: string): Promise<boolean> {
    const rows = await this.db.delete(voiceRecordings).where(eq(voiceRecordings.id, id)).returning();
    return rows.length > 0;
  }

  // Integrations - not implemented for Drizzle backend yet
  async getIntegration(_id: string, _userId: string): Promise<any | undefined> {
    throw new Error('Integrations not implemented for DrizzleStorage');
  }
  async getUserIntegrations(_userId: string): Promise<any[]> {
    return [];
  }
  async createIntegration(_integration: any): Promise<any> {
    throw new Error('Integrations not implemented for DrizzleStorage');
  }
  async updateIntegration(_id: string, _integration: any): Promise<any | undefined> {
    throw new Error('Integrations not implemented for DrizzleStorage');
  }
  async deleteIntegration(_id: string, _userId: string): Promise<boolean> {
    throw new Error('Integrations not implemented for DrizzleStorage');
  }
}
