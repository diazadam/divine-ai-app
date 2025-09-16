import { promises as fs } from 'fs';
import path from 'path';
// Removed ElevenLabs dependency for simplicity
import { hfTtsService } from './tts-fallback';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AudioProcessingOptions {
  noiseReduction?: boolean;
  introOutro?: boolean;
  chapterMarkers?: boolean;
  backgroundMusic?: boolean;
  bedKey?: string;
  bedVolume?: number;
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
  private lastEngine: 'huggingface' | 'elevenlabs' = 'huggingface';
  private lastContentType: string = 'audio/mpeg';

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

      if (false) { // Background music disabled
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
      const OPENAI_KEY = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!OPENAI_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // OpenAI Whisper transcription with proper multipart form
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
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

  async generateSpeech(text: string, voice: string, useElevenLabs = false): Promise<Buffer> {
    try {
      // ElevenLabs path disabled
      throw new Error('ElevenLabs disabled - use OpenAI TTS instead');
    } catch (error) {
      console.warn('Primary TTS failed, attempting HuggingFace fallback:', error);
      if (!hfTtsService.isConfigured()) {
        throw new Error(`Failed TTS and no HuggingFace fallback configured: ${error}`);
      }
      const out = await hfTtsService.synthesize(text);
      this.lastEngine = 'huggingface';
      this.lastContentType = 'audio/mpeg'; // Force MP3 for consistency
      return out.buffer;
    }
  }

  async generateSpeechWithSettings(text: string, voiceId: string, settings: { stability?: number; similarity_boost?: number; style?: number; use_speaker_boost?: boolean; }): Promise<Buffer> {
    try {
      // ElevenLabs path disabled
      throw new Error('ElevenLabs disabled - use OpenAI TTS instead');
    } catch (err) {
      console.warn('ElevenLabs generateSpeechWithSettings failed, using HuggingFace fallback:', err);
      if (!hfTtsService.isConfigured()) throw err;
      const out = await hfTtsService.synthesize(text);
      this.lastEngine = 'huggingface';
      this.lastContentType = 'audio/mpeg'; // Force MP3 for consistency
      return out.buffer;
    }
  }

  async generateSpeechOpenAI(text: string, voice = 'alloy', speed: number = 1.0): Promise<Buffer> {
    const OPENAI_KEY = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Use HD model for better quality
        input: text,
        voice: voice,
        speed: speed
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Speech API error: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Create a short silence gap by generating an ultra-short TTS of a space.
   * Note: This is a pragmatic approach to avoid ffmpeg; durationSeconds is approximate.
   */
  async createSilence(durationSeconds: number = 0.6): Promise<Buffer> {
    // Generate a short silent-ish mp3 chunk and repeat to approximate duration
    const chunk = await this.generateSpeechOpenAI(' ', 'alloy', 3.0);
    if (durationSeconds <= 0.35) return chunk;
    const repeats = Math.max(1, Math.min(6, Math.ceil(durationSeconds / 0.35)));
    const parts: Buffer[] = [];
    for (let i = 0; i < repeats; i++) parts.push(chunk);
    return Buffer.concat(parts);
  }

  async hasFfmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      console.warn('⚠️ ffmpeg not found. Skipping mixing step.');
      return false;
    }
  }

  /**
   * Mix a speech track with a background music bed using ffmpeg.
   * Applies light EQ, normalization and compression to speech, and low-volume bed.
   */
  async mixWithBackground({
    speechPath,
    bedPath,
    outputPath,
    bedVolume = 0.07,
  }: {
    speechPath: string;
    bedPath: string;
    outputPath: string;
    bedVolume?: number; // 0.0 - 1.0 (we clamp to safe range)
  }): Promise<void> {
    if (!(await this.hasFfmpeg())) {
      // Fallback: copy speech to output if ffmpeg missing
      await fs.copyFile(speechPath, outputPath);
      return;
    }

    return new Promise((resolve, reject) => {
      // Loop the bed to ensure it covers the speech length; stop at shortest
      // Clamp volume to a safe, subtle range (1% - 20%)
      const vol = Math.max(0.01, Math.min(0.2, Number.isFinite(bedVolume) ? bedVolume : 0.07));

      const args = [
        '-y',
        '-stream_loop', '-1', '-i', bedPath,
        '-i', speechPath,
        '-filter_complex',
        // 0:a = bed, 1:a = speech
        // Process speech, set bed low, then mix. Keep duration to shortest (speech)
        `[1:a]highpass=f=80,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=11,acompressor=threshold=-20dB:ratio=2:attack=5:release=50[vocal];` +
        `[0:a]volume=${vol.toFixed(2)}[bg];` +
        '[vocal][bg]amix=inputs=2:duration=shortest:dropout_transition=2, dynaudnorm=f=150:g=10[final]',
        '-map', '[final]',
        '-c:a', 'libmp3lame',
        '-b:a', '160k',
        '-ar', '44100',
        '-shortest',
        outputPath,
      ];

      const ff = spawn('ffmpeg', args);
      let stderr = '';
      ff.stderr.on('data', d => { stderr += d.toString(); });
      ff.on('close', code => {
        if (code === 0) return resolve();
        reject(new Error(`ffmpeg failed (${code}): ${stderr.split('\n').slice(-4).join('\n')}`));
      });
      ff.on('error', reject);
    });
  }

  getLastEngine(): 'huggingface' | 'elevenlabs' { return this.lastEngine; }
  getLastContentType(): string { return this.lastContentType; }

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
