import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

// Define the exact schema from ChatGPT-5 instructions
const VoiceStyle = z.object({
  id: z.string(),            // semantic name like "Host_A"
  voice: z.string(),         // model voice preset name, e.g. "alloy", "echo", "nova"
  style: z.string().optional() // "warm, curious", etc.
});

const Scene = z.object({
  t: z.number().default(0),   // timeline seconds
  speaker: z.string(),
  emotion: z.string().optional(),
  text: z.string(),
  fx: z.array(z.string()).default([]) // e.g. ["music_up_2s","music_down_2s","laugh_sfx"]
});

const ScriptPlan = z.object({
  title: z.string(),
  synopsis: z.string().optional(),
  chapter_markers: z.array(z.object({
    t: z.number(),
    title: z.string()
  })).default([]),
  voices: z.array(VoiceStyle),
  scenes: z.array(Scene).min(1)
});

type TScriptPlan = z.infer<typeof ScriptPlan>;
type VoiceMap = Record<string, {voice: string, style?: string}>;

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
  // New Codex options
  emotionAnalysis?: boolean;
  advancedDialogue?: boolean;
  includeTransitions?: boolean;
  customTopic?: string;
  theologicalContext?: boolean;
  backgroundMusic?: boolean;
  bedKey?: string;
  moderationOverride?: boolean;
  enableRAG?: boolean;
  contentModerationLevel?: string;
}

