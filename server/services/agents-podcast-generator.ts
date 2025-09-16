import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { Agent, Runner } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

interface PodcastHost {
  name: string;
  personality: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  style: string;
}

interface PodcastOptions {
  style?: 'conversational' | 'theological' | 'pastoral' | 'energetic';
  speed?: number;
  includeMusic?: boolean;
  targetAudience?: string;
}

export class AgentsPodcastGenerator {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  /**
   * Generate audio from conversation script using OpenAI TTS
   */
  private async generateAudioFromScript(script: string, hosts: PodcastHost[]): Promise<Buffer[]> {
    const audioBuffers: Buffer[] = [];
    
    // Parse script lines
    const lines = script.split('\n').filter(line => line.trim() && line.includes(':'));
    
    console.log(`🎤 Generating audio for ${lines.length} dialogue lines...`);
    console.log(`👥 Available hosts: ${hosts.map(h => `${h.name} (${h.voice})`).join(', ')}`);
    
    for (const line of lines) {
      const [speakerPart, ...contentParts] = line.split(':');
      const speakerName = speakerPart.trim();
      const content = contentParts.join(':').trim();
      
      if (!content || content.length < 5) continue;
      
      // Find the host for this speaker
      const host = hosts.find(h => h.name.toLowerCase() === speakerName.toLowerCase());
      if (!host) {
        console.warn(`⚠️ No host found for speaker: ${speakerName}. Available hosts: ${hosts.map(h => h.name).join(', ')}`);
        continue;
      }
      const voice = host.voice || 'alloy';
      
      try {
        console.log(`🎙️ ${speakerName} (${voice}): "${content.substring(0, 50)}..."`);
        
        // Clean the content - remove any stage directions or pause instructions
        const cleanContent = content
          .replace(/\[pause\]/gi, '') // Remove [pause] markers
          .replace(/\[.*?\]/g, '') // Remove any other stage directions
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (cleanContent.length < 3) continue; // Skip if nothing left
        
        const audioBuffer = await this.generateSpeechOpenAI(cleanContent, voice);
        audioBuffers.push(audioBuffer);
        
        // Add natural pause between speakers (0.8 seconds)
        const pauseBuffer = await this.createSilence(0.8);
        audioBuffers.push(pauseBuffer);
        
      } catch (error) {
        console.warn(`⚠️ Failed to generate audio for line: ${speakerName}`, error);
        // Continue with other lines even if one fails
      }
    }
    
    console.log(`✅ Generated ${audioBuffers.length / 2} audio segments`);
    return audioBuffers;
  }

  /**
   * Generate speech using OpenAI TTS API
   */
  private async generateSpeechOpenAI(text: string, voice: string): Promise<Buffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice,
        speed: 1.0
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Create proper silence buffer for natural pauses
   */
  private async createSilence(durationSeconds: number): Promise<Buffer> {
    // Generate proper silence in MP3 format
    // 44.1kHz * 2 channels * 2 bytes per sample * duration
    const sampleRate = 44100;
    const channels = 2;
    const bytesPerSample = 2;
    const silenceSize = Math.floor(sampleRate * channels * bytesPerSample * durationSeconds);
    
    // Create PCM silence data
    const silenceData = Buffer.alloc(silenceSize, 0);
    
    // For now, return empty buffer - will be replaced with proper silence generation
    return Buffer.alloc(1024, 0); // Small silence buffer
  }

  /**
   * Create host switching tool for seamless conversation transitions
   */
  private createHostSwitchTool(): any {
    return {
      name: 'switch_host',
      description: 'Switch to a different podcast host for natural conversation flow',
      parameters: z.object({
        host_name: z.string().describe('Name of the host to switch to'),
        transition_phrase: z.string().describe('Natural transition phrase to use'),
        topic_focus: z.string().describe('What this host should focus on')
      })
    } as any;
  }

  /**
   * Create timing control tool for managing podcast duration
   */
  private createTimingTool(): any {
    return {
      name: 'manage_timing',
      description: 'Control podcast pacing and duration',
      parameters: z.object({
        action: z.enum(['check_time', 'wrap_up', 'extend_topic', 'transition']),
        reason: z.string().describe('Reason for timing adjustment')
      })
    } as any;
  }

  /**
   * Create enhanced topic transition tool
   */
  private createTopicTransitionTool(): any {
    return {
      name: 'transition_topic',
      description: 'Smoothly transition between podcast topics',
      parameters: z.object({
        from_topic: z.string().describe('Current topic being discussed'),
        to_topic: z.string().describe('Next topic to discuss'),
        transition_style: z.enum(['question', 'story', 'connection', 'contrast'])
      })
    } as any;
  }

