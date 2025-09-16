import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

interface PodcastHost {
  name: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  personality: string;
  style: string;
}

interface PodcastOptions {
  style?: 'conversational' | 'theological' | 'pastoral' | 'energetic';
  speed?: number;
  includeMusic?: boolean;
  targetAudience?: string;
}

export class SimplePodcastGenerator {
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
   * Generate a simple, effective podcast using OpenAI best practices
   */
  async generatePodcast(
    topic: string,
    hosts: PodcastHost[],
    duration: number = 2,
    options: PodcastOptions = {}
  ): Promise<{
    audioUrl: string;
    transcript: string;
    duration: number;
    hosts: PodcastHost[];
    metadata: any;
  }> {
    try {
      console.log(`🎙️ Generating ${duration}-minute podcast: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => `${h.name} (${h.voice})`).join(', ')}`);

      // Step 1: Generate conversation script using simple GPT-4 call
      const script = await this.generateScript(topic, hosts, duration, options);
      
      // Step 2: Parse script and generate audio for each speaker
      const audioSegments = await this.generateAudioSegments(script, hosts);
      
      // Step 3: Combine audio segments
      const finalAudio = await this.combineAudioSegments(audioSegments);
      
      // Step 4: Save final podcast
      const timestamp = Date.now();
      const audioFilename = `simple-podcast-${timestamp}.mp3`;
      const audioPath = path.join(this.uploadDir, audioFilename);
      
      await fs.writeFile(audioPath, finalAudio);
      
      // Calculate actual duration
      const wordCount = script.split(' ').length;
      const estimatedDuration = Math.round((wordCount / 120) * 60); // More realistic TTS rate
      
      console.log(`✅ Podcast generated: ${wordCount} words, ~${Math.round(wordCount/120 * 10)/10} minutes`);
      
      return {
        audioUrl: `/uploads/audio/${audioFilename}`,
        transcript: script,
        duration: estimatedDuration,
        hosts,
        metadata: {
          wordCount,
          generatedAt: new Date().toISOString(),
          engine: 'simple-openai-tts',
          targetDuration: duration
        }
      };

    } catch (error) {
      console.error('❌ Simple podcast generation failed:', error);
      throw new Error(`Podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate conversation script using simple, effective prompting
   */
  private async generateScript(
    topic: string, 
    hosts: PodcastHost[], 
    duration: number, 
    options: PodcastOptions
  ): Promise<string> {
    
    const targetWords = duration * 120; // Conservative words per minute for natural speech
    
    const prompt = `Create a natural ${duration}-minute podcast conversation about "${topic}".

HOSTS:
${hosts.map((h, i) => `${h.name}: ${h.personality} speaking style - uses ${h.voice} voice`).join('\n')}

REQUIREMENTS:
- Exactly ${targetWords} words total (strict limit for ${duration} minutes)
- Each host speaks roughly 50% of the time
- Natural back-and-forth conversation
- No stage directions, no [pause], no descriptions
- Only spoken dialogue in format: "HOST_NAME: what they say"

CONVERSATION FLOW:
- Opening: Brief introductions and topic setup (20%)
- Main discussion: Deep dive with both perspectives (60%) 
- Closing: Summary and farewell (20%)

DIALOGUE STYLE:
- Keep individual responses 15-25 words
- Use natural speech: "That's really interesting..." "I think..." "What do you make of..."
- Show active listening: "Exactly!" "Building on that..." "That reminds me..."
- Ask follow-up questions to keep it conversational
- Sound like real people having a genuine conversation

Generate ONLY the dialogue script - no other text:`;

    console.log('📝 Generating conversation script...');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // More natural variation
      max_tokens: targetWords * 1.5, // Give room for generation
    });

    const script = response.choices[0].message.content || '';
    console.log(`📊 Generated ${script.split(' ').length} words (target: ${targetWords})`);
    
    return script;
  }

  /**
   * Generate audio segments for each speaker with proper voice assignment
   */
  private async generateAudioSegments(script: string, hosts: PodcastHost[]): Promise<Buffer[]> {
    const audioSegments: Buffer[] = [];
    
    // Parse script lines
    const lines = script.split('\n').filter(line => line.trim() && line.includes(':'));
    
    console.log(`🎤 Processing ${lines.length} dialogue lines...`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [speakerPart, ...contentParts] = line.split(':');
      const speakerName = speakerPart.trim();
      const content = contentParts.join(':').trim();
      
      if (!content || content.length < 3) continue;
      
      // Find matching host
      const host = hosts.find(h => 
        h.name.toLowerCase() === speakerName.toLowerCase() ||
        speakerName.toLowerCase().includes(h.name.toLowerCase()) ||
        h.name.toLowerCase().includes(speakerName.toLowerCase())
      );
      
      if (!host) {
        console.warn(`⚠️ No host found for "${speakerName}". Available: ${hosts.map(h => h.name).join(', ')}`);
        continue;
      }
      
      // Clean content thoroughly
      const cleanContent = content
        .replace(/\b(pause|pauses?|um|uh)\b/gi, '') // Remove pause words
        .replace(/\[.*?\]/g, '') // Remove stage directions
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (cleanContent.length < 3) continue;
      
      console.log(`🎙️ ${speakerName} (${host.voice}): "${cleanContent.substring(0, 50)}..."`);
      
      try {
        // Generate speech with proper settings
        const audioBuffer = await this.generateSpeech(cleanContent, host.voice);
        audioSegments.push(audioBuffer);
        
        // Add natural pause between speakers (except last)
        if (i < lines.length - 1) {
          const pauseBuffer = await this.createSilence(0.6);
          audioSegments.push(pauseBuffer);
        }
        
      } catch (error) {
        console.error(`❌ Failed to generate audio for ${speakerName}:`, error);
      }
    }
    
    console.log(`✅ Generated ${Math.floor(audioSegments.length / 2)} audio segments`);
    return audioSegments;
  }

  /**
   * Generate speech using OpenAI TTS with optimized settings
   */
  private async generateSpeech(text: string, voice: string): Promise<Buffer> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd', // High quality model
      input: text,
      voice: voice as any,
      speed: 0.95, // Slightly slower for more natural speech
      response_format: 'mp3'
    });

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Create proper silence buffer
   */
  private async createSilence(durationSeconds: number): Promise<Buffer> {
    // Generate a very short MP3 silence
    const silenceText = " "; // Single space creates minimal audio
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      input: silenceText,
      voice: 'alloy',
      speed: 3.0, // Speed up to make it shorter
    });
    
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Combine audio segments into final podcast
   */
  private async combineAudioSegments(segments: Buffer[]): Promise<Buffer> {
    // Simple concatenation for now
    // In production, you'd use ffmpeg for proper audio mixing
    return Buffer.concat(segments);
  }

  /**
   * Map user host preferences to simple format
   */
  static mapHostsForSimple(userHosts: any[]): PodcastHost[] {
    const voices = ['echo', 'nova', 'fable', 'shimmer', 'onyx', 'alloy'];
    
    return userHosts.map((host, index) => ({
      name: host.name || `Host ${index + 1}`,
      personality: host.style || 'conversational',
      voice: (host.openaiVoice || voices[index % voices.length]) as PodcastHost['voice'],
      style: host.description || 'engaging and natural'
    }));
  }
}

export const simplePodcastGenerator = new SimplePodcastGenerator();
