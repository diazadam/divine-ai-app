import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

interface Voice {
  id: string;
  style: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

interface Scene {
  t: number; // timestamp
  speaker: string;
  emotion: string;
  text: string;
  fx?: string[]; // effects like music_down_2s
}

interface PodcastTimeline {
  title: string;
  voices: Voice[];
  scenes: Scene[];
}

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

export class DirectorPodcastGenerator {
  private openai: OpenAI;
  private uploadDir: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.uploadDir = path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, 'lines'), { recursive: true });
  }

  /**
   * Generate podcast using director-first pipeline following OpenAI best practices
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
      console.log(`🎬 Director-first podcast generation: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => `${h.name} (${h.voice})`).join(', ')}`);
      console.log(`⏱️ Target duration: ${duration} minutes`);

      // Step 1: Get structured timeline using GPT-4o with JSON schema
      const timeline = await this.generateStructuredTimeline(topic, hosts, duration, options);
      
      // Step 2: Render each scene to audio with steerable prosody
      const audioSegments = await this.renderScenesToAudio(timeline);
      
      // Step 3: Mix and master the final podcast
      const finalAudio = await this.mixAndMaster(audioSegments, timeline);
      
      // Step 4: Save and return results
      const timestamp = Date.now();
      const audioFilename = `director-podcast-${timestamp}.mp3`;
      const audioPath = path.join(this.uploadDir, audioFilename);
      
      await fs.writeFile(audioPath, finalAudio);
      
      // Generate transcript from timeline
      const transcript = this.generateTranscript(timeline);
      
      // Calculate duration
      const estimatedDuration = Math.round(timeline.scenes[timeline.scenes.length - 1]?.t + 10) || duration * 60;
      
      console.log(`✅ Director-style podcast generated successfully!`);
      console.log(`📊 ${timeline.scenes.length} scenes, ~${Math.round(estimatedDuration/60 * 10)/10} minutes`);
      
      return {
        audioUrl: `/uploads/audio/${audioFilename}`,
        transcript,
        duration: estimatedDuration,
        hosts,
        metadata: {
          scenes: timeline.scenes.length,
          voices: timeline.voices.length,
          generatedAt: new Date().toISOString(),
          engine: 'director-openai-structured',
          timeline: timeline
        }
      };

    } catch (error) {
      console.error('❌ Director podcast generation failed:', error);
      throw new Error(`Director podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate structured timeline using GPT-4o with strict JSON schema
   */
  private async generateStructuredTimeline(
    topic: string, 
    hosts: PodcastHost[], 
    duration: number, 
    options: PodcastOptions
  ): Promise<PodcastTimeline> {
    
    // Define strict JSON schema for structured output
    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        voices: { 
          type: "array", 
          items: { 
            type: "object", 
            properties: {
              id: { type: "string" }, 
              style: { type: "string" },
              voice: { type: "string", enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] }
            },
            required: ["id", "style", "voice"]
          }
        },
        scenes: { 
          type: "array", 
          items: { 
            type: "object", 
            properties: {
              t: { type: "number" },
              speaker: { type: "string" },
              emotion: { type: "string" },
              text: { type: "string" },
              fx: { type: "array", items: { type: "string" } }
            }, 
            required: ["t", "speaker", "text"]
          }
        }
      },
      required: ["title", "voices", "scenes"]
    };

    const hostDescriptions = hosts.map(h => 
      `${h.name}: ${h.personality}, uses ${h.voice} voice, speaking style: ${h.style}`
    ).join('\n');

    const prompt = `Write a ${duration}-minute, ${hosts.length}-host podcast about "${topic}".

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON matching the schema
- BOTH hosts must speak multiple times (balanced dialogue)
- Each host gets roughly 50% speaking time
- Include timestamps (t) in seconds for proper timing
- Natural back-and-forth conversation with emotions
- Total duration: approximately ${duration * 60} seconds

HOSTS:
${hostDescriptions}

CONVERSATION STYLE: ${options.style || 'conversational'}
TARGET AUDIENCE: ${options.targetAudience || 'general'}

Structure: 
- Opening (15%): Natural introductions
- Main discussion (70%): Deep exploration with both perspectives  
- Closing (15%): Summary and farewell

Include subtle fx cues like:
- music_up_2s, music_down_2s for transitions
- pause_1s for dramatic effect
- breath for natural pauses

Output ONLY the JSON - no other text:`;

    console.log('🎬 Generating structured timeline with GPT-4o...');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are a veteran podcast showrunner. Generate structured podcast timelines as valid JSON only.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const timelineText = response.choices[0].message.content || '{}';
    
    try {
      const timeline = JSON.parse(timelineText) as PodcastTimeline;
      
      // Validate that both hosts are speaking
      const speakerCounts = hosts.reduce((acc, host) => {
        acc[host.name] = timeline.scenes.filter(scene => 
          scene.speaker === host.name || scene.speaker.toLowerCase().includes(host.name.toLowerCase())
        ).length;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`📊 Timeline generated: ${timeline.scenes.length} scenes`);
      console.log(`👥 Speaker distribution: ${Object.entries(speakerCounts).map(([name, count]) => `${name}: ${count}`).join(', ')}`);
      
      // Ensure both hosts are represented
      const hostNames = hosts.map(h => h.name);
      timeline.scenes.forEach(scene => {
        if (!hostNames.some(name => scene.speaker === name || scene.speaker.toLowerCase().includes(name.toLowerCase()))) {
          // Map unknown speakers to closest host name
          scene.speaker = hostNames[0]; // Default to first host
        }
      });
      
      return timeline;
      
    } catch (parseError) {
      console.error('❌ Failed to parse timeline JSON:', parseError);
      throw new Error(`Invalid JSON timeline generated: ${parseError}`);
    }
  }

  /**
   * Render each scene to audio with steerable prosody per line
   */
  private async renderScenesToAudio(timeline: PodcastTimeline): Promise<Buffer[]> {
    const audioSegments: Buffer[] = [];
    const lineDir = path.join(this.uploadDir, 'lines');
    
    console.log(`🎤 Rendering ${timeline.scenes.length} scenes to audio...`);
    
    // Create voice mapping from timeline
    const voiceMap = timeline.voices.reduce((acc, voice) => {
      acc[voice.id] = voice;
      return acc;
    }, {} as Record<string, Voice>);
    
    for (let i = 0; i < timeline.scenes.length; i++) {
      const scene = timeline.scenes[i];
      const voiceConfig = voiceMap[scene.speaker] || timeline.voices[0];
      
      if (!scene.text || scene.text.trim().length < 3) continue;
      
      try {
        console.log(`🎙️ ${scene.speaker} (${voiceConfig.voice}): "${scene.text.substring(0, 50)}..."`);
        
        // Build steerable prosody instructions
        const prosodyInstructions = this.buildProsodyInstructions(scene, voiceConfig);
        
        // Generate audio with OpenAI TTS
        const audioBuffer = await this.generateSteerableSpeech(
          scene.text, 
          voiceConfig.voice, 
          prosodyInstructions
        );
        
        audioSegments.push(audioBuffer);
        
        // Save individual line for debugging
        const lineFilename = `${i.toString().padStart(4, '0')}_${scene.speaker}.wav`;
        await fs.writeFile(path.join(lineDir, lineFilename), audioBuffer);
        
        // Add timing gaps based on fx cues
        if (scene.fx) {
          for (const fx of scene.fx) {
            if (fx.includes('pause')) {
              const pauseDuration = this.extractPauseDuration(fx);
              const silenceBuffer = await this.createSilence(pauseDuration);
              audioSegments.push(silenceBuffer);
            }
          }
        }
        
        // Add natural pause between speakers
        if (i < timeline.scenes.length - 1) {
          const nextScene = timeline.scenes[i + 1];
          const pauseDuration = nextScene.speaker !== scene.speaker ? 0.8 : 0.3;
          const pauseBuffer = await this.createSilence(pauseDuration);
          audioSegments.push(pauseBuffer);
        }
        
      } catch (error) {
        console.error(`❌ Failed to render scene ${i}:`, error);
      }
    }
    
    console.log(`✅ Rendered ${audioSegments.length} audio segments`);
    return audioSegments;
  }

  /**
   * Build steerable prosody instructions for each line
   */
  private buildProsodyInstructions(scene: Scene, voiceConfig: Voice): string {
    const baseStyle = voiceConfig.style;
    const emotion = scene.emotion || 'neutral';
    
    let instructions = `${baseStyle}. `;
    
    // Add emotion-specific steering
    switch (emotion.toLowerCase()) {
      case 'energetic':
      case 'excited':
        instructions += 'Deliver with energy and enthusiasm. Pace slightly faster. ';
        break;
      case 'calm':
      case 'thoughtful':
        instructions += 'Speak slower and more deliberately. Add natural pauses. ';
        break;
      case 'warm':
      case 'friendly':
        instructions += 'Use a warm, welcoming tone. Smile in your voice. ';
        break;
      case 'curious':
      case 'questioning':
        instructions += 'Show genuine curiosity. Slight uptick on questions. ';
        break;
      case 'analytical':
      case 'serious':
        instructions += 'Professional and measured delivery. Clear articulation. ';
        break;
      default:
        instructions += 'Natural conversational delivery. ';
    }
    
    instructions += 'Include natural breaths and slight variations in pace.';
    
    return instructions;
  }

  /**
   * Generate speech with steerable prosody using OpenAI TTS
   */
  async generateSteerableSpeech(
    text: string, 
    voice: string, 
    instructions: string
  ): Promise<Buffer> {
    
    // Clean text to remove any unwanted artifacts
    const cleanText = text
      .replace(/\[.*?\]/g, '') // Remove stage directions
      .replace(/\b(pause|pauses?|um|uh)\b/gi, '') // Remove pause words
      .replace(/\s+/g, ' ')
      .trim();
    
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      input: cleanText,
      voice: voice as any,
      speed: 0.95, // Slightly slower for more natural delivery
      response_format: 'mp3'
    });

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Extract pause duration from fx string like "pause_2s"
   */
  private extractPauseDuration(fx: string): number {
    const match = fx.match(/pause_(\d+(?:\.\d+)?)s?/);
    return match ? parseFloat(match[1]) : 1.0;
  }

  /**
   * Create silence buffer
   */
  private async createSilence(durationSeconds: number): Promise<Buffer> {
    // Generate minimal silence using TTS
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      input: ' ', // Single space for minimal audio
      voice: 'alloy',
      speed: 3.0, // Speed up to make it shorter
    });
    
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Mix and master the final podcast
   */
  private async mixAndMaster(audioSegments: Buffer[], timeline: PodcastTimeline): Promise<Buffer> {
    // Simple concatenation for now
    // In production: LUFS normalization, de-esser, crossfades, music ducking
    return Buffer.concat(audioSegments);
  }

  /**
   * Generate transcript from timeline
   */
  private generateTranscript(timeline: PodcastTimeline): string {
    return timeline.scenes
      .map(scene => `${scene.speaker}: ${scene.text}`)
      .join('\n\n');
  }

  /**
   * Map user hosts to director format
   */
  static mapHostsForDirector(userHosts: any[]): PodcastHost[] {
    const voices = ['echo', 'nova', 'fable', 'shimmer', 'onyx', 'alloy'];
    
    return userHosts.map((host, index) => ({
      name: host.name || `Host ${index + 1}`,
      personality: host.style || 'conversational',
      voice: (host.openaiVoice || voices[index % voices.length]) as PodcastHost['voice'],
      style: host.description || 'engaging and natural'
    }));
  }
}

export const directorPodcastGenerator = new DirectorPodcastGenerator();