  /**
   * Create specialized host agents with distinct personalities
   */
  private createHostAgents(hosts: PodcastHost[], topic: string, duration: number): RealtimeAgent[] {
    return hosts.map((host, index) => {
      const isFirstHost = index === 0;
      const hostNumber = index + 1;
      
      return new RealtimeAgent({
        name: host.name,
        model: 'gpt-4o',
        voice: host.voice,
        instructions: `You are ${host.name}, a ${host.personality} podcast host discussing "${topic}".

PERSONALITY & SPEAKING STYLE:
- ${host.style}
- Speak in ${isFirstHost ? 'an engaging, welcoming' : 'a thoughtful, supportive'} tone
- Use natural conversational language - no formal speech
- Keep responses concise but meaningful (15-30 words typically)
- Show genuine curiosity and engagement

YOUR ROLE IN THIS ${duration}-MINUTE PODCAST:
- ${isFirstHost ? 'Introduce topics, guide conversation flow, ask opening questions' : `Build on previous points, offer fresh perspectives, ask follow-up questions`}
- Balance speaking time - don't dominate or disappear
- React naturally to your co-host's comments
- Help maintain energy and engagement

NATURAL CONVERSATION TECHNIQUES:
- Use conversational connectors: "That's fascinating because...", "Building on that...", "What I find interesting is..."
- Ask engaging questions: "What's your take on...", "How do you see...", "What would you say to..."
- Show active listening: "Exactly!", "That's a great point", "I hadn't thought of it that way"
- Share brief personal insights or examples when relevant

AVOID:
- Long monologues or speeches
- Overly formal or academic language
- Repeating what the other host just said
- Stage directions or describing actions

Remember: This is a natural conversation between knowledgeable friends, not a lecture or interview.`,

        tools: [
          this.createHostSwitchTool(),
          this.createTimingTool(),
          this.createTopicTransitionTool()
        ]
      });
    });
  }

  /**
   * Create podcast director agent for orchestration
   */
  private createDirectorAgent(topic: string, hosts: PodcastHost[], duration: number): Agent {
    return new Agent({
      name: 'PodcastDirector',
      model: 'gpt-4o',
      instructions: `You are an expert podcast script creator. Generate natural, engaging dialogue scripts for a ${duration}-minute podcast about "${topic}" with ${hosts.length} hosts: ${hosts.map(h => h.name).join(', ')}.

SCRIPT CREATION REQUIREMENTS:
1. Create authentic dialogue that sounds like real people talking
2. Ensure BOTH hosts speak equally throughout (alternating frequently)
3. Target ${duration * 80} words total for ${duration} minutes (accounting for TTS pacing)
4. Use natural conversation flow with reactions and follow-ups
5. NO stage directions, NO [pause], NO narration - ONLY spoken dialogue

CONVERSATION STRUCTURE:
- Opening: Natural, welcoming introduction (15% of content)
- Main discussion: 3-4 key points with back-and-forth (70% of content)
- Closing: Collaborative conclusion and farewell (15% of content)

DIALOGUE QUALITY STANDARDS:
- Each response should be 15-30 words typically
- Include natural reactions: "That's really interesting...", "I love that point..."
- Ask engaging follow-ups: "What do you think about...", "How would you approach..."
- Show active listening: "Exactly!", "Building on that...", "That reminds me..."
- Maintain conversational energy throughout

HOST BALANCE ENFORCEMENT:
- ${hosts[0].name} should speak ${Math.floor(50/hosts.length * hosts.length)}% of the time
- ${hosts[1] ? hosts[1].name + ' should speak ' + Math.floor(50/hosts.length * hosts.length) + '% of the time' : ''}
- Alternate speakers frequently (every 1-2 responses)
- Each host must contribute unique perspectives

CRITICAL: Generate ONLY the dialogue script in format "HOST_NAME: [what they say]" - nothing else.`,

      tools: [
        this.createHostSwitchTool(),
        this.createTimingTool(),
        this.createTopicTransitionTool()
      ]
    });
  }

