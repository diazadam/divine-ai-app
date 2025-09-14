import { promises as fs } from 'fs';
import path from 'path';
import { elevenLabsService } from './elevenlabs';

export interface AudioProcessingOptions {
  noiseReduction?: boolean;
  introOutro?: boolean;
  backgroundMusic?: boolean;
  chapterMarkers?: boolean;
}

export interface AudioMetadata {
  duration: number;
  format: string;
  sampleRate: number;
  channels: number;
}

export interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

class AudioProcessorService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'audio');

  constructor() {
    this.ensureUploadDir();
    this.cleanupOldFiles().catch(() => {});
    // Schedule daily cleanup
    setInterval(() => {
      this.cleanupOldFiles().catch(() => {});
    }, 24 * 60 * 60 * 1000);
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async processAudio(
    audioBuffer: Buffer,
    filename: string,
    options: AudioProcessingOptions = {}
  ): Promise<{ audioUrl: string; metadata: AudioMetadata }> {
    try {
      const audioPath = path.join(this.uploadDir, filename);
      await fs.writeFile(audioPath, audioBuffer);

      // For production, you would integrate with audio processing libraries
      // like FFmpeg, or cloud services like AWS Transcribe/Polly
      const metadata = await this.getAudioMetadata(audioPath);

      if (options.noiseReduction) {
        await this.applyNoiseReduction(audioPath);
      }

      if (options.introOutro) {
        await this.addIntroOutro(audioPath);
      }

      if (options.backgroundMusic) {
        await this.addBackgroundMusic(audioPath);
      }

      const audioUrl = `/uploads/audio/${filename}`;
      
      return {
        audioUrl,
        metadata,
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      throw new Error('Failed to process audio file');
    }
  }

  async transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // OpenAI Whisper transcription with proper multipart form
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: await this.createFormData(audioPath),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`Transcription API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.text,
        segments: data.segments || [],
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      // Fallback to basic transcription
      return {
        text: 'Transcription temporarily unavailable. Please try again later.',
        segments: [],
      };
    }
  }

  async generateSpeech(text: string, voice: string, useElevenLabs = true): Promise<Buffer> {
    try {
      // ALWAYS use ElevenLabs - no fallback
      if (!elevenLabsService.isConfigured()) {
        throw new Error('ElevenLabs API is not configured. Please set ELEVENLABS_API_KEY environment variable.');
      }
      
      console.log(`🎙️ Generating speech with ElevenLabs voice: ${voice}`);
      return await this.generateSpeechElevenLabs(text, voice);
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw new Error(`Failed to generate speech with ElevenLabs: ${error}`);
    }
  }

  private async generateSpeechOpenAI(text: string, voice = 'alloy'): Promise<Buffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Speech API error: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async generateSpeechElevenLabs(text: string, voiceId: string): Promise<Buffer> {
    // Use premium voice settings for best quality
    const voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    };

    return await elevenLabsService.generateSpeech(text, voiceId, voiceSettings);
  }

  private async getAudioMetadata(audioPath: string): Promise<AudioMetadata> {
    // In production, use a library like node-ffprobe or similar
    // For now, return mock metadata
    return {
      duration: 3600, // 1 hour
      format: 'mp3',
      sampleRate: 44100,
      channels: 2,
    };
  }

  private async applyNoiseReduction(audioPath: string): Promise<void> {
    // Implement noise reduction using FFmpeg or similar
    console.log(`Applying noise reduction to ${audioPath}`);
  }

  private async addIntroOutro(audioPath: string): Promise<void> {
    // Add intro/outro audio
    console.log(`Adding intro/outro to ${audioPath}`);
  }

  private async addBackgroundMusic(audioPath: string): Promise<void> {
    // Add background music
    console.log(`Adding background music to ${audioPath}`);
  }

  private async createFormData(audioPath: string): Promise<FormData> {
    const formData = new FormData();
    const buf = await fs.readFile(audioPath);
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    formData.append('file', blob, path.basename(audioPath));
    formData.append('model', 'whisper-1');
    return formData;
  }

  private async cleanupOldFiles(days = 30) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    try {
      const dir = this.uploadDir;
      const files = await fs.readdir(dir).catch(() => []);
      for (const name of files) {
        const p = path.join(dir, name);
        try {
          const st = await fs.stat(p);
          if (st.isFile() && st.mtimeMs < cutoff) {
            await fs.unlink(p);
          }
        } catch {}
      }
    } catch {}
  }
}

export const audioProcessorService = new AudioProcessorService();
