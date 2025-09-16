import { execFile } from "child_process";
import { promises as fs } from "fs";
import OpenAI from "openai";
import path from "path";
import { promisify } from "util";
import * as geminiService from "./gemini";

const execFileAsync = promisify(execFile);

interface PodcastHost {
  name: string;
  voice: string;
  voiceName?: string;
  personality?: string;
  expertise?: string;
  style?: string;
}

interface PodcastOptions {
  style?:
    | "conversational"
    | "theological"
    | "pastoral"
    | "energetic"
    | "educational"
    | "entertaining";
  duration?: number;
  speed?: number;
  includeMusic?: boolean;
  targetAudience?: string;
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
  // Mindblowing features
  realTimeEmotion?: boolean;
  dynamicPacing?: boolean;
  personalityConsistency?: boolean;
  naturalInterruptions?: boolean;
  contextualReactions?: boolean;
  adaptiveLength?: boolean;
  multiLanguageSupport?: boolean;
  voiceCloning?: boolean;
  soundDesign?: boolean;
  liveEditing?: boolean;
}

interface ConversationSegment {
  speaker: string;
  text: string;
  emotion:
    | "neutral"
    | "excited"
    | "thoughtful"
    | "questioning"
    | "agreeing"
    | "surprised"
    | "passionate"
    | "concerned"
    | "amused";
  delivery: {
    speed: number;
    emphasis: string;
    pauseBefore: number;
    pauseAfter: number;
  };
  context: {
    isQuestion: boolean;
    isReaction: boolean;
    isTransition: boolean;
    buildsOn?: string;
    introduces?: string;
  };
  audioEffects: string[];
}

export class SimpleMindblowingPodcastGenerator {
  private openai: OpenAI;
  private uploadDir: string;

