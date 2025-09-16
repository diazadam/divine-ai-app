import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";
import type {
  GeneratedAudio,
  GeneratedImage,
  GeneratedVideo,
  IStorage,
  InsertGeneratedAudio,
  InsertGeneratedImage,
  InsertGeneratedVideo,
  InsertPodcast,
  InsertScriptureCollection,
  InsertSermon,
  InsertUser,
  InsertVoiceRecording,
  Podcast,
  ScriptureCollection,
  Sermon,
  User,
  VoiceRecording,
} from "./storage";

const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");
const IMAGES_FILE = join(DATA_DIR, "generated-images.json");
const VIDEOS_FILE = join(DATA_DIR, "generated-videos.json");
const AUDIOS_FILE = join(DATA_DIR, "generated-audios.json");
const SERMONS_FILE = join(DATA_DIR, "sermons.json");
const PODCASTS_FILE = join(DATA_DIR, "podcasts.json");
const COLLECTIONS_FILE = join(DATA_DIR, "scripture-collections.json");
const INTEGRATIONS_FILE = join(DATA_DIR, "integrations.json");
const RECORDINGS_FILE = join(DATA_DIR, "voice-recordings.json");

export class FileStorage implements IStorage {
  private users = new Map<string, User>();
  private generatedImages = new Map<string, GeneratedImage>();
  private generatedVideos = new Map<string, GeneratedVideo>();
  private generatedAudios = new Map<string, GeneratedAudio>();
  private sermons = new Map<string, Sermon>();
  private podcasts = new Map<string, Podcast>();
  private scriptureCollections = new Map<string, ScriptureCollection>();
  private voiceRecordings = new Map<string, VoiceRecording>();
  private integrations = new Map<string, any>();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Ensure data directory exists
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      console.log("📁 Data directory ready");
    } catch (error) {
      console.error("Failed to create data directory:", error);
    }

    // Load existing data
    await this.loadData();
  }

  private async loadData() {
    try {
      // Load users
      try {
        const usersData = await fs.readFile(USERS_FILE, "utf8");
        const users = JSON.parse(usersData);
        this.users.clear();
        for (const user of users) {
          this.users.set(user.id, {
            ...user,
            createdAt: new Date(user.createdAt),
          });
        }
        console.log(`📊 Loaded ${this.users.size} users from storage`);
      } catch (e) {
        console.log("📊 No existing users data found, starting fresh");
      }

      // Load images
      try {
        const imagesData = await fs.readFile(IMAGES_FILE, "utf8");
        const images = JSON.parse(imagesData);
        this.generatedImages.clear();
        for (const image of images) {
          this.generatedImages.set(image.id, {
            ...image,
            createdAt: new Date(image.createdAt),
          });
        }
        console.log(
          `🖼️ Loaded ${this.generatedImages.size} images from storage`
        );
      } catch (e) {
        console.log("🖼️ No existing images data found, starting fresh");
      }

      // Load videos
      try {
        const videosData = await fs.readFile(VIDEOS_FILE, "utf8");
        const videos = JSON.parse(videosData);
        this.generatedVideos.clear();
        for (const video of videos) {
          this.generatedVideos.set(video.id, {
            ...video,
            createdAt: new Date(video.createdAt),
          });
        }
        console.log(
          `🎬 Loaded ${this.generatedVideos.size} videos from storage`
        );
      } catch (e) {
        console.log("🎬 No existing videos data found, starting fresh");
      }

      // Load audios
      try {
        const audiosData = await fs.readFile(AUDIOS_FILE, "utf8");
        const audios = JSON.parse(audiosData);
        this.generatedAudios.clear();
        for (const audio of audios) {
          this.generatedAudios.set(audio.id, {
            ...audio,
            createdAt: new Date(audio.createdAt),
          });
        }
        console.log(
          `🎵 Loaded ${this.generatedAudios.size} audios from storage`
        );
      } catch (e) {
        console.log("🎵 No existing audios data found, starting fresh");
      }

      // Load podcasts
      try {
        const podcastsData = await fs.readFile(PODCASTS_FILE, "utf8");
        const podcasts = JSON.parse(podcastsData);
        this.podcasts.clear();
        for (const podcast of podcasts) {
          this.podcasts.set(podcast.id, {
            ...podcast,
            createdAt: new Date(podcast.createdAt),
          });
        }
        console.log(`🎙️ Loaded ${this.podcasts.size} podcasts from storage`);
      } catch (e) {
        console.log("🎙️ No existing podcasts data found, starting fresh");
      }

      // Load integrations
      try {
        const integrationsData = await fs.readFile(INTEGRATIONS_FILE, "utf8");
        const integrations = JSON.parse(integrationsData);
        this.integrations.clear();
        for (const integ of integrations) {
          this.integrations.set(integ.id, {
            ...integ,
            lastSync: integ.lastSync ? new Date(integ.lastSync) : null,
            createdAt: integ.createdAt ? new Date(integ.createdAt) : new Date(),
            updatedAt: integ.updatedAt ? new Date(integ.updatedAt) : new Date(),
          });
        }
        console.log(
          `🔌 Loaded ${this.integrations.size} integrations from storage`
        );
      } catch (e) {
        console.log("🔌 No existing integrations data found, starting fresh");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  private async saveUsers() {
    try {
      const data = Array.from(this.users.values());
      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  }

  private async saveImages() {
    try {
      const data = Array.from(this.generatedImages.values());
      await fs.writeFile(IMAGES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save images:", error);
    }
  }

  private async saveVideos() {
    try {
      const data = Array.from(this.generatedVideos.values());
      await fs.writeFile(VIDEOS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save videos:", error);
    }
  }

  private async saveAudios() {
    try {
      const data = Array.from(this.generatedAudios.values());
      await fs.writeFile(AUDIOS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save audios:", error);
    }
  }

  private async saveSermons() {
    try {
      const data = Array.from(this.sermons.values());
      await fs.writeFile(SERMONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save sermons:", error);
    }
  }

  private async savePodcasts() {
    try {
      const data = Array.from(this.podcasts.values());
      await fs.writeFile(PODCASTS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save podcasts:", error);
    }
  }

  private async saveCollections() {
    try {
      const data = Array.from(this.scriptureCollections.values());
      await fs.writeFile(COLLECTIONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save scripture collections:", error);
    }
  }

  private async saveRecordings() {
    try {
      const data = Array.from(this.voiceRecordings.values());
      await fs.writeFile(RECORDINGS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save voice recordings:", error);
    }
  }

  private async saveIntegrations() {
    try {
      const data = Array.from(this.integrations.values());
      await fs.writeFile(INTEGRATIONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save integrations:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  // Generated Images methods
  async getGeneratedImage(id: string): Promise<GeneratedImage | undefined> {
    return this.generatedImages.get(id);
  }

  async getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]> {
    return Array.from(this.generatedImages.values()).filter(
      (image) => image.userId === userId
    );
  }

  async createGeneratedImage(
    imageData: InsertGeneratedImage & { userId: string }
  ): Promise<GeneratedImage> {
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
    await this.saveImages();
    console.log(`✅ Saved image: ${image.prompt.substring(0, 50)}...`);
    return image;
  }

  async deleteGeneratedImage(id: string): Promise<boolean> {
    const result = this.generatedImages.delete(id);
    if (result) {
      await this.saveImages();
    }
    return result;
  }

  // Generated Videos methods
  async getGeneratedVideo(id: string): Promise<GeneratedVideo | undefined> {
    return this.generatedVideos.get(id);
  }

  async getGeneratedVideosByUser(userId: string): Promise<GeneratedVideo[]> {
    return Array.from(this.generatedVideos.values()).filter(
      (video) => video.userId === userId
    );
  }

  async createGeneratedVideo(
    videoData: InsertGeneratedVideo & { userId: string }
  ): Promise<GeneratedVideo> {
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
      status: videoData.status ?? "completed",
      createdAt: new Date(),
    };
    this.generatedVideos.set(id, video);
    await this.saveVideos();
    console.log(`✅ Saved video: ${video.prompt.substring(0, 50)}...`);
    return video;
  }

  async deleteGeneratedVideo(id: string): Promise<boolean> {
    const result = this.generatedVideos.delete(id);
    if (result) {
      await this.saveVideos();
    }
    return result;
  }

  // Generated Audio methods
  async getGeneratedAudio(id: string): Promise<GeneratedAudio | undefined> {
    return this.generatedAudios.get(id);
  }

  async getGeneratedAudiosByUser(userId: string): Promise<GeneratedAudio[]> {
    return Array.from(this.generatedAudios.values()).filter(
      (audio) => audio.userId === userId
    );
  }

  async createGeneratedAudio(
    audioData: InsertGeneratedAudio & { userId: string }
  ): Promise<GeneratedAudio> {
    const id = randomUUID();
    const audio: GeneratedAudio = {
      id,
      userId: audioData.userId,
      prompt: audioData.prompt,
      audioUrl: audioData.audioUrl,
      model: audioData.model ?? "unknown",
      format: audioData.format ?? "mp3",
      duration: audioData.duration ?? null,
      createdAt: new Date(),
    };
    this.generatedAudios.set(id, audio);
    await this.saveAudios();
    console.log(`✅ Saved audio: ${audio.prompt.substring(0, 50)}...`);
    return audio;
  }

  async deleteGeneratedAudio(id: string): Promise<boolean> {
    const result = this.generatedAudios.delete(id);
    if (result) {
      await this.saveAudios();
    }
    return result;
  }

  // Sermons
  async getSermon(id: string): Promise<Sermon | undefined> {
    return this.sermons.get(id);
  }
  async getSermonsByUser(userId: string): Promise<Sermon[]> {
    return Array.from(this.sermons.values()).filter((s) => s.userId === userId);
  }
  async createSermon(
    sermon: InsertSermon & { userId: string }
  ): Promise<Sermon> {
    const id = randomUUID();
    const created: Sermon = {
      id,
      userId: sermon.userId,
      title: sermon.title,
      scripture: (sermon as any).scripture ?? null,
      outline: (sermon as any).outline ?? null,
      status: ((sermon as any).status ?? "draft") as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.sermons.set(id, created);
    await this.saveSermons();
    return created;
  }
  async updateSermon(
    id: string,
    updates: Partial<InsertSermon>
  ): Promise<Sermon | undefined> {
    const existing = this.sermons.get(id);
    if (!existing) return undefined;
    const updated: Sermon = {
      ...existing,
      title: updates.title ?? existing.title,
      scripture: (updates as any).scripture ?? existing.scripture,
      outline: (updates as any).outline ?? existing.outline,
      status: ((updates as any).status ?? existing.status) as any,
      updatedAt: new Date(),
    } as any;
    this.sermons.set(id, updated);
    await this.saveSermons();
    return updated;
  }
  async deleteSermon(id: string): Promise<boolean> {
    const result = this.sermons.delete(id);
    if (result) await this.saveSermons();
    return result;
  }

  async getPodcast(id: string): Promise<Podcast | undefined> {
    return this.podcasts.get(id);
  }
  async getPodcastsByUser(userId: string): Promise<Podcast[]> {
    return Array.from(this.podcasts.values()).filter(
      (p) => p.userId === userId
    );
  }
  async createPodcast(
    podcast: InsertPodcast & { userId: string }
  ): Promise<Podcast> {
    const id = randomUUID();
    const created: Podcast = {
      id,
      userId: podcast.userId,
      sermonId: (podcast as any).sermonId ?? null,
      title: podcast.title,
      description: podcast.description ?? null,
      audioUrl: podcast.audioUrl ?? null,
      transcript: podcast.transcript ?? null,
      duration: podcast.duration ?? null,
      status: (podcast.audioUrl ? "completed" : "processing") as any,
      playCount: 0,
      createdAt: new Date(),
    } as any;
    this.podcasts.set(id, created);
    await this.savePodcasts();
    return created;
  }
  async updatePodcast(
    id: string,
    podcast: Partial<InsertPodcast>
  ): Promise<Podcast | undefined> {
    const existing = this.podcasts.get(id);
    if (!existing) return undefined;
    const updated: Podcast = { ...existing, ...podcast } as Podcast;
    this.podcasts.set(id, updated);
    await this.savePodcasts();
    return updated;
  }
  async deletePodcast(id: string): Promise<boolean> {
    const result = this.podcasts.delete(id);
    if (result) await this.savePodcasts();
    return result;
  }

  async getScriptureCollection(
    id: string
  ): Promise<ScriptureCollection | undefined> {
    return this.scriptureCollections.get(id);
  }
  async getScriptureCollectionsByUser(
    userId: string
  ): Promise<ScriptureCollection[]> {
    return Array.from(this.scriptureCollections.values()).filter(
      (c) => c.userId === userId
    );
  }
  async createScriptureCollection(
    collection: InsertScriptureCollection & { userId: string }
  ): Promise<ScriptureCollection> {
    const id = randomUUID();
    const created: ScriptureCollection = {
      id,
      userId: collection.userId,
      name: collection.name,
      description: collection.description ?? null,
      verses: (collection.verses as any) ?? null,
      createdAt: new Date(),
    } as any;
    this.scriptureCollections.set(id, created);
    await this.saveCollections();
    return created;
  }
  async updateScriptureCollection(
    id: string,
    updates: Partial<InsertScriptureCollection>
  ): Promise<ScriptureCollection | undefined> {
    const existing = this.scriptureCollections.get(id);
    if (!existing) return undefined;
    const updated: ScriptureCollection = {
      ...existing,
      name: updates.name ?? existing.name,
      description: (updates.description ?? existing.description) as any,
      verses: (updates.verses !== undefined
        ? (updates.verses as any)
        : existing.verses) as any,
    } as any;
    this.scriptureCollections.set(id, updated);
    await this.saveCollections();
    return updated;
  }
  async deleteScriptureCollection(id: string): Promise<boolean> {
    const result = this.scriptureCollections.delete(id);
    if (result) await this.saveCollections();
    return result;
  }

  async getVoiceRecording(id: string): Promise<VoiceRecording | undefined> {
    return this.voiceRecordings.get(id);
  }
  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    return Array.from(this.voiceRecordings.values()).filter(
      (r) => r.userId === userId
    );
  }
  async createVoiceRecording(
    recording: InsertVoiceRecording & { userId: string }
  ): Promise<VoiceRecording> {
    const id = randomUUID();
    const created: VoiceRecording = {
      id,
      userId: recording.userId,
      sermonId: (recording as any).sermonId ?? null,
      title: recording.title ?? null,
      audioUrl: recording.audioUrl,
      transcription: recording.transcription ?? null,
      duration: recording.duration ?? null,
      createdAt: new Date(),
    } as any;
    this.voiceRecordings.set(id, created);
    await this.saveRecordings();
    return created;
  }
  async updateVoiceRecording(
    id: string,
    recording: Partial<InsertVoiceRecording>
  ): Promise<VoiceRecording | undefined> {
    const existing = this.voiceRecordings.get(id);
    if (!existing) return undefined;
    const updated: VoiceRecording = {
      ...existing,
      ...recording,
    } as VoiceRecording;
    this.voiceRecordings.set(id, updated);
    await this.saveRecordings();
    return updated;
  }
  async deleteVoiceRecording(id: string): Promise<boolean> {
    const result = this.voiceRecordings.delete(id);
    if (result) await this.saveRecordings();
    return result;
  }

  // Integration methods
  async getIntegration(id: string, userId: string): Promise<any | undefined> {
    const integ = this.integrations.get(id);
    return integ && integ.userId === userId ? integ : undefined;
  }
  async getUserIntegrations(userId: string): Promise<any[]> {
    return Array.from(this.integrations.values()).filter(
      (i) => i.userId === userId
    );
  }
  async createIntegration(integration: any): Promise<any> {
    const id = randomUUID();
    const record = {
      id,
      ...integration,
      lastSync: integration.lastSync ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.integrations.set(id, record);
    await this.saveIntegrations();
    return record;
  }
  async updateIntegration(
    id: string,
    integration: any
  ): Promise<any | undefined> {
    const existing = this.integrations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...integration, updatedAt: new Date() };
    this.integrations.set(id, updated);
    await this.saveIntegrations();
    return updated;
  }
  async deleteIntegration(id: string, userId: string): Promise<boolean> {
    const existing = this.integrations.get(id);
    if (!existing || existing.userId !== userId) return false;
    const res = this.integrations.delete(id);
    if (res) await this.saveIntegrations();
    return res;
  }
}
