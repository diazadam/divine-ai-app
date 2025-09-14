import * as geminiService from './gemini';
import { HfInference } from '@huggingface/inference';

interface PodcastHost {
  name: string;
  personality: string;
  expertise: string;
  speakingStyle: string;
  catchphrases: string[];
  voiceId: string;
  voiceName: string;
}

interface ConversationSegment {
  speaker: string;
  content: string;
  emotion: 'neutral' | 'excited' | 'thoughtful' | 'questioning' | 'agreeing' | 'surprised';
  pauseBefore?: number; // seconds
  pauseAfter?: number;
  responseType: 'statement' | 'question' | 'reaction' | 'transition' | 'conclusion';
}

interface EpisodeStructure {
  intro: ConversationSegment[];
  segments: {
    title: string;
    content: ConversationSegment[];
    transitions: ConversationSegment[];
  }[];
  conclusion: ConversationSegment[];
}

export class EnhancedPodcastGenerator {
  private huggingFaceToken: string;
  private hf: HfInference;

  constructor() {
    this.huggingFaceToken = process.env.HUGGINGFACE_TOKEN || '';
    this.hf = new HfInference(this.huggingFaceToken);
  }

  // Create detailed host personalities
  createHostPersonalities(hosts: any[]): PodcastHost[] {
    const personalities = [
      {
        name: hosts[0]?.name || 'Alex',
        personality: 'Enthusiastic and curious host who asks great questions and keeps the energy high',
        expertise: 'General hosting, asking insightful questions, keeping conversation flowing',
        speakingStyle: 'Energetic, uses "That's fascinating!", "Tell me more about...", frequently acknowledges guest points',
        catchphrases: ['That\'s incredible!', 'I love that perspective', 'Our listeners are going to find this so valuable'],
        voiceId: hosts[0]?.voice || 'QTGiyJvep6bcx4WD1qAq',
        voiceName: hosts[0]?.voiceName || 'Brad'
      },
      {
        name: hosts[1]?.name || 'Sarah',
        personality: 'Thoughtful expert who provides deep insights and practical applications',
        expertise: 'Subject matter expert, provides detailed explanations, offers practical advice',
        speakingStyle: 'Thoughtful, uses "From my experience...", "What I\'ve found is...", provides specific examples',
        catchphrases: ['In my experience', 'What\'s really interesting is', 'Let me give you a practical example'],
        voiceId: hosts[1]?.voice || 'uYXf8XasLslADfZ2MB4u',
        voiceName: hosts[1]?.voiceName || 'Hope'
      },
      {
        name: hosts[2]?.name || 'Mike',
        personality: 'Analytical thinker who brings different perspectives and challenges ideas constructively',
        expertise: 'Critical thinking, alternative perspectives, connecting concepts',
        speakingStyle: 'Analytical, uses "On the other hand...", "That raises an interesting question...", builds on ideas',
        catchphrases: ['That\'s a great point, and it makes me think', 'Building on that idea', 'From another angle'],
        voiceId: hosts[2]?.voice || 'Dslrhjl3ZpzrctukrQSN',
        voiceName: hosts[2]?.voiceName || 'Will'
      }
    ];

    return personalities.slice(0, hosts.length);
  }

  // Enhanced script generation with HuggingFace and Gemini AI
  async generateEnhancedScript(topic: string, hosts: PodcastHost[], duration: number = 15): Promise<EpisodeStructure> {
    const targetWords = duration * 150; // ~150 words per minute
    
    // Use HuggingFace for advanced conversation modeling first
    let conversationModel = null;
    try {
      console.log('🤖 Using HuggingFace conversation models for enhanced dialogue generation');
      
      // Generate initial conversation flow using HuggingFace's conversational AI
      const conversationPrompt = `Generate a natural, engaging podcast conversation outline about "${topic}" between ${hosts.length} hosts: ${hosts.map(h => h.name).join(', ')}. Focus on realistic dialogue flow and natural interactions.`;
      
      conversationModel = await this.hf.textGeneration({
        model: 'microsoft/DialoGPT-large',
        inputs: conversationPrompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          repetition_penalty: 1.1,
        }
      });
      console.log('✅ HuggingFace conversation model provided enhanced dialogue structure');
    } catch (error) {
      console.log('⚠️  HuggingFace conversation model unavailable, using Gemini fallback');
    }
    
