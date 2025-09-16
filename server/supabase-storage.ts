import { supabase } from './supabase';
import type { 
  User, 
  InsertUser,
  GeneratedImage, 
  InsertGeneratedImage,
  GeneratedVideo,
  InsertGeneratedVideo, 
  GeneratedAudio,
  InsertGeneratedAudio,
  Sermon,
  InsertSermon,
  Podcast,
  InsertPodcast,
  ScriptureCollection,
  InsertScriptureCollection,
  VoiceRecording,
  InsertVoiceRecording,
  IStorage 
} from './storage';

export class SupabaseStorage implements IStorage {
  
  // Initialize tables if they don't exist
  async initialize() {
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
      },
      {
        name: 'generated_images', 
        sql: `
          CREATE TABLE IF NOT EXISTS generated_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            image_url TEXT NOT NULL,
            style VARCHAR(100),
            aspect_ratio VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
      },
      {
        name: 'generated_videos',
        sql: `
          CREATE TABLE IF NOT EXISTS generated_videos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            video_url TEXT,
            thumbnail_url TEXT,
            duration INTEGER,
            style VARCHAR(100),
            aspect_ratio VARCHAR(20),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
      },
      {
        name: 'generated_audios',
        sql: `
          CREATE TABLE IF NOT EXISTS generated_audios (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            prompt TEXT NOT NULL,
            audio_url TEXT NOT NULL,
            model VARCHAR(100),
            format VARCHAR(20),
            duration INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`
      }
    ];

    console.log('🗄️ Initializing Supabase database tables...');
    
    // First, ensure pgcrypto extension is enabled for UUID generation
    try {
      const { error: extensionError } = await supabase.rpc('exec', {
        sql: 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
      });
      if (extensionError) {
        // Try alternative approach using raw SQL
        const { error: altError } = await supabase
          .from('pg_extension')
          .select('extname')
          .eq('extname', 'pgcrypto')
          .single();
        
        if (altError) {
          console.log('⚠️ Could not verify pgcrypto extension, but continuing...');
        }
      }
    } catch (e) {
      console.log('⚠️ Extension check skipped, continuing with table creation...');
    }
    
    // Create tables by executing SQL directly
    const sqlCommands = [
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        style VARCHAR(100),
        aspect_ratio VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS generated_videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        video_url TEXT,
        thumbnail_url TEXT,
        duration INTEGER,
        style VARCHAR(100),
        aspect_ratio VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS generated_audios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        model VARCHAR(100),
        format VARCHAR(20),
        duration INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON generated_videos(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_generated_audios_user_id ON generated_audios(user_id);`
    ];
    
    for (const sql of sqlCommands) {
      try {
        // Use the REST API to execute raw SQL
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_KEY!
          },
          body: JSON.stringify({ sql })
        });
        
        if (!response.ok) {
          // Try alternative method using SQL execution
          const { error } = await supabase.rpc('exec', { sql });
          if (error) {
            console.log(`⚠️ Could not execute SQL, may already exist: ${sql.substring(0, 50)}...`);
          } else {
            console.log(`✅ SQL executed successfully`);
          }
        } else {
          console.log(`✅ SQL executed successfully`);
        }
      } catch (e) {
        console.log(`⚠️ SQL execution skipped: ${sql.substring(0, 50)}...`);
      }
    }
    
    // Test if tables are working by trying a simple query
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        console.log('❌ Tables may not be properly created. Error:', error.message);
        throw new Error(`Supabase tables verification failed: ${error.message}`);
      } else {
        console.log('✅ Supabase tables verified and ready');
      }
    } catch (e) {
      console.log('❌ Table verification failed:', e);
      throw e;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      email: data.email,
      createdAt: new Date(data.created_at)
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      email: data.email,
      createdAt: new Date(data.created_at)
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: insertUser.username,
        password: insertUser.password,
        email: insertUser.email
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      email: data.email,
      createdAt: new Date(data.created_at)
    };
  }

  // Generated Images methods
  async getGeneratedImage(id: string): Promise<GeneratedImage | undefined> {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      imageUrl: data.image_url,
      style: data.style,
      aspectRatio: data.aspect_ratio,
      createdAt: new Date(data.created_at)
    };
  }

  async getGeneratedImagesByUser(userId: string): Promise<GeneratedImage[]> {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching images:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      prompt: item.prompt,
      imageUrl: item.image_url,
      style: item.style,
      aspectRatio: item.aspect_ratio,
      createdAt: new Date(item.created_at)
    }));
  }

  async createGeneratedImage(imageData: InsertGeneratedImage & { userId: string }): Promise<GeneratedImage> {
    const { data, error } = await supabase
      .from('generated_images')
      .insert([{
        user_id: imageData.userId,
        prompt: imageData.prompt,
        image_url: imageData.imageUrl,
        style: imageData.style,
        aspect_ratio: imageData.aspectRatio
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create image: ${error.message}`);
    
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      imageUrl: data.image_url,
      style: data.style,
      aspectRatio: data.aspect_ratio,
      createdAt: new Date(data.created_at)
    };
  }

  async deleteGeneratedImage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Sermons
  async getSermon(id: string): Promise<Sermon | undefined> {
    const { data, error } = await supabase.from('sermons').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    // Map Supabase row to Sermon shape
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      scripture: (data.scripture ?? null) as any,
      outline: (data.outline ?? null) as any,
      status: (data.status ?? 'draft') as any,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at ?? data.created_at),
    } as Sermon;
  }

  async getSermonsByUser(userId: string): Promise<Sermon[]> {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      scripture: (row.scripture ?? null) as any,
      outline: (row.outline ?? null) as any,
      status: (row.status ?? 'draft') as any,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at ?? row.created_at),
    } as Sermon));
  }

  async createSermon(sermon: InsertSermon & { userId: string }): Promise<Sermon> {
    const { data, error } = await supabase
      .from('sermons')
      .insert([{ user_id: sermon.userId, title: sermon.title, scripture: (sermon as any).scripture ?? null, outline: (sermon as any).outline ?? null, status: (sermon as any).status ?? 'draft' }])
      .select()
      .single();
    if (error) throw new Error(`Failed to create sermon: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      scripture: data.scripture ?? null,
      outline: data.outline ?? null,
      status: data.status ?? 'draft',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at ?? data.created_at),
    } as Sermon;
  }

  async updateSermon(id: string, updates: Partial<InsertSermon>): Promise<Sermon | undefined> {
    const { data, error } = await supabase
      .from('sermons')
      .update({ title: updates.title, scripture: (updates as any).scripture, outline: (updates as any).outline, status: (updates as any).status })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      scripture: data.scripture ?? null,
      outline: data.outline ?? null,
      status: data.status ?? 'draft',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at ?? data.created_at),
    } as Sermon;
  }

  async deleteSermon(id: string): Promise<boolean> {
    const { error } = await supabase.from('sermons').delete().eq('id', id);
    return !error;
  }

  // Podcasts
  async getPodcast(id: string): Promise<Podcast | undefined> {
    const { data, error } = await supabase.from('podcasts').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title,
      description: data.description ?? null,
      audioUrl: data.audio_url ?? null,
      duration: data.duration ?? null,
      status: (data.status ?? null) as any,
      playCount: (data.play_count ?? 0) as any,
      createdAt: new Date(data.created_at),
    } as Podcast;
  }

  async getPodcastsByUser(userId: string): Promise<Podcast[]> {
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      sermonId: row.sermon_id ?? null,
      title: row.title,
      description: row.description ?? null,
      audioUrl: row.audio_url ?? null,
      duration: row.duration ?? null,
      status: (row.status ?? null) as any,
      playCount: (row.play_count ?? 0) as any,
      createdAt: new Date(row.created_at),
    } as Podcast));
  }

  async createPodcast(podcast: InsertPodcast & { userId: string }): Promise<Podcast> {
    const payload: any = {
      user_id: podcast.userId,
      sermon_id: (podcast as any).sermonId ?? null,
      title: podcast.title,
      description: podcast.description ?? null,
      audio_url: podcast.audioUrl ?? '/uploads/audio/placeholder.mp3',
      duration: podcast.duration ?? null,
    };
    const { data, error } = await supabase.from('podcasts').insert([payload]).select().single();
    if (error) throw new Error(`Failed to create podcast: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title,
      description: data.description ?? null,
      audioUrl: data.audio_url ?? null,
      duration: data.duration ?? null,
      status: (data.status ?? null) as any,
      playCount: (data.play_count ?? 0) as any,
      createdAt: new Date(data.created_at),
    } as Podcast;
  }

  async updatePodcast(id: string, podcast: Partial<InsertPodcast>): Promise<Podcast | undefined> {
    const { data, error } = await supabase
      .from('podcasts')
      .update({
        title: podcast.title,
        description: podcast.description,
        audio_url: podcast.audioUrl,
        duration: podcast.duration,
      })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title,
      description: data.description ?? null,
      audioUrl: data.audio_url ?? null,
      duration: data.duration ?? null,
      status: (data.status ?? null) as any,
      playCount: (data.play_count ?? 0) as any,
      createdAt: new Date(data.created_at),
    } as Podcast;
  }

  async deletePodcast(id: string): Promise<boolean> {
    const { error } = await supabase.from('podcasts').delete().eq('id', id);
    return !error;
  }

  // Scripture Collections
  async getScriptureCollection(id: string): Promise<ScriptureCollection | undefined> {
    const { data, error } = await supabase.from('scripture_collections').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description ?? null,
      verses: (data.verses ?? null) as any,
      createdAt: new Date(data.created_at),
    } as ScriptureCollection;
  }

  async getScriptureCollectionsByUser(userId: string): Promise<ScriptureCollection[]> {
    const { data, error } = await supabase
      .from('scripture_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? null,
      verses: (row.verses ?? null) as any,
      createdAt: new Date(row.created_at),
    } as ScriptureCollection));
  }

  async createScriptureCollection(collection: InsertScriptureCollection & { userId: string }): Promise<ScriptureCollection> {
    const { data, error } = await supabase
      .from('scripture_collections')
      .insert([{ user_id: collection.userId, name: collection.name, description: collection.description ?? null, verses: collection.verses as any }])
      .select()
      .single();
    if (error) throw new Error(`Failed to create collection: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description ?? null,
      verses: (data.verses ?? null) as any,
      createdAt: new Date(data.created_at),
    } as ScriptureCollection;
  }

  async updateScriptureCollection(id: string, updates: Partial<InsertScriptureCollection>): Promise<ScriptureCollection | undefined> {
    const { data, error } = await supabase
      .from('scripture_collections')
      .update({ name: updates.name, description: updates.description ?? null, verses: updates.verses as any })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description ?? null,
      verses: (data.verses ?? null) as any,
      createdAt: new Date(data.created_at),
    } as ScriptureCollection;
  }

  async deleteScriptureCollection(id: string): Promise<boolean> {
    const { error } = await supabase.from('scripture_collections').delete().eq('id', id);
    return !error;
  }

  // Voice Recordings
  async getVoiceRecording(id: string): Promise<VoiceRecording | undefined> {
    const { data, error } = await supabase.from('voice_recordings').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title ?? null,
      audioUrl: data.audio_url,
      transcription: data.transcription ?? null,
      duration: data.duration ?? null,
      createdAt: new Date(data.created_at),
    } as VoiceRecording;
  }

  async getVoiceRecordingsByUser(userId: string): Promise<VoiceRecording[]> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      sermonId: row.sermon_id ?? null,
      title: row.title ?? null,
      audioUrl: row.audio_url,
      transcription: row.transcription ?? null,
      duration: row.duration ?? null,
      createdAt: new Date(row.created_at),
    } as VoiceRecording));
  }

  async createVoiceRecording(recording: InsertVoiceRecording & { userId: string }): Promise<VoiceRecording> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .insert([{ user_id: recording.userId, sermon_id: (recording as any).sermonId ?? null, title: recording.title ?? null, audio_url: recording.audioUrl, transcription: recording.transcription ?? null, duration: recording.duration ?? null }])
      .select()
      .single();
    if (error) throw new Error(`Failed to create voice recording: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title ?? null,
      audioUrl: data.audio_url,
      transcription: data.transcription ?? null,
      duration: data.duration ?? null,
      createdAt: new Date(data.created_at),
    } as VoiceRecording;
  }

  async updateVoiceRecording(id: string, recording: Partial<InsertVoiceRecording>): Promise<VoiceRecording | undefined> {
    const { data, error } = await supabase
      .from('voice_recordings')
      .update({ title: recording.title ?? null, audio_url: recording.audioUrl, transcription: recording.transcription ?? null, duration: recording.duration ?? null })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      sermonId: data.sermon_id ?? null,
      title: data.title ?? null,
      audioUrl: data.audio_url,
      transcription: data.transcription ?? null,
      duration: data.duration ?? null,
      createdAt: new Date(data.created_at),
    } as VoiceRecording;
  }

  async deleteVoiceRecording(id: string): Promise<boolean> {
    const { error } = await supabase.from('voice_recordings').delete().eq('id', id);
    return !error;
  }

  // Generated Videos methods
  async getGeneratedVideo(id: string): Promise<GeneratedVideo | undefined> {
    const { data, error } = await supabase.from('generated_videos').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      videoUrl: data.video_url ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
      duration: data.duration ?? null,
      style: data.style ?? null,
      aspectRatio: data.aspect_ratio ?? null,
      status: data.status ?? 'processing',
      createdAt: new Date(data.created_at),
    } as any;
  }

  async getGeneratedVideosByUser(userId: string): Promise<GeneratedVideo[]> {
    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      videoUrl: row.video_url ?? null,
      thumbnailUrl: row.thumbnail_url ?? null,
      duration: row.duration ?? null,
      style: row.style ?? null,
      aspectRatio: row.aspect_ratio ?? null,
      status: row.status ?? 'processing',
      createdAt: new Date(row.created_at),
    }));
  }

  async createGeneratedVideo(videoData: InsertGeneratedVideo & { userId: string }): Promise<GeneratedVideo> {
    const { data, error } = await supabase
      .from('generated_videos')
      .insert([{ user_id: videoData.userId, prompt: videoData.prompt, video_url: videoData.videoUrl ?? null, thumbnail_url: videoData.thumbnailUrl ?? null, duration: videoData.duration ?? null, style: videoData.style ?? null, aspect_ratio: videoData.aspectRatio ?? null, status: videoData.status ?? 'processing' }])
      .select()
      .single();
    if (error) throw new Error(`Failed to create video: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      videoUrl: data.video_url ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
      duration: data.duration ?? null,
      style: data.style ?? null,
      aspectRatio: data.aspect_ratio ?? null,
      status: data.status ?? 'processing',
      createdAt: new Date(data.created_at),
    } as any;
  }

  async deleteGeneratedVideo(id: string): Promise<boolean> {
    const { error } = await supabase.from('generated_videos').delete().eq('id', id);
    return !error;
  }

  // Generated Audio methods  
  async getGeneratedAudio(id: string): Promise<GeneratedAudio | undefined> {
    const { data, error } = await supabase.from('generated_audios').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      audioUrl: data.audio_url,
      model: data.model ?? null,
      format: data.format ?? null,
      duration: data.duration ?? null,
      createdAt: new Date(data.created_at),
    } as any;
  }

  async getGeneratedAudiosByUser(userId: string): Promise<GeneratedAudio[]> {
    const { data, error } = await supabase
      .from('generated_audios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      audioUrl: row.audio_url,
      model: row.model ?? null,
      format: row.format ?? null,
      duration: row.duration ?? null,
      createdAt: new Date(row.created_at),
    }));
  }

  async createGeneratedAudio(audioData: InsertGeneratedAudio & { userId: string }): Promise<GeneratedAudio> {
    const { data, error } = await supabase
      .from('generated_audios')
      .insert([{ user_id: audioData.userId, prompt: audioData.prompt, audio_url: audioData.audioUrl, model: (audioData as any).model ?? null, format: (audioData as any).format ?? null, duration: audioData.duration ?? null }])
      .select()
      .single();
    if (error) throw new Error(`Failed to create audio: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      prompt: data.prompt,
      audioUrl: data.audio_url,
      model: data.model ?? null,
      format: data.format ?? null,
      duration: data.duration ?? null,
      createdAt: new Date(data.created_at),
    } as any;
  }

  async deleteGeneratedAudio(id: string): Promise<boolean> {
    const { error } = await supabase.from('generated_audios').delete().eq('id', id);
    return !error;
  }

  // Integrations - not implemented for Supabase backend yet
  async getIntegration(_id: string, _userId: string): Promise<any | undefined> {
    throw new Error('Integrations not implemented for SupabaseStorage');
  }
  async getUserIntegrations(_userId: string): Promise<any[]> {
    return [];
  }
  async createIntegration(_integration: any): Promise<any> {
    throw new Error('Integrations not implemented for SupabaseStorage');
  }
  async updateIntegration(_id: string, _integration: any): Promise<any | undefined> {
    throw new Error('Integrations not implemented for SupabaseStorage');
  }
  async deleteIntegration(_id: string, _userId: string): Promise<boolean> {
    throw new Error('Integrations not implemented for SupabaseStorage');
  }
}