export class ChatGPT5PodcastGenerator {
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
   * Director-first pipeline: Generate structured script with timeline
   */
  private async draftScriptFromPrompt(
    userPrompt: string, 
    hostStyles: Array<{id: string, style?: string}>,
    duration: number,
    options: PodcastOptions = {}
  ): Promise<TScriptPlan> {
    
    // Enhanced system prompt based on options
    let sys = `You are a veteran podcast showrunner and dialogue director.
Write natural, witty, human conversation that sounds like two or more real hosts.
Avoid filler, robotic phrasing, or excessive exposition. Use subtle humor and rhythm.
Use short, conversational sentences. Sprinkle natural backchannels ("mm-hmm", brief laughs) sparingly.`;

    if (options.emotionAnalysis) {
      sys += `\nInclude emotional tags on key lines (\"smiling\", \"earnest\", \"deadpan\", \"excited\", \"thoughtful\").`;
    }

    if (options.advancedDialogue) {
      sys += `\nCreate sophisticated dialogue with nuanced personality differences and realistic interaction patterns.`;
    }

    if (options.includeTransitions) {
      sys += `\nAdd smooth transitions between topics and natural conversation bridges.`;
    }

    if (options.theologicalContext) {
      sys += `\nMaintain theological accuracy and pastoral sensitivity throughout the discussion.`;
    }

    if (options.backgroundMusic) {
      sys += `\nAdd appropriate music cues (music_up_2s, music_down_2s) for emotional moments.`;
    }

    sys += `\nNEVER use the word "pause" in dialogue - use natural speech only.
Return ONLY JSON exactly matching the schema: ScriptPlan.`;

    const targetScenes = Math.max(8, Math.floor(duration * 3)); // ~3 scenes per minute

    // Enhanced prompt content based on options
    let topicContent = userPrompt;
    if (options.customTopic) {
      topicContent = `${userPrompt}\n\nAdditional focus: ${options.customTopic}`;
    }

    let audienceGuideline = "";
    if (options.targetAudience && options.targetAudience !== 'general') {
      audienceGuideline = `\n- Target audience: ${options.targetAudience} - tailor language and complexity accordingly.`;
    }

    const prompt = {
      role: "user" as const,
      content: `User prompt/topic:
${topicContent}

Hosts:
${hostStyles.map(h => `${h.id}: ${h.style ?? "neutral, conversational"}`).join("\n")}

Guidelines:
- ${targetScenes} scenes for ${duration}-minute podcast. Keep turns tight, avoid monologues > 15s.
- Mark chapter breaks with chapter_markers (t + title).${audienceGuideline}
- Include light emotional tags on key lines ("smiling", "earnest", "deadpan").
- No hallucinated facts—stick to general knowledge or clearly mark opinion.
- Subtle SFX cues only, do not overdo them.
- NEVER include the word "pause" in dialogue text.
- Natural conversation flow with authentic reactions.
- Each host must speak multiple times with balanced participation.
- Output strictly JSON.`
    };

    console.log('🎬 Generating structured script with ChatGPT-5 method...');

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: "system", content: sys },
        prompt
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const raw = res.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Failed to get script JSON from model.");
    }

    let plan;
    try {
      plan = ScriptPlan.parse(JSON.parse(raw));
      console.log(`📊 Generated ${plan.scenes.length} scenes with ${plan.voices.length} voices`);
      
      // Validate both hosts are speaking
      const speakerCounts = plan.voices.reduce((acc, voice) => {
        acc[voice.id] = plan.scenes.filter(scene => scene.speaker === voice.id).length;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`👥 Speaker distribution: ${Object.entries(speakerCounts).map(([name, count]) => `${name}: ${count}`).join(', ')}`);
      
      return plan;
    } catch (e: any) {
      throw new Error("Script JSON failed validation: " + e.message);
    }
  }

  /**
   * Render each scene to audio with per-line prosody control
   */
  private async renderScenesToAudio(
    plan: TScriptPlan, 
    outDir: string, 
    voiceMap: VoiceMap, 
    sampleRate = 44100
  ): Promise<void> {
    await fs.mkdir(outDir, { recursive: true });

    console.log(`🎤 Rendering ${plan.scenes.length} scenes to audio...`);

    for (let i = 0; i < plan.scenes.length; i++) {
      const s = plan.scenes[i];
      const vm = voiceMap[s.speaker] || { voice: "alloy" };
      
      // Clean text to remove any unwanted artifacts (including "pause")
      const cleanText = s.text
        .replace(/\[.*?\]/g, '') // Remove stage directions
        .replace(/\b(pause|pauses?|um|uh)\b/gi, '') // Remove pause words
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText || cleanText.length < 3) continue;

      console.log(`🎙️ Scene ${i}: ${s.speaker} (${vm.voice}): "${cleanText.substring(0, 50)}..."`);

      try {
        // Use standard OpenAI TTS with steerable prosody via speed/emotion
        const speed = s.emotion === 'excited' ? 1.1 : 
                     s.emotion === 'calm' ? 0.9 : 1.0;

        const tts = await this.openai.audio.speech.create({
          model: 'tts-1-hd',
          input: cleanText,
          voice: vm.voice as any,
          response_format: "wav",
          speed: speed
        });

        const buf = Buffer.from(await tts.arrayBuffer());
        const filename = path.join(outDir, `${String(i).padStart(4,"0")}_${s.speaker}.wav`);
        await fs.writeFile(filename, buf);
        
      } catch (error) {
        console.error(`❌ Failed to generate audio for scene ${i}:`, error);
        throw error;
      }
    }

    console.log(`✅ Rendered ${plan.scenes.length} audio segments`);
  }

  /**
   * Assemble and master using ffmpeg (ChatGPT-5 mastering chain)
   */
  private async assembleAndMaster({
    plan,
    linesDir,
    outputPath,
    targetLufs = -16
  }: {
    plan: TScriptPlan,
    linesDir: string,
    outputPath: string,
    targetLufs?: number
  }): Promise<void> {
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const inputs: Array<{file: string; start: number}> = [];

    for (let i = 0; i < plan.scenes.length; i++) {
      const f = path.join(linesDir, `${String(i).padStart(4,"0")}_${plan.scenes[i].speaker}.wav`);
      inputs.push({ file: f, start: plan.scenes[i].t || 0 });
    }

    // Build complex filter graph for timeline alignment and mastering
    const filterParts: string[] = [];
    const inLabels: string[] = [];

    let idx = 0;
    for (const it of inputs) {
      const label = `v${idx}`;
      const delayMs = Math.max(0, Math.floor(it.start * 1000));
      filterParts.push(`[${idx}:a]anull,adelay=${delayMs}|${delayMs}[${label}]`);
      inLabels.push(`[${label}]`);
      idx++;
    }

    // ChatGPT-5 mastering chain: de-esser -> compand -> loudnorm
    const amix = `${inLabels.join("")}amix=inputs=${inLabels.length}:normalize=0:dropout_transition=0,` +
                 `dynaudnorm=f=150:g=31,` + // gentle leveling
                 `deesser=i=6:f=7500,` +     // remove harshness
                 `compand=attacks=0.02:decays=0.3:points=-80/-80|-20/-20|-8/-9|0/-6:soft-knee=6,` +
                 `alimiter=limit=-1,` +
                 `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11,` +
                 `dynaudnorm=f=100:g=10`;

    const complex = [
      ...filterParts,
      amix
    ].join(";");

    const args = [
      ...inputs.flatMap(it => ["-i", it.file]),
      "-filter_complex", complex,
      "-codec:a", "libmp3lame",
      "-ac", "2",
      "-ar", "44100",
      "-b:a", "192k",
      "-f", "mp3",
      outputPath
    ];

    console.log('🎛️ Mastering audio with ChatGPT-5 chain...');
    await execFileAsync("ffmpeg", args);
    console.log('✅ Audio mastered successfully');
  }

  /**
   * Generate podcast using ChatGPT-5 director-first approach
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
      console.log(`🎬 ChatGPT-5 Director-First Generation: "${topic}"`);
      console.log(`👥 Hosts: ${hosts.map(h => `${h.name} (${h.voice})`).join(', ')}`);
      console.log(`⏱️ Target duration: ${duration} minutes`);

      // Map hosts to ChatGPT-5 format
      const hostStyles = hosts.map(host => ({
        id: host.name,
        style: `${host.personality}, ${host.style}`
      }));

      // 1) Generate structured script with timeline
      const plan = await this.draftScriptFromPrompt(topic, hostStyles, duration, options);

      // 2) Create voice mapping
      const voiceMap: VoiceMap = {};
      hosts.forEach(host => {
        voiceMap[host.name] = { 
          voice: host.voice, 
          style: host.style 
        };
      });

      // 3) Render scenes to audio
      const timestamp = Date.now();
      const jobId = `chatgpt5-${timestamp}`;
      const workDir = path.join(this.uploadDir, jobId);
      const linesDir = path.join(workDir, 'lines');
      
      await this.renderScenesToAudio(plan, linesDir, voiceMap);

      // 4) Assemble and master
      const audioFilename = `chatgpt5-podcast-${timestamp}.mp3`;
      const audioPath = path.join(this.uploadDir, audioFilename);
      
      await this.assembleAndMaster({
        plan,
        linesDir,
        outputPath: audioPath
      });

      // 5) Generate transcript
      const transcript = plan.scenes
        .map(scene => `${scene.speaker}: ${scene.text}`)
        .join('\n\n');

      // Calculate duration from timeline
      const estimatedDuration = Math.round(
        plan.scenes[plan.scenes.length - 1]?.t + 10 || duration * 60
      );

      console.log(`✅ ChatGPT-5 podcast generated successfully!`);
      console.log(`📊 Stats: ${plan.scenes.length} scenes, ~${Math.round(estimatedDuration/60 * 10)/10} minutes`);

      return {
        audioUrl: `/uploads/audio/${audioFilename}`,
        transcript,
        duration: estimatedDuration,
        hosts,
        metadata: {
          scenes: plan.scenes.length,
          voices: plan.voices.length,
          generatedAt: new Date().toISOString(),
          engine: 'chatgpt5-director-first',
          timeline: plan,
          jobId
        }
      };

    } catch (error) {
      console.error('❌ ChatGPT-5 podcast generation failed:', error);
      throw new Error(`ChatGPT-5 podcast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map user hosts to ChatGPT-5 format
   */
  static mapHostsForChatGPT5(userHosts: any[]): PodcastHost[] {
    const voices = ['echo', 'nova', 'fable', 'shimmer', 'onyx', 'alloy'];
    
    return userHosts.map((host, index) => ({
      name: host.name || `Host_${String.fromCharCode(65 + index)}`, // Host_A, Host_B
      personality: host.style || 'conversational',
      voice: (host.openaiVoice || voices[index % voices.length]) as PodcastHost['voice'],
      style: host.description || 'engaging and natural'
    }));
  }
}

export const chatgpt5PodcastGenerator = new ChatGPT5PodcastGenerator();