    // Generate detailed episode outline with Gemini (enhanced by HF insights)
    const outlinePrompt = `Create a detailed podcast episode outline for "${topic}".

HOSTS:
${hosts.map(h => `- ${h.name}: ${h.personality} (${h.expertise})`).join('\n')}

${conversationModel ? `CONVERSATION INSIGHTS FROM AI MODEL:\n${conversationModel.generated_text?.substring(0, 300)}...\n\n` : ''}

REQUIREMENTS:
- Target duration: ${duration} minutes (~${targetWords} words)
- Create engaging intro, 3-4 main segments, smooth transitions, strong conclusion
- Each host should have distinct voice and expertise
- Include natural conversation flow with reactions, questions, building on each other's points
- Make it feel like a real conversation between knowledgeable people
- Use natural interruptions, agreements, and emotional responses

STRUCTURE NEEDED:
1. Engaging intro (2-3 exchanges)
2. Main segments with smooth transitions
3. Natural back-and-forth dialogue with authentic reactions
4. Strong conclusion with key takeaways

Generate a detailed outline with specific talking points for each segment.`;

    const outline = await geminiService.createChat([{
      role: 'user',
      content: outlinePrompt
    }]);

    // Generate intro conversation
    const introPrompt = `Create a natural, engaging podcast intro for "${topic}".

HOSTS: ${hosts.map(h => `${h.name} (${h.personality})`).join(', ')}

REQUIREMENTS:
- Natural greeting and topic introduction
- Each host speaks 2-3 times
- Show their personalities immediately
- Build excitement for the topic
- Smooth flow between speakers
- Use their speaking styles: ${hosts.map(h => `${h.name}: ${h.speakingStyle}`).join(' | ')}

Format as: "SPEAKER_NAME: [dialogue]" for each line.
Make it conversational, not scripted. Include natural reactions and building on each other's comments.`;

    const introScript = await geminiService.createChat([{
      role: 'user',
      content: introPrompt
    }]);

    // Generate main content segments
    const segments = [];
    const mainTopics = await this.generateMainTopics(topic, hosts.length);

    for (let i = 0; i < mainTopics.length; i++) {
      const segmentPrompt = `Create engaging dialogue for podcast segment ${i + 1}: "${mainTopics[i]}"

HOSTS: ${hosts.map(h => `${h.name} (${h.personality})`).join(', ')}

CONTEXT: This is segment ${i + 1} of ${mainTopics.length} in a podcast about "${topic}"

REQUIREMENTS:
- Natural conversation with questions, answers, reactions
- Each host contributes based on their expertise
- Include specific examples and practical insights
- Natural interruptions and building on ideas
- Show genuine interest and engagement
- Use their personalities: ${hosts.map(h => `${h.name}: ${h.speakingStyle}`).join(' | ')}

TARGET: ${Math.floor(targetWords / mainTopics.length)} words

Format as: "SPEAKER_NAME: [dialogue]" for each exchange.
Make it sound like real people having an engaging conversation about this topic.`;

      const segmentScript = await geminiService.createChat([{
        role: 'user',
        content: segmentPrompt
      }]);

      segments.push({
        title: mainTopics[i],
        content: await this.parseScriptToSegments(segmentScript, hosts),
        transitions: i < mainTopics.length - 1 ? 
          await this.parseScriptToSegments(await this.generateTransition(mainTopics[i], mainTopics[i + 1], hosts), hosts) : []
      });
    }

