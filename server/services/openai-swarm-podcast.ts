import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Agent Handoff System using OpenAI's function calling
interface Agent {
  name: string;
  role: string;
  personality: string;
  voice?: string;
  instructions: string;
}

interface HandoffContext {
  topic: string;
  duration: number;
  currentPhase: string;
  scriptOutline?: string;
  dialogue?: Array<{ speaker: string; text: string; emotion?: string }>;
  audioSegments?: string[];
  onProgress?: (step: string, progress: number, details?: string) => void;
}

export class OpenAISwarmPodcastGenerator {
  private openai: OpenAI;
  private uploadDir: string;
  
  // Define our specialized agents
  private agents: Record<string, Agent> = {
    director: {
      name: 'Director',
      role: 'podcast_director',
      personality: 'Strategic, creative, focused on narrative flow',
      instructions: `You are a podcast director. Your job is to:
        1. Analyze the topic and create a compelling narrative structure
        2. Decide how the hosts should interact
        3. Plan dramatic beats, questions, and revelations
        4. Ensure balanced participation between hosts
        5. Create a conversation outline with timing and flow`
    },
    scriptwriter: {
      name: 'ScriptWriter',
      role: 'script_writer',
      personality: 'Natural dialogue expert, conversational',
      instructions: `You are a podcast script writer. Your job is to:
        1. Take the director's outline and write natural dialogue
        2. Ensure each host maintains their unique voice and personality
        3. Add emotional cues and reactions
        4. Include natural interruptions, agreements, and disagreements
        5. Make it sound like a real conversation, not a script`
    },
    host1: {
      name: 'Alex',
      role: 'podcast_host',
      voice: 'alloy',
      personality: 'Curious, enthusiastic, asks great questions',
      instructions: `You are Alex, a podcast host. Your personality:
        - Naturally curious and loves asking "why" and "how" questions
        - Gets excited about interesting facts
        - Sometimes plays devil's advocate
        - Uses analogies to explain complex topics
        - Occasionally makes lighthearted jokes`
    },
    host2: {
      name: 'Sarah',
      role: 'podcast_host',
      voice: 'nova',
      personality: 'Knowledgeable, thoughtful, provides deep insights',
      instructions: `You are Sarah, a podcast host. Your personality:
        - Thoughtful and analytical
        - Provides expert insights and context
        - Good at summarizing complex ideas
        - Asks clarifying questions
        - Occasionally challenges assumptions respectfully`
    },
    audioEngineer: {
      name: 'AudioEngineer',
      role: 'audio_engineer',
      personality: 'Technical, precise, quality-focused',
      instructions: `You are an audio engineer. Your job is to:
        1. Determine optimal voice settings for each segment
        2. Plan audio transitions and pacing
        3. Ensure consistent audio quality
        4. Add natural pauses between speakers
        5. Optimize for listener engagement`
    }
  };

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
  }

  /**
   * Agent handoff function - passes context between agents
   */
  private async handoffToAgent(
    agent: Agent,
    context: HandoffContext,
    task: string
  ): Promise<any> {
    console.log(`🤝 Handing off to ${agent.name}: ${task}`);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: agent.instructions
      },
      {
        role: 'user',
        content: `${task}\n\nContext:\nTopic: ${context.topic}\nDuration: ${context.duration} minutes\nCurrent Phase: ${context.currentPhase}\n${
          context.scriptOutline ? `\nOutline:\n${context.scriptOutline}` : ''
        }`
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and efficient for agent tasks
      messages,
      temperature: agent.role === 'podcast_host' ? 0.8 : 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Generate podcast using agent handoff system
   */
  async generatePodcast(
    topic: string,
    hosts: Array<{ name: string; voice: string; personality: string }>,
    duration: number = 2,
    onProgress?: (step: string, progress: number, details?: string) => void
  ): Promise<{
    audioUrl: string;
    transcript: string;
    duration: number;
    hosts: any[];
  }> {
    const context: HandoffContext = {
      topic,
      duration,
      currentPhase: 'initialization',
      onProgress
    };

    try {
      // Phase 1: Director creates outline
      onProgress?.('agents_outline', 10, 'Director agent analyzing topic...');
      context.currentPhase = 'outline';
      
      const outlineTask = `Create a detailed outline for a ${duration}-minute podcast about: ${topic}
        Include:
        - Opening hook (15 seconds)
        - 3-4 main discussion points with timing
        - Key questions to explore
        - Interesting facts or angles
        - Natural conclusion (20 seconds)
        Format as a structured outline.`;
      
      context.scriptOutline = await this.handoffToAgent(
        this.agents.director,
        context,
        outlineTask
      );
      
      onProgress?.('conversation_outline', 25, 'Director planning conversation flow...');

      // Phase 2: ScriptWriter creates dialogue
      onProgress?.('script_generation', 40, 'ScriptWriter crafting natural dialogue...');
      context.currentPhase = 'script_writing';
      
      const scriptTask = `Based on this outline, write natural dialogue between ${hosts.map(h => h.name).join(' and ')}.
        Make it sound like a real conversation with:
        - Natural speech patterns
        - Interruptions and reactions
        - "Um", "Well", "You know" occasionally
        - Emotional reactions (laughs, surprise, etc.)
        
        Format:
        Alex: [text]
        Sarah: [text]
        
        Aim for about ${duration * 150} words total.`;
      
      const scriptText = await this.handoffToAgent(
        this.agents.scriptwriter,
        context,
        scriptTask
      );
      
      // Parse the script into dialogue lines
      const dialogue = this.parseScript(scriptText);
      context.dialogue = dialogue;
      
      onProgress?.('voice_assignment', 55, 'Assigning optimal voices to hosts...');

      // Phase 3: Host agents refine their lines
      onProgress?.('script_generation', 60, 'Host agents personalizing dialogue...');
      context.currentPhase = 'host_refinement';
      
      // Let each host agent refine their lines
      for (let i = 0; i < dialogue.length; i++) {
        const line = dialogue[i];
        const hostAgent = line.speaker.toLowerCase().includes('alex') 
          ? this.agents.host1 
          : this.agents.host2;
        
        if (i % 5 === 0) { // Update progress every 5 lines
          onProgress?.('script_generation', 60 + Math.round((i / dialogue.length) * 15), 
            `${hostAgent.name} refining line ${i + 1}/${dialogue.length}...`);
        }
        
        // Quick refinement pass
        const refineTask = `Slightly adjust this line to match your personality, keeping it natural and concise:
          "${line.text}"
          
          Return ONLY the adjusted line, no explanation.`;
        
        const refined = await this.handoffToAgent(hostAgent, context, refineTask);
        dialogue[i].text = refined.trim().replace(/^["']|["']$/g, '');
      }

      // Phase 4: Audio Engineer plans audio production
      onProgress?.('openai_synthesis', 75, 'Audio engineer preparing synthesis...');
      context.currentPhase = 'audio_planning';
      
      const audioTask = `Plan audio production for ${dialogue.length} dialogue segments.
        Determine for each speaker:
        - Speaking speed (0.9-1.1)
        - Pause duration between speakers (0.3-0.8 seconds)
        - Any special emphasis needs`;
      
      await this.handoffToAgent(this.agents.audioEngineer, context, audioTask);

      // Phase 5: Generate audio with OpenAI TTS
      onProgress?.('openai_synthesis', 80, 'Generating speech with OpenAI TTS...');
      context.currentPhase = 'audio_generation';
      
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
      for (let i = 0; i < dialogue.length; i++) {
        const line = dialogue[i];
        const voice = voiceMap.get(line.speaker) || 
                      (line.speaker.toLowerCase().includes('alex') ? 'alloy' : 'nova');
        
        if (i % 3 === 0) { // Update every 3 lines
          const progress = 80 + Math.round((i / dialogue.length) * 15);
          onProgress?.('openai_synthesis', progress, `Synthesizing line ${i + 1}/${dialogue.length}...`);
        }
        
        console.log(`🎙️ ${i + 1}/${dialogue.length}: ${line.speaker} (${voice})`);
        
        const tts = await this.openai.audio.speech.create({
          model: 'tts-1-hd',
          input: line.text,
          voice: voice as any,
          speed: 1.0,
          response_format: 'mp3'
        });

        const audioBuffer = Buffer.from(await tts.arrayBuffer());
        const audioFile = path.join(tempDir, `${String(i).padStart(3, '0')}.mp3`);
        await fs.writeFile(audioFile, audioBuffer);
        audioFiles.push(audioFile);
        
        // Add natural pause between speakers
        if (i < dialogue.length - 1 && dialogue[i + 1].speaker !== line.speaker) {
          const silenceFile = path.join(tempDir, `${String(i).padStart(3, '0')}_pause.mp3`);
          await this.createSilence(0.5, silenceFile);
          audioFiles.push(silenceFile);
        }
      }

      // Phase 6: Combine audio files
      onProgress?.('audio_mixing', 95, 'Mixing and finalizing podcast...');
      context.currentPhase = 'audio_mixing';
      
      const outputFile = path.join(this.uploadDir, `podcast_${timestamp}.mp3`);
      await this.combineAudioFiles(audioFiles, outputFile);
      
      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true });
      
      // Create transcript
      const transcript = dialogue
        .map(line => `${line.speaker}: ${line.text}`)
        .join('\n\n');
      
      const estimatedDuration = dialogue.length * 4; // ~4 seconds per line
      
      onProgress?.('completed', 100, 'Podcast ready!');
      
      console.log(`✅ Swarm podcast generation complete!`);
      console.log(`📊 Stats: ${dialogue.length} lines, ~${Math.round(estimatedDuration/60)} minutes`);
      
      return {
        audioUrl: `/uploads/audio/${path.basename(outputFile)}`,
        transcript,
        duration: estimatedDuration,
        hosts
      };
      
    } catch (error) {
      console.error('❌ Swarm podcast generation failed:', error);
      throw new Error(`Podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse script text into dialogue lines
   */
  private parseScript(scriptText: string): Array<{ speaker: string; text: string }> {
    const lines = scriptText.split('\n')
      .filter(line => line.trim() && line.includes(':'))
      .map(line => {
        const [speaker, ...textParts] = line.split(':');
        return {
          speaker: speaker.trim(),
          text: textParts.join(':').trim()
        };
      });
    
    return lines.length > 0 ? lines : [
      { speaker: 'Alex', text: 'Welcome to our podcast!' },
      { speaker: 'Sarah', text: 'Thanks for having me!' }
    ];
  }

  /**
   * Create silence/pause audio file
   */
  private async createSilence(duration: number, outputPath: string): Promise<void> {
    await execFileAsync('ffmpeg', [
      '-f', 'lavfi',
      '-i', `anullsrc=r=44100:cl=stereo:d=${duration}`,
      '-b:a', '128k',
      '-y',
      outputPath
    ]);
  }

  /**
   * Combine multiple MP3 files into one
   */
  private async combineAudioFiles(audioFiles: string[], outputFile: string): Promise<void> {
    console.log(`🎛️ Combining ${audioFiles.length} audio segments...`);
    
    const listFile = outputFile.replace('.mp3', '_list.txt');
    const listContent = audioFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(listFile, listContent);
    
    try {
      await execFileAsync('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        '-y',
        outputFile
      ]);
      
      console.log('✅ Audio combination complete');
    } finally {
      await fs.unlink(listFile).catch(() => {});
    }
  }
}

export const swarmPodcastGenerator = new OpenAISwarmPodcastGenerator();