  /**
   * Generate a multi-host podcast using OpenAI Agents SDK
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
      console.log(`🎙️ Starting Agents SDK podcast generation: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => h.name).join(', ')}`);
      console.log(`⏱️ Target duration: ${duration} minutes`);

      // Create host agents
      const hostAgents = this.createHostAgents(hosts, topic, duration);
      const director = this.createDirectorAgent(topic, hosts, duration);

      // Generate conversation outline first
      const outlinePrompt = `Create a conversation outline for a ${duration}-minute podcast about "${topic}" with hosts: ${hosts.map(h => h.name).join(', ')}.

Include:
1. Natural opening introduction
2. 3-4 main discussion points
3. Smooth transitions between topics
4. Balanced participation from all hosts
5. Engaging conclusion

Keep it conversational and natural - no formal structure needed.`;

      console.log('🗂️ Generating conversation outline...');
      const outline = await Runner.runSync(director, outlinePrompt);
      
      // Create conversation script with host interactions
      const scriptPrompt = `Based on this outline: "${outline.finalOutput}"

Create a natural conversation script for ${hosts.length} hosts about "${topic}". 

CRITICAL FORMAT REQUIREMENTS:
- Use EXACT format: "HOST_NAME: [dialogue]"
- Each host MUST speak at least 3-4 times
- Alternate between hosts regularly
- NO stage directions, NO [pause], NO narration
- ONLY dialogue lines

CONTENT REQUIREMENTS:
- Target ${duration * 80} words total (strict limit for ${duration} minutes)
- Natural conversational flow
- Each host has distinct voice and perspective
- Include natural reactions: "That's interesting...", "Building on that..."
- End with collaborative conclusion

HOSTS (MUST BOTH SPEAK EQUALLY):
${hosts.map(h => `- ${h.name}: ${h.personality} speaking style (${h.style})`).join('\n')}

EXAMPLE FORMAT:
${hosts[0].name}: Welcome everyone! Today we're discussing ${topic}.
${hosts[1].name}: Thanks for having me! This is such an important topic.
${hosts[0].name}: Absolutely. What's your initial take on this?

CRITICAL CONSTRAINTS:
- MAXIMUM ${duration * 80} words total - DO NOT EXCEED
- MINIMUM ${Math.floor(duration * 60)} words 
- For ${duration} minutes: aim for ${Math.floor(duration * 70)}-${duration * 80} words

Now create the full conversation with BOTH hosts speaking equally:`;

      console.log('📝 Generating conversation script...');
      const script = await Runner.runSync(director, scriptPrompt);
      
      // Process script into audio using OpenAI TTS
      console.log('🎤 Converting conversation script to audio...');
      
      const audioBuffers = await this.generateAudioFromScript(script.finalOutput, hosts);
      
      // Combine audio segments
      const timestamp = Date.now();
      const audioFilename = `agents-podcast-${timestamp}.mp3`;
      const audioPath = path.join(this.uploadDir, audioFilename);
      
      const combinedAudio = Buffer.concat(audioBuffers);
      await fs.writeFile(audioPath, combinedAudio);
      
      // Calculate estimated duration based on word count and TTS speed
      const wordCount = script.finalOutput.split(' ').length;
      // OpenAI TTS is slower than natural speech: ~80 words per minute including pauses
      const estimatedDuration = Math.round((wordCount / 80) * 60); // Convert to seconds
      
      console.log(`📊 Word count: ${wordCount}, Target: ${duration * 80} words for ${duration} minutes`);
      
      console.log(`✅ Podcast generated successfully!`);
      console.log(`📊 Stats: ${wordCount} words, ~${Math.round(wordCount/80 * 10)/10} minutes (target: ${duration} minutes)`);
      
      return {
        audioUrl: `/uploads/audio/${audioFilename}`,
        transcript: script.finalOutput,
        duration: estimatedDuration,
        hosts,
        metadata: {
          wordCount,
          outline: outline.finalOutput,
          generatedAt: new Date().toISOString(),
          engine: 'openai-agents-sdk'
        }
      };

    } catch (error) {
      console.error('❌ Agents SDK podcast generation failed:', error);
      throw new Error(`Podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available OpenAI voices for host assignment
   */
  static getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', gender: 'neutral' },
      { id: 'echo', name: 'Echo', description: 'Warm and engaging', gender: 'male' },
      { id: 'fable', name: 'Fable', description: 'Expressive British accent', gender: 'male' },
      { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', gender: 'male' },
      { id: 'nova', name: 'Nova', description: 'Energetic and youthful', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', description: 'Clear and soothing', gender: 'female' }
    ];
  }

  /**
   * Map user host preferences to OpenAI Agent host format
   */
  static mapHostsForAgents(userHosts: any[]): PodcastHost[] {
    const voices = AgentsPodcastGenerator.getAvailableVoices();
    
    return userHosts.map((host, index) => ({
      name: host.name || `Host ${index + 1}`,
      personality: host.style || 'conversational',
      voice: (host.openaiVoice || voices[index % voices.length].id) as PodcastHost['voice'],
      style: host.description || 'engaging and thoughtful'
    }));
  }
}

export const agentsPodcastGenerator = new AgentsPodcastGenerator();
