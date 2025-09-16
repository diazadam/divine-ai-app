import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface PodcastHost {
  name: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  personality: string;
}

interface ScriptLine {
  speaker: string;
  text: string;
  emotion?: string;
}

export class CleanPodcastGenerator {
  private openai: OpenAI;
  private uploadDir: string;

  constructor() {
    const apiKey = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({ apiKey });
    this.uploadDir = path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  /**
   * Generate podcast script using simple Gemini AI call (saves OpenAI credits)
   */
  async generateScript(topic: string, hosts: PodcastHost[], duration: number): Promise<ScriptLine[]> {
    console.log(`🎬 Generating ${duration}-minute podcast script about: "${topic}"`);
    
    // Use direct Gemini API call for simple script generation
    const mod: any = await import('@google/genai');
    const ai = new mod.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const hostInfo = hosts.map(h => `${h.name} (${h.personality})`).join(', ');
    const prompt = `Create a ${duration}-minute podcast conversation between ${hostInfo} about: ${topic}

Format as alternating dialogue. Each host should speak multiple times with balanced participation.
Keep responses natural and conversational. Aim for about ${duration * 150} total words.

Example format:
Alex: Welcome to our show! Today we're talking about ${topic}.
Sarah: Thanks Alex! I'm really excited to dive into this topic...

Return ONLY the dialogue lines in the format shown above.`;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(prompt);
      
      const result = await response.response;
      const scriptText = result.text() || '';
      
      // Parse script into structured lines
      const lines = scriptText.split('\n')
        .filter((line: string) => line.trim() && line.includes(':'))
        .map((line: string) => {
          const [speaker, ...textParts] = line.split(':');
          return {
            speaker: speaker.trim(),
            text: textParts.join(':').trim()
          };
        });

      console.log(`✅ Generated script with ${lines.length} dialogue lines`);
      return lines;
      
    } catch (error) {
      console.error('❌ Gemini script generation failed:', error);
      
      // Fallback to simple hardcoded script
      const fallbackScript = [
        { speaker: hosts[0]?.name || 'Host1', text: `Welcome to our podcast! Today we're discussing ${topic}.` },
        { speaker: hosts[1]?.name || 'Host2', text: 'Thanks for having me! This is such an interesting topic.' },
        { speaker: hosts[0]?.name || 'Host1', text: `Let's dive right in. What are your thoughts on ${topic}?` },
        { speaker: hosts[1]?.name || 'Host2', text: 'Well, I think there are several key points to consider here.' },
        { speaker: hosts[0]?.name || 'Host1', text: `That's a great perspective. Can you tell us more about that?` },
        { speaker: hosts[1]?.name || 'Host2', text: 'Absolutely. This topic really impacts a lot of people.' },
        { speaker: hosts[0]?.name || 'Host1', text: 'Thanks for sharing those insights with our listeners today!' }
      ];
      
      console.log('⚠️ Using fallback script due to Gemini error');
      return fallbackScript;
    }
  }


