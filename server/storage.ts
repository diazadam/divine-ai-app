import {
    type GeneratedImage,
    type GeneratedVideo,
    type GeneratedAudio,
    type InsertGeneratedImage,
    type InsertGeneratedVideo,
    type InsertGeneratedAudio,
    type InsertPodcast,
    type InsertScriptureCollection,
    type InsertSermon,
    type InsertUser,
    type InsertVoiceRecording,
    type InsertIntegration,
    type Podcast,
    type ScriptureCollection,
    type Sermon,
    type User,
    type VoiceRecording,
    type Integration
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sermon methods
  getSermon(id: string): Promise<Sermon | undefined>;
  getSermonsByUser(userId: string): Promise<Sermon[]>;
  createSermon(sermon: InsertSermon & { userId: string }): Promise<Sermon>;
  updateSermon(id: string, sermon: Partial<InsertSermon>): Promise<Sermon | undefined>;
  deleteSermon(id: string): Promise<boolean>;

  // Podcast methods
  getPodcast(id: string): Promise<Podcast | undefined>;
  getPodcastsByUser(userId: string): Promise<Podcast[]>;
  createPodcast(podcast: InsertPodcast & { userId: string }): Promise<Podcast>;
  updatePodcast(id: string, podcast: Partial<InsertPodcast>): Promise<Podcast | undefined>;
  deletePodcast(id: string): Promise<boolean>;

  // Scripture collection methods
  getScriptureCollection(id: string): Promise<ScriptureCollection | undefined>;
  getScriptureCollectionsByUser(userId: string): Promise<ScriptureCollection[]>;
  createScriptureCollection(collection: InsertScriptureCollection & { userId: string }): Promise<ScriptureCollection>;
  updateScriptureCollection(id: string, collection: Partial<InsertScriptureCollection>): Promise<ScriptureCollection | undefined>;
  deleteScriptureCollection(id: string): Promise<boolean>;

  // Generated image methods
  getGeneratedImage(id: string): Promise<GeneratedImage | undefined>;
  getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]>;
  createGeneratedImage(image: InsertGeneratedImage & { userId: string }): Promise<GeneratedImage>;
  deleteGeneratedImage(id: string): Promise<boolean>;

  // Generated video methods
  getGeneratedVideo(id: string): Promise<GeneratedVideo | undefined>;
  getGeneratedVideosByUser(userId: string): Promise<GeneratedVideo[]>;
  createGeneratedVideo(video: InsertGeneratedVideo & { userId: string }): Promise<GeneratedVideo>;
  deleteGeneratedVideo(id: string): Promise<boolean>;

  // Generated audio methods
  getGeneratedAudio(id: string): Promise<GeneratedAudio | undefined>;
  getGeneratedAudiosByUser(userId: string): Promise<GeneratedAudio[]>;
  createGeneratedAudio(audio: InsertGeneratedAudio & { userId: string }): Promise<GeneratedAudio>;
  deleteGeneratedAudio(id: string): Promise<boolean>;

  // Voice recording methods
  getVoiceRecording(id: string): Promise<VoiceRecording | undefined>;
  getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]>;
  createVoiceRecording(recording: InsertVoiceRecording & { userId: string }): Promise<VoiceRecording>;
  updateVoiceRecording(id: string, recording: Partial<InsertVoiceRecording>): Promise<VoiceRecording | undefined>;
  deleteVoiceRecording(id: string): Promise<boolean>;

  // Integration methods
  getIntegration(id: string, userId: string): Promise<Integration | undefined>;
  getUserIntegrations(userId: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration & { userId: string }): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: string, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private sermons: Map<string, Sermon> = new Map();
  private podcasts: Map<string, Podcast> = new Map();
  private scriptureCollections: Map<string, ScriptureCollection> = new Map();
  private generatedImages: Map<string, GeneratedImage> = new Map();
  private generatedVideos: Map<string, GeneratedVideo> = new Map();
  private generatedAudios: Map<string, GeneratedAudio> = new Map();
  private voiceRecordings: Map<string, VoiceRecording> = new Map();
  private integrations: Map<string, Integration> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Sermon methods
  async getSermon(id: string): Promise<Sermon | undefined> {
    return this.sermons.get(id);
  }

  async getSermonsByUser(userId: string): Promise<Sermon[]> {
    return Array.from(this.sermons.values()).filter(sermon => sermon.userId === userId);
  }

  async createSermon(sermonData: InsertSermon & { userId: string }): Promise<Sermon> {
    const id = randomUUID();
    const sermon: Sermon = {
      id,
      userId: sermonData.userId,
      title: sermonData.title,
      scripture: sermonData.scripture ?? null,
      outline: sermonData.outline
        ? { sections: (sermonData.outline as any).sections as { title: string; content: string; notes: string; }[] }
        : null,
      status: sermonData.status ?? 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sermons.set(id, sermon);
    return sermon;
  }

  async updateSermon(id: string, sermonData: Partial<InsertSermon>): Promise<Sermon | undefined> {
    const sermon = this.sermons.get(id);
    if (!sermon) return undefined;
    
    const updatedSermon: Sermon = {
      ...sermon,
      title: sermonData.title ?? sermon.title,
      scripture: sermonData.scripture ?? sermon.scripture,
      outline: sermonData.outline
        ? { sections: (sermonData.outline as any).sections as { title: string; content: string; notes: string; }[] }
        : sermon.outline,
      status: (sermonData.status ?? sermon.status) as Sermon["status"],
      updatedAt: new Date(),
    };
    this.sermons.set(id, updatedSermon);
    return updatedSermon;
  }

  async deleteSermon(id: string): Promise<boolean> {
    return this.sermons.delete(id);
  }

  // Podcast methods
  async getPodcast(id: string): Promise<Podcast | undefined> {
    return this.podcasts.get(id);
  }

  async getPodcastsByUser(userId: string): Promise<Podcast[]> {
    return Array.from(this.podcasts.values()).filter(podcast => podcast.userId === userId);
  }

  async createPodcast(podcastData: InsertPodcast & { userId: string }): Promise<Podcast> {
    const id = randomUUID();
    const podcast: Podcast = {
      id,
      userId: podcastData.userId,
      sermonId: podcastData.sermonId ?? null,
      title: podcastData.title,
      description: podcastData.description ?? null,
      audioUrl: podcastData.audioUrl ?? null,
      transcript: (podcastData as any).transcript ?? null,
      duration: podcastData.duration ?? null,
      // If we already have an audioUrl (uploaded/processed), mark as completed; otherwise processing
      status: (podcastData.audioUrl ?? null) ? 'completed' : 'processing',
      playCount: 0,
      createdAt: new Date(),
    };
    this.podcasts.set(id, podcast);
    return podcast;
  }

  async updatePodcast(id: string, podcastData: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    const podcast = this.podcasts.get(id);
    if (!podcast) return undefined;
    
    const updatedPodcast: Podcast = {
      ...podcast,
      ...podcastData,
    };
    this.podcasts.set(id, updatedPodcast);
    return updatedPodcast;
  }

  async deletePodcast(id: string): Promise<boolean> {
    return this.podcasts.delete(id);
  }

  // Scripture collection methods
  async getScriptureCollection(id: string): Promise<ScriptureCollection | undefined> {
    return this.scriptureCollections.get(id);
  }

  async getScriptureCollectionsByUser(userId: string): Promise<ScriptureCollection[]> {
    return Array.from(this.scriptureCollections.values()).filter(collection => collection.userId === userId);
  }

  async createScriptureCollection(collectionData: InsertScriptureCollection & { userId: string }): Promise<ScriptureCollection> {
    const id = randomUUID();
    const collection = {
      id,
      userId: collectionData.userId,
      name: collectionData.name,
      description: collectionData.description ?? null,
      verses: (collectionData.verses as unknown) ?? null,
      createdAt: new Date(),
    } as unknown as ScriptureCollection;
    this.scriptureCollections.set(id, collection);
    return collection;
  }

  async updateScriptureCollection(id: string, collectionData: Partial<InsertScriptureCollection>): Promise<ScriptureCollection | undefined> {
    const collection = this.scriptureCollections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection: ScriptureCollection = {
      ...collection,
      name: collectionData.name ?? collection.name,
      description: (collectionData.description ?? collection.description) as string | null,
      verses: (collectionData.verses !== undefined
        ? ((collectionData.verses as unknown) as { reference: string; text: string; version: string; }[] | null)
        : collection.verses) as { reference: string; text: string; version: string; }[] | null,
    };
    this.scriptureCollections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteScriptureCollection(id: string): Promise<boolean> {
    return this.scriptureCollections.delete(id);
  }

  // Generated image methods
  async getGeneratedImage(id: string): Promise<GeneratedImage | undefined> {
    return this.generatedImages.get(id);
  }

  async getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]> {
    return Array.from(this.generatedImages.values()).filter(image => image.userId === userId);
  }

  async createGeneratedImage(imageData: InsertGeneratedImage & { userId: string }): Promise<GeneratedImage> {
    const id = randomUUID();
    const image: GeneratedImage = {
      id,
      userId: imageData.userId,
      prompt: imageData.prompt,
      imageUrl: imageData.imageUrl,
      style: imageData.style ?? null,
      aspectRatio: imageData.aspectRatio ?? null,
      createdAt: new Date(),
    };
    this.generatedImages.set(id, image);
    return image;
  }

  async deleteGeneratedImage(id: string): Promise<boolean> {
    return this.generatedImages.delete(id);
  }

  // Generated video methods
  async getGeneratedVideo(id: string): Promise<GeneratedVideo | undefined> {
    return this.generatedVideos.get(id);
  }

  async getGeneratedVideosByUser(userId: string): Promise<GeneratedVideo[]> {
    return Array.from(this.generatedVideos.values()).filter(video => video.userId === userId);
  }

  async createGeneratedVideo(videoData: InsertGeneratedVideo & { userId: string }): Promise<GeneratedVideo> {
    const id = randomUUID();
    const video: GeneratedVideo = {
      id,
      userId: videoData.userId,
      prompt: videoData.prompt,
      videoUrl: videoData.videoUrl ?? null,
      thumbnailUrl: videoData.thumbnailUrl ?? null,
      duration: videoData.duration ?? null,
      style: videoData.style ?? null,
      aspectRatio: videoData.aspectRatio ?? null,
      status: videoData.status ?? 'processing',
      createdAt: new Date(),
    };
    this.generatedVideos.set(id, video);
    return video;
  }

  async deleteGeneratedVideo(id: string): Promise<boolean> {
    return this.generatedVideos.delete(id);
  }

  // Generated audio methods
  async getGeneratedAudio(id: string): Promise<GeneratedAudio | undefined> {
    return this.generatedAudios.get(id);
  }

  async getGeneratedAudiosByUser(userId: string): Promise<GeneratedAudio[]> {
    return Array.from(this.generatedAudios.values()).filter(audio => audio.userId === userId);
  }

  async createGeneratedAudio(audioData: InsertGeneratedAudio & { userId: string }): Promise<GeneratedAudio> {
    const id = randomUUID();
    const audio: GeneratedAudio = {
      id,
      userId: audioData.userId,
      prompt: audioData.prompt,
      audioUrl: audioData.audioUrl,
      model: (audioData.model as any) ?? null,
      format: (audioData.format as any) ?? null,
      duration: audioData.duration ?? null,
      createdAt: new Date(),
    } as any;
    this.generatedAudios.set(id, audio);
    return audio;
  }

  async deleteGeneratedAudio(id: string): Promise<boolean> {
    return this.generatedAudios.delete(id);
  }

  // Voice recording methods
  async getVoiceRecording(id: string): Promise<VoiceRecording | undefined> {
    return this.voiceRecordings.get(id);
  }

  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    return Array.from(this.voiceRecordings.values()).filter(recording => recording.userId === userId);
  }

  async createVoiceRecording(recordingData: InsertVoiceRecording & { userId: string }): Promise<VoiceRecording> {
    const id = randomUUID();
    const recording: VoiceRecording = {
      id,
      userId: recordingData.userId,
      sermonId: recordingData.sermonId ?? null,
      title: recordingData.title ?? null,
      audioUrl: recordingData.audioUrl,
      transcription: recordingData.transcription ?? null,
      duration: recordingData.duration ?? null,
      createdAt: new Date(),
    };
    this.voiceRecordings.set(id, recording);
    return recording;
  }

  async updateVoiceRecording(id: string, recordingData: Partial<InsertVoiceRecording>): Promise<VoiceRecording | undefined> {
    const recording = this.voiceRecordings.get(id);
    if (!recording) return undefined;
    
    const updatedRecording: VoiceRecording = {
      ...recording,
      ...recordingData,
    };
    this.voiceRecordings.set(id, updatedRecording);
    return updatedRecording;
  }

  async deleteVoiceRecording(id: string): Promise<boolean> {
    return this.voiceRecordings.delete(id);
  }

  // Integration methods
  async getIntegration(id: string, userId: string): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    return integration?.userId === userId ? integration : undefined;
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(integration => integration.userId === userId);
  }

  async createIntegration(integrationData: InsertIntegration & { userId: string }): Promise<Integration> {
    const id = randomUUID();
    const integration: Integration = {
      id,
      userId: integrationData.userId,
      type: integrationData.type,
      name: integrationData.name,
      status: integrationData.status ?? 'connected',
      credentials: integrationData.credentials ?? null,
      settings: integrationData.settings ?? null,
      dataTypes: integrationData.dataTypes ?? null,
      lastSync: integrationData.lastSync ?? null,
      syncFrequency: integrationData.syncFrequency ?? 'daily',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, integrationData: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration: Integration = {
      ...integration,
      type: integrationData.type ?? integration.type,
      name: integrationData.name ?? integration.name,
      status: integrationData.status ?? integration.status,
      credentials: integrationData.credentials ?? integration.credentials,
      settings: integrationData.settings ?? integration.settings,
      dataTypes: integrationData.dataTypes ?? integration.dataTypes,
      lastSync: integrationData.lastSync ?? integration.lastSync,
      syncFrequency: integrationData.syncFrequency ?? integration.syncFrequency,
      updatedAt: new Date(),
    };
    this.integrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async deleteIntegration(id: string, userId: string): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration || integration.userId !== userId) return false;
    return this.integrations.delete(id);
  }
}

