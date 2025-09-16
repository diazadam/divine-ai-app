import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PodcastScene {
  t: number;
  speaker: string;
  emotion: string;
  text: string;
  fx?: string[];
}

interface PodcastStructure {
  title: string;
  voices: Array<{
    id: string;
    style: string;
    openaiVoice?: string;
  }>;
  scenes: PodcastScene[];
}

interface OpenAIVoice {
  id: string;
  name: string;
  description: string;
  style: string;
  gender: string;
  avatar: string;
}

export class OpenAIPodcastGenerator {
  private openai: OpenAI;
  private uploadDir: string;
  
  // OpenAI TTS voices with characteristics
  static readonly VOICES: OpenAIVoice[] = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', style: 'neutral', gender: 'neutral', avatar: '🎭' },
    { id: 'echo', name: 'Echo', description: 'Warm and engaging', style: 'warm', gender: 'male', avatar: '🎤' },
    { id: 'fable', name: 'Fable', description: 'Expressive British accent', style: 'expressive', gender: 'male', avatar: '🎨' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', style: 'authoritative', gender: 'male', avatar: '🗿' },
    { id: 'nova', name: 'Nova', description: 'Energetic and youthful', style: 'energetic', gender: 'female', avatar: '⭐' },
    { id: 'shimmer', name: 'Shimmer', description: 'Clear and soothing', style: 'soothing', gender: 'female', avatar: '✨' }
  ];