  /**
   * Combine multiple MP3 files into one using ffmpeg
   */
  private async combineAudioFiles(audioFiles: string[], outputFile: string): Promise<void> {
    console.log(`🎛️ Combining ${audioFiles.length} audio segments...`);
    
    // Create a file list for ffmpeg concat
    const listFile = outputFile.replace('.mp3', '_list.txt');
    const listContent = audioFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(listFile, listContent);
    
    try {
      // Use ffmpeg to concatenate the files
      await execFileAsync('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-y', // Overwrite output file
        outputFile
      ]);
      
      console.log('✅ Audio combination complete');
    } finally {
      // Cleanup list file
      await fs.unlink(listFile).catch(() => {});
    }
  }

  /**
   * Main podcast generation method with progress callback
   */
  async generatePodcastWithProgress(
    topic: string,
    hosts: PodcastHost[],
    duration: number = 2,
    onProgress?: (step: string, progress: number, details?: string) => void
  ): Promise<{
    audioUrl: string;
    transcript: string;
    duration: number;
    hosts: PodcastHost[];
  }> {
    try {
      console.log(`🎙️ Starting clean podcast generation: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => `${h.name} (${h.voice})`).join(', ')}`);
      
      onProgress?.('script_generation', 35, 'Creating dialogue with Gemini AI...');
      
      // 1. Generate script with Gemini
      const script = await this.generateScript(topic, hosts, duration);
      
      onProgress?.('voice_assignment', 50, 'Assigning voices to hosts...');
      
      // 2. Convert to audio with OpenAI TTS
      onProgress?.('openai_synthesis', 60, 'Generating speech with OpenAI TTS...');
      const audioUrl = await this.generateAudioWithProgress(script, hosts, onProgress);
      
      // 3. Create transcript
      const transcript = script
        .map(line => `${line.speaker}: ${line.text}`)
        .join('\n\n');
      
      // 4. Estimate duration (rough calculation)
      const estimatedDuration = Math.round(script.length * 4); // ~4 seconds per line
      
      console.log(`✅ Podcast generation complete!`);
      console.log(`📊 Stats: ${script.length} lines, ~${Math.round(estimatedDuration/60)} minutes`);
      
      return {
        audioUrl,
        transcript,
        duration: estimatedDuration,
        hosts
      };
      
    } catch (error) {
      console.error('❌ Clean podcast generation failed:', error);
      throw new Error(`Podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert script to audio using OpenAI TTS with progress
   */
  async generateAudioWithProgress(script: ScriptLine[], hosts: PodcastHost[], onProgress?: (step: string, progress: number, details?: string) => void): Promise<string> {
    console.log(`🎤 Converting script to audio...`);
    
    const timestamp = Date.now();
    const tempDir = path.join(this.uploadDir, `temp_${timestamp}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    const audioFiles: string[] = [];
    
    // Create voice mapping
    const voiceMap = new Map();
    hosts.forEach(host => {
      voiceMap.set(host.name, host.voice);
    });

    // Generate audio for each line
    for (let i = 0; i < script.length; i++) {
      const line = script[i];
      const voice = voiceMap.get(line.speaker) || 'alloy';
      
      const progress = 60 + Math.round((i / script.length) * 25); // 60-85% progress
      onProgress?.('openai_synthesis', progress, `Generating line ${i + 1}/${script.length}`);
      
      console.log(`🎙️ ${i + 1}/${script.length}: ${line.speaker} (${voice})`);
      
      try {
        const tts = await this.openai.audio.speech.create({
          model: 'tts-1-hd',
          input: line.text,
          voice: voice,
          response_format: 'mp3'
        });

        const audioBuffer = Buffer.from(await tts.arrayBuffer());
        const audioFile = path.join(tempDir, `${String(i).padStart(3, '0')}.mp3`);
        await fs.writeFile(audioFile, audioBuffer);
        audioFiles.push(audioFile);
      } catch (error) {
        console.error(`❌ Failed to generate audio for line ${i}:`, error);
        throw error;
      }
    }

    onProgress?.('audio_mixing', 88, 'Combining audio segments...');

    // Combine audio files with ffmpeg
    const outputFile = path.join(this.uploadDir, `podcast_${timestamp}.mp3`);
    await this.combineAudioFiles(audioFiles, outputFile);
    
    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Generated podcast: ${path.basename(outputFile)}`);
    return `/uploads/audio/${path.basename(outputFile)}`;
  }
  
  /**
   * Main podcast generation method (backward compatibility)
   */
  async generatePodcast(
    topic: string,
    hosts: PodcastHost[],
    duration: number = 2
  ): Promise<{
    audioUrl: string;
    transcript: string;
    duration: number;
    hosts: PodcastHost[];
  }> {
    return this.generatePodcastWithProgress(topic, hosts, duration);
  }
}

export const cleanPodcastGenerator = new CleanPodcastGenerator();