  constructor() {
    const apiKey = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey,
    });
    this.uploadDir = path.join(process.cwd(), "uploads", "audio");
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, "temp"), { recursive: true });
    await fs.mkdir(path.join(this.uploadDir, "segments"), { recursive: true });
  }

  /**
   * Create enhanced voice profiles with personality consistency
   */
  private createEnhancedVoiceProfiles(hosts: PodcastHost[]): any[] {
    const personalityTemplates = [
      {
        personality:
          "Enthusiastic and curious host who asks great questions and keeps the energy high",
        expertise:
          "General hosting, asking insightful questions, keeping conversation flowing",
        speakingStyle:
          'Energetic, uses "That\'s fascinating!", "Tell me more about...", frequently acknowledges guest points',
        catchphrases: [
          "That's incredible!",
          "I love that perspective",
          "Our listeners are going to find this so valuable",
        ],
        backchannels: ["mm-hmm", "right", "exactly", "I see", "wow"],
        emotionalRange: [
          "excited",
          "thoughtful",
          "questioning",
          "agreeing",
          "surprised",
        ],
      },
      {
        personality:
          "Thoughtful expert who provides deep insights and practical applications",
        expertise:
          "Subject matter expert, provides detailed explanations, offers practical advice",
        speakingStyle:
          'Thoughtful, uses "From my experience...", "What I have found is...", provides specific examples',
        catchphrases: [
          "In my experience",
          "What is really interesting is",
          "Let me give you a practical example",
        ],
        backchannels: [
          "mm-hmm",
          "I understand",
          "that makes sense",
          "absolutely",
        ],
        emotionalRange: [
          "thoughtful",
          "passionate",
          "concerned",
          "amused",
          "neutral",
        ],
      },
      {
        personality:
          "Analytical thinker who brings different perspectives and challenges ideas constructively",
        expertise:
          "Critical thinking, alternative perspectives, connecting concepts",
        speakingStyle:
          'Analytical, uses "On the other hand...", "That raises an interesting question...", builds on ideas',
        catchphrases: [
          "That is a great point, and it makes me think",
          "Building on that idea",
          "From another angle",
        ],
        backchannels: [
          "hmm",
          "interesting",
          "I hadn't thought of that",
          "that's a good point",
        ],
        emotionalRange: [
          "thoughtful",
          "questioning",
          "agreeing",
          "surprised",
          "neutral",
        ],
      },
    ];

    return hosts.map((host, index) => {
      const template =
        personalityTemplates[index % personalityTemplates.length];
      return {
        id: host.name.toLowerCase().replace(/\s+/g, "_"),
        name: host.name,
        voice:
          host.voice ||
          ["alloy", "echo", "fable", "nova", "onyx", "shimmer"][index % 6],
        personality: host.personality || template.personality,
        expertise: host.expertise || template.expertise,
        speakingStyle: host.style || template.speakingStyle,
        emotionalRange: template.emotionalRange,
        catchphrases: template.catchphrases,
        backchannels: template.backchannels,
        voiceSettings: {
          speed: 1.0,
          pitch: 1.0,
          emphasis: "natural",
        },
      };
    });
  }

  /**
   * Generate episode structure with AI-powered planning
   */
  private async generateEpisodeStructure(
    topic: string,
    hosts: any[],
    duration: number,
    options: PodcastOptions
  ): Promise<any> {
    console.log("🧠 Generating episode structure with AI planning...");

    // Generate detailed episode outline with Gemini
    const outlinePrompt = `Create a detailed podcast episode structure for "${topic}".

HOSTS:
${hosts.map((h) => `- ${h.name}: ${h.personality} (${h.expertise})`).join("\n")}

REQUIREMENTS:
- Target duration: ${duration} minutes
- Create 4-6 engaging segments with natural flow
- Each host should have distinct voice and expertise
- Include natural conversation flow with reactions, questions, building on each other's points
- Make it feel like a real conversation between knowledgeable people
- Use natural interruptions, agreements, and emotional responses
- Include chapter markers for key moments
- Ensure balanced participation from all hosts

STRUCTURE NEEDED:
1. Engaging intro (1-2 minutes)
2. Main discussion segments (3-4 segments, 2-3 minutes each)
3. Natural transitions between segments
4. Strong conclusion with key takeaways (1-2 minutes)

Generate a detailed structure with specific talking points, emotional beats, and natural conversation flow.`;

    const outline = await geminiService.createChat([
      {
        role: "user",
        content: outlinePrompt,
      },
    ]);

    // Parse outline into structured format
    const segments = this.parseOutlineToSegments(outline, hosts, duration);

    return {
      title: topic,
      synopsis: outline.substring(0, 200) + "...",
      duration: duration * 60,
      hosts,
      segments,
      chapterMarkers: this.generateChapterMarkers(segments),
      metadata: {
        totalWords: segments.reduce(
          (acc: number, seg: any) =>
            acc +
            seg.content.reduce(
              (a: number, c: any) => a + c.text.split(" ").length,
              0
            ),
          0
        ),
        averageSegmentLength: (duration * 60) / segments.length,
        hostParticipation: this.calculateHostParticipation(segments, hosts),
        emotionalDistribution: this.calculateEmotionalDistribution(segments),
        generatedAt: new Date().toISOString(),
        engine: "simple-mindblowing-ai-podcast-generator",
      },
    };
  }

  /**
   * Generate natural conversation segments with AI
   */
  private async generateConversationSegments(
    segment: any,
    hosts: any[],
    options: PodcastOptions
  ): Promise<ConversationSegment[]> {
    const segmentPrompt = `Create natural, engaging dialogue for this podcast segment: "${
      segment.title
    }"

HOSTS: ${hosts.map((h) => `${h.name} (${h.personality})`).join(", ")}

REQUIREMENTS:
- Natural conversation with questions, answers, reactions
- Each host contributes based on their expertise and personality
- Include specific examples and practical insights
- Natural interruptions and building on ideas
- Show genuine interest and engagement
- Use their speaking styles and catchphrases naturally
- Include emotional variety and authentic reactions
- Make it sound like real people having an engaging conversation

${options.emotionAnalysis ? "- Include emotional tags for key moments" : ""}
${
  options.naturalInterruptions
    ? "- Include natural interruptions and overlapping speech"
    : ""
}
${
  options.contextualReactions
    ? "- Add contextual reactions and backchannels"
    : ""
}

Format as: "SPEAKER_NAME: [dialogue]"
Make it conversational, not scripted. Include natural reactions and building on each other's comments.`;

    const script = await geminiService.createChat([
      {
        role: "user",
        content: segmentPrompt,
      },
    ]);

    return this.parseScriptToSegments(script, hosts, options);
  }

  /**
   * Parse script into conversation segments with emotion detection
   */
  private async parseScriptToSegments(
    script: string,
    hosts: any[],
    options: PodcastOptions
  ): Promise<ConversationSegment[]> {
    const lines = script
      .split("\n")
      .filter((line) => line.trim() && line.includes(":"));
    const segments: ConversationSegment[] = [];
    let currentTime = 0;

    for (const line of lines) {
      const [speakerPart, ...contentParts] = line.split(":");
      const speaker = speakerPart.trim();
      const content = contentParts.join(":").trim();

      if (content.length > 10) {
        const host = hosts.find(
          (h) => h.name.toLowerCase() === speaker.toLowerCase()
        );

        // Enhanced emotion detection
        const emotion = this.detectBasicEmotion(content);

        // Calculate dynamic pacing
        const delivery = this.calculateDynamicDelivery(
          content,
          emotion,
          host,
          options
        );

        // Add contextual reactions
        const context = this.analyzeContext(content, segments, hosts);

        // Generate audio effects
        const audioEffects = this.generateAudioEffects(
          content,
          emotion,
          options
        );

        segments.push({
          speaker,
          text: content,
          emotion,
          delivery,
          context,
          audioEffects,
        });

        currentTime += this.calculateSegmentDuration(content, delivery);
      }
    }

    return segments;
  }

  /**
   * Basic emotion detection
   */
  private detectBasicEmotion(content: string): ConversationSegment["emotion"] {
    const lowerContent = content.toLowerCase();

    if (
      lowerContent.includes("!") ||
      lowerContent.includes("amazing") ||
      lowerContent.includes("incredible")
    ) {
      return "excited";
    } else if (lowerContent.includes("?")) {
      return "questioning";
    } else if (
      lowerContent.includes("absolutely") ||
      lowerContent.includes("exactly")
    ) {
      return "agreeing";
    } else if (
      lowerContent.includes("interesting") ||
      lowerContent.includes("think about")
    ) {
      return "thoughtful";
    } else if (
      lowerContent.includes("wow") ||
      lowerContent.includes("really?")
    ) {
      return "surprised";
    } else if (
      lowerContent.includes("love") ||
      lowerContent.includes("passionate")
    ) {
      return "passionate";
    } else if (
      lowerContent.includes("concern") ||
      lowerContent.includes("worried")
    ) {
      return "concerned";
    } else if (
      lowerContent.includes("haha") ||
      lowerContent.includes("funny")
    ) {
      return "amused";
    }

    return "neutral";
  }

  /**
   * Calculate dynamic delivery settings
   */
  private calculateDynamicDelivery(
    content: string,
    emotion: ConversationSegment["emotion"],
    host?: any,
    options?: PodcastOptions
  ): ConversationSegment["delivery"] {
    let speed = 1.0;
    let emphasis = "natural";
    let pauseBefore = 0.3;
    let pauseAfter = 0.5;

    // Adjust based on emotion
    switch (emotion) {
      case "excited":
        speed = 1.1;
        emphasis = "high";
        pauseBefore = 0.2;
        break;
      case "thoughtful":
        speed = 0.9;
        emphasis = "low";
        pauseBefore = 0.5;
        pauseAfter = 0.8;
        break;
      case "questioning":
        speed = 1.0;
        emphasis = "rising";
        pauseAfter = 0.7;
        break;
      case "passionate":
        speed = 1.05;
        emphasis = "strong";
        pauseBefore = 0.4;
        break;
    }

    // Adjust based on content length
    if (content.length > 200) {
      speed *= 0.95;
      pauseBefore += 0.2;
    }

    // Adjust based on host personality
    if (host?.personality.includes("energetic")) {
      speed *= 1.05;
    } else if (host?.personality.includes("thoughtful")) {
      speed *= 0.95;
    }

    return {
      speed: Math.max(0.7, Math.min(1.3, speed)),
      emphasis,
      pauseBefore: Math.max(0.1, Math.min(2.0, pauseBefore)),
      pauseAfter: Math.max(0.2, Math.min(3.0, pauseAfter)),
    };
  }

  /**
   * Analyze context for natural conversation flow
   */
  private analyzeContext(
    content: string,
    previousSegments: ConversationSegment[],
    hosts: any[]
  ): ConversationSegment["context"] {
    const isQuestion = content.includes("?");
    const isReaction =
      content.toLowerCase().includes("wow") ||
      content.toLowerCase().includes("that's") ||
      content.toLowerCase().includes("exactly");
    const isTransition =
      content.toLowerCase().includes("let's talk about") ||
      content.toLowerCase().includes("moving on") ||
      content.toLowerCase().includes("speaking of");

    // Find what this builds on
    let buildsOn: string | undefined;
    if (previousSegments.length > 0) {
      const lastSegment = previousSegments[previousSegments.length - 1];
      if (
        content.toLowerCase().includes("that") ||
        content.toLowerCase().includes("building on")
      ) {
        buildsOn = lastSegment.speaker;
      }
    }

    return {
      isQuestion,
      isReaction,
      isTransition,
      buildsOn,
      introduces: isTransition
        ? content.split(" ").slice(-3).join(" ")
        : undefined,
    };
  }

  /**
   * Generate audio effects based on content and emotion
   */
  private generateAudioEffects(
    content: string,
    emotion: ConversationSegment["emotion"],
    options: PodcastOptions
  ): string[] {
    const effects: string[] = [];

    if (options.soundDesign) {
      if (emotion === "excited") {
        effects.push("energy_boost");
      } else if (emotion === "thoughtful") {
        effects.push("reverb_soft");
      } else if (emotion === "surprised") {
        effects.push("impact_short");
      }
    }

    if (content.includes("...")) {
      effects.push("pause_extended");
    }

    if (
      content.toLowerCase().includes("haha") ||
      content.toLowerCase().includes("laugh")
    ) {
      effects.push("laughter_sfx");
    }

    return effects;
  }

  /**
   * Calculate segment duration based on content and delivery
   */
  private calculateSegmentDuration(
    content: string,
    delivery: ConversationSegment["delivery"]
  ): number {
    const wordCount = content.split(" ").length;
    const baseDuration = (wordCount / 150) * 60; // 150 words per minute
    const speedAdjustment = 1 / delivery.speed;
    const pauseAdjustment = delivery.pauseBefore + delivery.pauseAfter;

    return baseDuration * speedAdjustment + pauseAdjustment;
  }

  /**
   * Parse outline into structured segments
   */
  private parseOutlineToSegments(
    outline: string,
    hosts: any[],
    duration: number
  ): any[] {
    // This is a simplified parser - in a real implementation, you'd use more sophisticated NLP
    const segments = [];
    const lines = outline.split("\n").filter((line) => line.trim());
    let currentSegment = null;
    let segmentIndex = 0;

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          title: line.replace(/^\d+\.\s*/, ""),
          startTime: segmentIndex * ((duration * 60) / 4),
          endTime: (segmentIndex + 1) * ((duration * 60) / 4),
          content: [],
          transitions: [],
        };
        segmentIndex++;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Generate chapter markers
   */
  private generateChapterMarkers(segments: any[]): any[] {
    return segments.map((segment, index) => ({
      t: segment.startTime,
      title: segment.title,
      description: `Discussion about ${segment.title.toLowerCase()}`,
    }));
  }

  /**
   * Calculate host participation
   */
  private calculateHostParticipation(
    segments: any[],
    hosts: any[]
  ): Record<string, number> {
    const participation: Record<string, number> = {};
    hosts.forEach((host) => (participation[host.name] = 0));

    segments.forEach((segment) => {
      segment.content.forEach((content: any) => {
        if (participation[content.speaker] !== undefined) {
          participation[content.speaker]++;
        }
      });
    });

    return participation;
  }

  /**
   * Calculate emotional distribution
   */
  private calculateEmotionalDistribution(
    segments: any[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    segments.forEach((segment) => {
      segment.content.forEach((content: any) => {
        const emotion = content.emotion || "neutral";
        distribution[emotion] = (distribution[emotion] || 0) + 1;
      });
    });

    return distribution;
  }

  /**
   * Create enhanced voice profiles for hosts
   */
  private createEnhancedVoiceProfiles(hosts: PodcastHost[]): any[] {
    return hosts.map((host, index) => ({
      id: host.name.toLowerCase().replace(/\s+/g, "_"),
      name: host.name,
      voice:
        host.voice ||
        ["alloy", "echo", "fable", "nova", "onyx", "shimmer"][index % 6],
      personality:
        host.personality ||
        `Expert in their field with ${
          index % 2 === 0 ? "analytical" : "creative"
        } thinking`,
      expertise: host.expertise || "General expertise",
      speakingStyle: host.style || "Professional and engaging",
      deliveryDefaults: {
        speed: 1.0,
        pitch: 1.0,
        emphasis: "natural",
      },
    }));
  }

  /**
   * Main podcast generation method
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
      console.log(`🚀 SIMPLE MIND-BLOWING PODCAST GENERATION: "${topic}"`);
      console.log(
        `👥 Hosts: ${hosts.map((h) => `${h.name} (${h.voice})`).join(", ")}`
      );
      console.log(`⏱️ Target duration: ${duration} minutes`);

      // Create enhanced voice profiles
      const enhancedHosts = this.createEnhancedVoiceProfiles(hosts);

      // Generate episode structure
      const structure = await this.generateEpisodeStructure(
        topic,
        enhancedHosts,
        duration,
        options
      );

      // Generate conversation segments for each part
      const allSegments: ConversationSegment[] = [];
      for (const segment of structure.segments) {
        const conversationSegments = await this.generateConversationSegments(
          segment,
          enhancedHosts,
          options
        );
        allSegments.push(...conversationSegments);
      }

      // Generate transcript
      const transcript = allSegments
        .map((segment) => `${segment.speaker}: ${segment.text}`)
        .join("\n\n");

      // Calculate final duration
      const finalDuration = Math.round(
        allSegments[allSegments.length - 1]?.delivery.pauseAfter ||
          duration * 60
      );

      console.log(`✅ SIMPLE MIND-BLOWING PODCAST GENERATED SUCCESSFULLY!`);
      console.log(
        `📊 Stats: ${allSegments.length} segments, ~${
          Math.round((finalDuration / 60) * 10) / 10
        } minutes`
      );

      return {
        audioUrl: "", // Audio generation disabled for now
        transcript,
        duration: finalDuration,
        hosts: enhancedHosts,
        metadata: {
          ...structure.metadata,
          segments: allSegments.length,
          generatedAt: new Date().toISOString(),
          engine: "simple-mindblowing-ai-podcast-generator-v1",
        },
      };
    } catch (error) {
      console.error("❌ Simple mind-blowing podcast generation failed:", error);
      throw new Error(
        `Podcast generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const simpleMindblowingPodcastGenerator =
  new SimpleMindblowingPodcastGenerator();