  constructor() {
    const apiKey = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey,
    });
    this.uploadDir = path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, 'temp'), { recursive: true });
  }

  /**
   * Generate a structured podcast script using GPT-4
   */
  async generateScript(
    topic: string,
    hosts: Array<{ name: string; style?: string; voice?: string }>,
    duration: number = 2, // minutes
    style: string = 'conversational'
  ): Promise<PodcastStructure> {
    const targetWords = duration * 150; // ~150 words per minute of speech
    
    const systemPrompt = `You are a veteran podcast showrunner creating engaging multi-host conversations.
    
    Output a JSON structure with this exact schema:
    {
      "title": "string",
      "voices": [{"id": "string", "style": "string", "openaiVoice": "string"}],
      "scenes": [{
        "t": number (start time in seconds),
        "speaker": "string (host name)",
        "emotion": "string (energetic|calm|thoughtful|excited|questioning|agreeing)",
        "text": "string (what they say)",
        "fx": ["string"] (optional sound effects like "music_down_2s")
      }]
    }`;

    const userPrompt = `Create a ${duration}-minute podcast episode about "${topic}".

HOSTS:
${hosts.map((h, i) => `- ${h.name}: ${h.style || 'conversational'} style, voice: ${h.voice || OpenAIPodcastGenerator.VOICES[i % 6].id}`).join('\n')}

REQUIREMENTS:
- Target: ~${targetWords} words total
- Natural conversation with ${hosts.length} distinct hosts
- Each host should speak multiple times
- Include reactions, questions, and building on each other's points
- Add natural pauses and timing (t values)
- Style: ${style}

Create engaging dialogue that feels like a real conversation between knowledgeable people.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 4000
    });

    const script = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure voices are properly mapped to OpenAI voices
    script.voices = script.voices.map((v: any, i: number) => ({
      ...v,
      openaiVoice: hosts[i]?.voice || OpenAIPodcastGenerator.VOICES[i % 6].id
    }));

    console.log(`📝 Generated script with ${script.scenes.length} scenes for ${hosts.length} hosts`);
    
    return script;
  }

  /**
   * Generate audio for a single scene using OpenAI TTS
   */
  async generateSceneAudio(
    scene: PodcastScene,
    voice: string,
    speed: number = 1.0
  ): Promise<Buffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1-hd', // Use HD model for better quality
        voice: voice as any,
        input: scene.text,
        speed: speed
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      console.log(`🎤 Generated audio for ${scene.speaker}: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error(`Failed to generate audio for scene:`, error);
      throw error;
    }
  }

  /**
   * Process and mix audio files using ffmpeg
   */
  async mixAudioFiles(
    audioFiles: Array<{ path: string; startTime: number }>,
    outputPath: string,
    backgroundMusic?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build ffmpeg command for mixing
      let ffmpegCmd = ['ffmpeg', '-y'];
      
      // Add all input files
      audioFiles.forEach(file => {
        ffmpegCmd.push('-i', file.path);
      });
      
      if (backgroundMusic) {
        ffmpegCmd.push('-i', backgroundMusic);
      }
      
      // Build complex filter for mixing with proper timing
      let filterComplex = '';
      const inputs = audioFiles.map((file, i) => {
        const delay = Math.floor(file.startTime * 1000); // Convert to milliseconds
        return `[${i}:a]adelay=${delay}|${delay}[a${i}]`;
      }).join('; ');
      
      const mixInputs = audioFiles.map((_, i) => `[a${i}]`).join('');
      filterComplex = `${inputs}; ${mixInputs}amix=inputs=${audioFiles.length}:duration=longest:dropout_transition=2[mixed]`;
      
      if (backgroundMusic) {
        // Add background music with ducking
        filterComplex += `; [${audioFiles.length}:a]volume=0.1[bg]; [mixed][bg]amix=inputs=2:duration=longest[final]`;
        ffmpegCmd.push('-filter_complex', filterComplex, '-map', '[final]');
      } else {
        filterComplex += `; [mixed]loudnorm=I=-16:TP=-1.5:LRA=11[final]`;
        ffmpegCmd.push('-filter_complex', filterComplex, '-map', '[final]');
      }
      
      // Output settings
      ffmpegCmd.push(
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        '-ar', '44100',
        outputPath
      );

      console.log(`🎛️ Mixing ${audioFiles.length} audio files...`);
      
      const ffmpeg = spawn(ffmpegCmd[0], ffmpegCmd.slice(1));
      
      ffmpeg.stderr.on('data', (data) => {
        // Log ffmpeg progress
        const output = data.toString();
        if (output.includes('time=')) {
          process.stdout.write(`\r${output.match(/time=([^ ]+)/)?.[1] || ''}`);
        }
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Audio mixing complete');
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
      
      ffmpeg.on('error', reject);
    });
  }

  /**
   * Check if ffmpeg is installed
   */
  async checkFfmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      console.warn('⚠️ ffmpeg not found. Audio mixing will be limited.');
      return false;
    }
  }

  /**
   * Simple audio concatenation fallback when ffmpeg is not available
   */
  async concatenateAudio(buffers: Buffer[]): Promise<Buffer> {
    // Simple concatenation - works for MP3 files but no mixing/timing control
    return Buffer.concat(buffers);
  }

  /**
   * Main podcast generation pipeline
   */
  async generatePodcast(
    topic: string,
    hosts: Array<{ name: string; style?: string; voice?: string }>,
    duration: number = 2,
    options: {
      style?: string;
      speed?: number;
      backgroundMusic?: boolean;
      outputFormat?: 'mp3' | 'wav';
    } = {}
  ): Promise<{
    audioUrl: string;
    transcript: string;
    duration: number;
    structure: PodcastStructure;
  }> {
    try {
      console.log(`🎙️ Starting OpenAI podcast generation: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => h.name).join(', ')}`);
      console.log(`⏱️ Target duration: ${duration} minutes`);
      
      // Generate the script
      const script = await this.generateScript(
        topic,
        hosts,
        duration,
        options.style || 'conversational'
      );
      
      // Generate audio for each scene
      const tempAudioFiles: Array<{ path: string; startTime: number; buffer: Buffer }> = [];
      const hasFfmpeg = await this.checkFfmpeg();
      
      for (const scene of script.scenes) {
        const voice = script.voices.find(v => v.id === scene.speaker)?.openaiVoice || 'nova';
        const audioBuffer = await this.generateSceneAudio(
          scene,
          voice,
          options.speed || 1.0
        );
        
        const tempPath = path.join(this.uploadDir, 'temp', `scene_${Date.now()}_${Math.random()}.mp3`);
        await fs.writeFile(tempPath, audioBuffer);
        
        tempAudioFiles.push({
          path: tempPath,
          startTime: scene.t,
          buffer: audioBuffer
        });
      }
      
      // Mix or concatenate audio
      const timestamp = Date.now();
      const outputFilename = `podcast_${timestamp}.mp3`;
      const outputPath = path.join(this.uploadDir, outputFilename);
      
      if (hasFfmpeg && tempAudioFiles.length > 1) {
        // Use ffmpeg for proper mixing with timing
        await this.mixAudioFiles(tempAudioFiles, outputPath);
      } else {
        // Fallback to simple concatenation
        console.log('⚠️ Using simple audio concatenation (install ffmpeg for better mixing)');
        const concatenated = await this.concatenateAudio(tempAudioFiles.map(f => f.buffer));
        await fs.writeFile(outputPath, concatenated);
      }
      
      // Clean up temp files
      for (const file of tempAudioFiles) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
      
      // Calculate actual duration (rough estimate)
      const stats = await fs.stat(outputPath);
      const estimatedDuration = Math.floor(stats.size / 16000); // Rough estimate
      
      // Generate transcript
      const transcript = script.scenes
        .map(scene => `${scene.speaker}: ${scene.text}`)
        .join('\n\n');
      
      console.log(`✅ Podcast generated successfully!`);
      console.log(`📁 Output: ${outputPath}`);
      console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return {
        audioUrl: `/uploads/audio/${outputFilename}`,
        transcript,
        duration: estimatedDuration,
        structure: script
      };
      
    } catch (error) {
      console.error('❌ Podcast generation failed:', error);
      throw error;
    }
  }

  /**
   * Get available OpenAI voices
   */
  static getAvailableVoices(): OpenAIVoice[] {
    return OpenAIPodcastGenerator.VOICES;
  }

  /**
   * Map emotion to speech parameters
   */
  private getSpeedForEmotion(emotion: string): number {
    switch (emotion) {
      case 'excited':
      case 'energetic':
        return 1.1;
      case 'thoughtful':
      case 'calm':
        return 0.9;
      case 'questioning':
        return 0.95;
      default:
        return 1.0;
    }
  }
}

export const openaiPodcastGenerator = new OpenAIPodcastGenerator();