import { DrizzleStorage } from './drizzle-storage';
import { SupabaseStorage } from './supabase-storage';
import { FileStorage } from "./file-storage";

let storageImpl: IStorage;

// Priority: Supabase > Drizzle > FileStorage
if (process.env.USE_SUPABASE === 'true') {
  storageImpl = new SupabaseStorage();
  console.log('🗄️ Using Supabase for persistent cloud storage!');
} else if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
  try {
    storageImpl = new DrizzleStorage();
    console.log('Using DrizzleStorage (database-backed) for sermons and collections');
  } catch (e) {
    console.warn('Falling back to FileStorage due to DB init error:', e);
    storageImpl = new FileStorage();
  }
} else {
  storageImpl = new FileStorage();
  console.log('💾 Using persistent file-based storage - your content will survive server restarts!');
}

export const storage = storageImpl;

// Re-export shared types so other storage backends can import from './storage'
export type {
  GeneratedImage,
  GeneratedVideo,
  GeneratedAudio,
  InsertGeneratedImage,
  InsertGeneratedVideo,
  InsertGeneratedAudio,
  InsertPodcast,
  InsertScriptureCollection,
  InsertSermon,
  InsertUser,
  InsertVoiceRecording,
  InsertIntegration,
  Podcast,
  ScriptureCollection,
  Sermon,
  User,
  VoiceRecording,
  Integration,
} from '@shared/schema';