    // Generate conclusion
    const conclusionPrompt = `Create a strong podcast conclusion for "${topic}".

HOSTS: ${hosts.map(h => `${h.name} (${h.personality})`).join(', ')}

REQUIREMENTS:
- Summarize key insights naturally
- Each host shares their main takeaway
- Thank listeners and encourage engagement
- Natural, warm closing
- Use their personalities and speaking styles

Format as: "SPEAKER_NAME: [dialogue]" for each exchange.`;

    const conclusionScript = await geminiService.createChat([{
      role: 'user',
      content: conclusionPrompt
    }]);

    return {
      intro: await this.parseScriptToSegments(introScript, hosts),
      segments,
      conclusion: await this.parseScriptToSegments(conclusionScript, hosts)
    };
  }

  // Generate main topics for the episode
  async generateMainTopics(topic: string, numHosts: number): Promise<string[]> {
    const prompt = `Break down "${topic}" into 3-4 main discussion points for a ${numHosts}-host podcast.

REQUIREMENTS:
- Each point should be engaging and specific
- Build logically on each other
- Allow for natural conversation and examples
- Be practical and valuable to listeners

Return just the topic titles, one per line.`;

    const response = await geminiService.createChat([{
      role: 'user',
      content: prompt
    }]);

    return response.split('\n').filter(line => line.trim()).slice(0, 4);
  }

  // Generate smooth transitions between segments
  async generateTransition(fromTopic: string, toTopic: string, hosts: PodcastHost[]): Promise<string> {
    const transitionHost = hosts[Math.floor(Math.random() * hosts.length)];
    
    const prompt = `Create a smooth 1-2 line transition from "${fromTopic}" to "${toTopic}".

HOST: ${transitionHost.name} (${transitionHost.personality})
SPEAKING STYLE: ${transitionHost.speakingStyle}

REQUIREMENTS:
- Natural bridge between topics
- Maintain conversation flow
- Sound like ${transitionHost.name}'s personality
- Keep it brief but engaging

Format as: "${transitionHost.name}: [transition dialogue]"`;

    return await geminiService.createChat([{
      role: 'user',
      content: prompt
    }]);
  }

  // Parse script text into conversation segments (async for HuggingFace emotion detection)
  async parseScriptToSegments(script: string, hosts: PodcastHost[]): Promise<ConversationSegment[]> {
    const lines = script.split('\n').filter(line => line.trim() && line.includes(':'));
    const segments: ConversationSegment[] = [];

    for (const line of lines) {
      const [speakerPart, ...contentParts] = line.split(':');
      const speaker = speakerPart.trim();
      const content = contentParts.join(':').trim();

      if (content.length > 10) {
        const host = hosts.find(h => h.name.toLowerCase() === speaker.toLowerCase());
        
        // Use async emotion detection with HuggingFace
        const emotion = await this.detectEmotion(content);
        
        segments.push({
          speaker,
          content,
          emotion,
          pauseBefore: this.calculatePauseBefore(content, segments.length),
          responseType: this.classifyResponseType(content),
        });
      }
    }

    return segments;
  }

  // Enhanced emotion detection using HuggingFace sentiment analysis
  async detectEmotion(content: string): Promise<ConversationSegment['emotion']> {
    try {
      // Use HuggingFace emotion classification model
      const emotionResult = await this.hf.textClassification({
        model: 'j-hartmann/emotion-english-distilroberta-base',
        inputs: content
      });
      
      if (emotionResult && Array.isArray(emotionResult) && emotionResult.length > 0) {
        const topEmotion = emotionResult[0];
        console.log(`🎭 HuggingFace emotion detected: ${topEmotion.label} (${Math.round(topEmotion.score * 100)}%)`);
        
        // Map HuggingFace emotions to our conversation emotions
        switch (topEmotion.label.toLowerCase()) {
          case 'joy':
          case 'excitement':
            return 'excited';
          case 'sadness':
          case 'fear':
            return 'thoughtful';
          case 'surprise':
            return 'surprised';
          case 'anger':
            return 'questioning';
          default:
            return this.detectEmotionFallback(content);
        }
      }
    } catch (error) {
      console.log('⚠️  HuggingFace emotion detection unavailable, using fallback');
    }
    
    return this.detectEmotionFallback(content);
  }

  // Fallback emotion detection method
  private detectEmotionFallback(content: string): ConversationSegment['emotion'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('!') || lowerContent.includes('amazing') || lowerContent.includes('incredible')) {
      return 'excited';
    } else if (lowerContent.includes('?')) {
      return 'questioning';
    } else if (lowerContent.includes('absolutely') || lowerContent.includes('exactly')) {
      return 'agreeing';
    } else if (lowerContent.includes('interesting') || lowerContent.includes('think about')) {
      return 'thoughtful';
    } else if (lowerContent.includes('wow') || lowerContent.includes('really?')) {
      return 'surprised';
    }
    
    return 'neutral';
  }

  // Calculate natural pause before speaking
  calculatePauseBefore(content: string, segmentIndex: number): number {
    // Add natural pauses for realistic conversation flow
    if (segmentIndex === 0) return 0.5; // Small pause at start
    if (content.includes('...')) return 1.0; // Thoughtful pause
    if (content.length > 200) return 0.8; // Pause before long statements
    return 0.3; // Default small pause
  }

  // Classify the type of response
  classifyResponseType(content: string): ConversationSegment['responseType'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('?')) return 'question';
    if (lowerContent.includes('exactly') || lowerContent.includes('wow') || lowerContent.includes('that\'s')) return 'reaction';
    if (lowerContent.includes('let\'s talk about') || lowerContent.includes('moving on')) return 'transition';
    if (lowerContent.includes('to wrap up') || lowerContent.includes('thank you')) return 'conclusion';
    
    return 'statement';
  }

  // Generate final script with enhanced flow
  generateFinalScript(structure: EpisodeStructure): string {
    let script = '';
    
    // Add intro
    script += this.segmentsToScript(structure.intro) + '\n\n';
    
    // Add main segments with transitions
    structure.segments.forEach((segment, index) => {
      script += `--- SEGMENT ${index + 1}: ${segment.title.toUpperCase()} ---\n\n`;
      script += this.segmentsToScript(segment.content) + '\n\n';
      
      if (segment.transitions.length > 0) {
        script += '--- TRANSITION ---\n\n';
        script += this.segmentsToScript(segment.transitions) + '\n\n';
      }
    });
    
    // Add conclusion
    script += '--- CONCLUSION ---\n\n';
    script += this.segmentsToScript(structure.conclusion);
    
    return script;
  }

  // Convert segments to script format
  segmentsToScript(segments: ConversationSegment[]): string {
    return segments.map(segment => {
      let line = `${segment.speaker}: `;
      
      // Add pause notation if significant
      if (segment.pauseBefore && segment.pauseBefore > 0.5) {
        line += '[pause] ';
      }
      
      line += segment.content;
      
      return line;
    }).join('\n');
  }

  // Main generation function with HuggingFace integration
  async generatePodcast(topic: string, hosts: any[], duration: number = 15): Promise<{
    script: string;
    structure: EpisodeStructure;
    enhancedHosts: PodcastHost[];
  }> {
    console.log(`🎙️ Generating enhanced podcast with HuggingFace AI: "${topic}"`);
    
    // Create detailed host personalities
    const enhancedHosts = this.createHostPersonalities(hosts);
    
    // Generate structured conversation with HuggingFace enhancement
    const structure = await this.generateEnhancedScript(topic, enhancedHosts, duration);
    
    // Create final script
    const script = this.generateFinalScript(structure);
    
    console.log(`✅ Generated ${script.split(' ').length} word script with ${structure.segments.length} segments using HuggingFace + Gemini AI`);
    
    return {
      script,
      structure,
      enhancedHosts
    };
  }
}

export const enhancedPodcastGenerator = new EnhancedPodcastGenerator();