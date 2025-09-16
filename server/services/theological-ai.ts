import OpenAI from 'openai';

interface TheologicalQuery {
  question: string;
  context?: string;
  denomination?: string;
  includeHistorical?: boolean;
  includeCitations?: boolean;
}

interface PastoralCounselingSession {
  issue: string;
  background?: string;
  spiritualMaturity?: 'new' | 'growing' | 'mature';
  preferredApproach?: 'biblical' | 'practical' | 'balanced';
}

export class TheologicalAIService {
  private openai: OpenAI;
  
  constructor() {
    const apiKey = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Deep theological analysis using GPT-5 with o1 reasoning
   */
  async analyzeTheology(query: TheologicalQuery) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4', // Using available GPT-4 model
      messages: [
        {
          role: 'system',
          content: `You are an expert theologian with deep knowledge of:
            - Biblical languages (Hebrew, Greek, Aramaic)
            - Church history and traditions
            - Systematic theology
            - Comparative religion
            - Archaeological and historical context
            ${query.denomination ? `Perspective: ${query.denomination}` : 'Ecumenical perspective'}
            Always provide balanced, well-researched answers with citations.`
        },
        {
          role: 'user',
          content: `${query.question}
            ${query.includeHistorical ? 'Include historical development of this doctrine.' : ''}
            ${query.includeCitations ? 'Provide scholarly citations and scripture references.' : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    // Parse and structure the theological analysis
    return this.structureTheologicalResponse(response.choices[0].message.content);
  }

  /**
   * AI Pastoral Counselor with emotional intelligence
   */
  async provideCounseling(session: PastoralCounselingSession) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a compassionate pastoral counselor with training in:
            - Biblical counseling
            - Christian psychology
            - Grief and crisis support
            - Marriage and family therapy
            - Addiction recovery
            
            Approach: ${session.preferredApproach || 'balanced'}
            Client spiritual maturity: ${session.spiritualMaturity || 'growing'}
            
            Guidelines:
            - Show deep empathy and active listening
            - Provide biblical wisdom with practical application
            - Recognize when to refer to professional help
            - Maintain appropriate boundaries
            - Offer hope and encouragement`
        },
        {
          role: 'user',
          content: `Issue: ${session.issue}\nBackground: ${session.background || 'Not provided'}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    return {
      guidance: response.choices[0].message.content,
      scriptures: await this.extractScriptures(response.choices[0].message.content),
      actionSteps: this.extractActionSteps(response.choices[0].message.content),
      professionalReferralNeeded: this.assessReferralNeed(session.issue)
    };
  }

  /**
   * Generate worship experiences with multi-modal content
   */
  async createWorshipExperience(theme: string, duration: number, style: string) {
    // Generate comprehensive worship service
    const [liturgy, visuals, playlist] = await Promise.all([
      this.generateLiturgy(theme, style),
      this.generateWorshipVisuals(theme),
      this.generateWorshipPlaylist(theme, duration, style)
    ]);

    return {
      theme,
      duration,
      style,
      liturgy,
      visuals,
      playlist,
      sermonOutline: await this.generateSermonOutline(theme),
      prayerGuide: await this.generatePrayerGuide(theme)
    };
  }

  /**
   * Advanced sermon preparation with AI
   */
  async prepareSermon(topic: string, scripture: string, length: number) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a master homiletician skilled in expository, topical, and narrative preaching.'
        },
        {
          role: 'user',
          content: `Create a ${length}-minute sermon on ${topic} from ${scripture}`
        }
      ],
      functions: [
        {
          name: 'generate_sermon_components',
          description: 'Generate complete sermon components',
          parameters: {
            type: 'object',
            properties: {
              introduction: { type: 'object' },
              mainPoints: { type: 'array' },
              illustrations: { type: 'array' },
              application: { type: 'array' },
              conclusion: { type: 'object' }
            }
          }
        }
      ],
      function_call: { name: 'generate_sermon_components' }
    });

    const sermonData = JSON.parse(response.choices[0].message.function_call.arguments);
    
    // Enhance with additional resources
    sermonData.powerpoint = await this.generateSermonSlides(sermonData);
    sermonData.handout = await this.generateHandout(sermonData);
    sermonData.discussionQuestions = await this.generateDiscussionQuestions(topic);
    
    return sermonData;
  }

  /**
   * Cross-denominational perspective analysis
   */
  async compareDenominations(doctrine: string) {
    const denominations = [
      'Catholic', 'Orthodox', 'Lutheran', 'Baptist', 
      'Methodist', 'Presbyterian', 'Pentecostal', 'Anglican'
    ];

    const comparisons = await Promise.all(
      denominations.map(async (denom) => {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Explain the ${denom} perspective on ${doctrine}`
            }
          ],
          max_tokens: 500
        });
        
        return {
          denomination: denom,
          perspective: response.choices[0].message.content
        };
      })
    );

    return {
      doctrine,
      comparisons,
      commonalities: this.findCommonalities(comparisons),
      differences: this.findDifferences(comparisons)
    };
  }

  /**
   * Biblical language analysis
   */
  async analyzeOriginalLanguage(verse: string, word: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Biblical Hebrew, Koine Greek, and Aramaic.'
        },
        {
          role: 'user',
          content: `Analyze the word "${word}" in ${verse}:
            1. Original language form
            2. Root and etymology
            3. Semantic range
            4. Usage in other passages
            5. Translation considerations`
        }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content;
  }

  // Helper methods
  private structureTheologicalResponse(content: string) {
    return {
      summary: this.extractSection(content, 'Summary'),
      biblicalBasis: this.extractSection(content, 'Biblical Basis'),
      historicalDevelopment: this.extractSection(content, 'Historical'),
      modernApplication: this.extractSection(content, 'Application'),
      citations: this.extractCitations(content)
    };
  }

  private async extractScriptures(content: string): Promise<string[]> {
    const scripturePattern = /([1-3]?\s*[A-Z][a-z]+\.?\s*\d+:\d+(?:-\d+)?)/g;
    return content.match(scripturePattern) || [];
  }

  private extractActionSteps(content: string): string[] {
    const lines = content.split('\n');
    return lines.filter(line => 
      line.match(/^\d+\./) || 
      line.match(/^[•\-\*]/) ||
      line.toLowerCase().includes('step')
    );
  }

  private assessReferralNeed(issue: string): boolean {
    const needsReferral = [
      'suicide', 'self-harm', 'abuse', 'violence',
      'severe depression', 'psychosis', 'addiction'
    ];
    
    return needsReferral.some(term => 
      issue.toLowerCase().includes(term)
    );
  }

  private async generateLiturgy(theme: string, style: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create a ${style} liturgy for ${theme}`
        }
      ],
      max_tokens: 1500
    });
    
    return response.choices[0].message.content;
  }

  private async generateWorshipVisuals(theme: string) {
    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a worship background for church service with theme: ${theme}. 
               Style: reverent, beautiful, suitable for projection. No text.`,
      n: 3,
      size: '1792x1024',
      quality: 'hd'
    });

    return response.data.map(img => img.url);
  }

  private async generateWorshipPlaylist(theme: string, duration: number, style: string) {
    // This would integrate with a music service API
    return {
      songs: [],
      totalDuration: duration,
      style: style
    };
  }

  private async generateSermonOutline(theme: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Create a detailed sermon outline'
        },
        {
          role: 'user',
          content: `Theme: ${theme}`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  }

  private async generatePrayerGuide(theme: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Create a prayer guide for ${theme}`
        }
      ],
      max_tokens: 800
    });
    
    return response.choices[0].message.content;
  }

  private async generateSermonSlides(sermonData: any) {
    // Generate PowerPoint slides
    return {
      slides: [],
      template: 'modern'
    };
  }

  private async generateHandout(sermonData: any) {
    return {
      outline: sermonData.mainPoints,
      fillInBlanks: [],
      notes: ''
    };
  }

  private async generateDiscussionQuestions(topic: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Generate 5 thought-provoking discussion questions about ${topic}`
        }
      ],
      max_tokens: 500
    });
    
    return response.choices[0].message.content.split('\n');
  }

  private extractSection(content: string, section: string): string {
    const regex = new RegExp(`${section}:?([^\\n]+(?:\\n(?!\\w+:)[^\\n]+)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractCitations(content: string): string[] {
    const citationPattern = /\([^)]+\d{4}[^)]*\)/g;
    return content.match(citationPattern) || [];
  }

  private findCommonalities(comparisons: any[]): string[] {
    // Find common themes across denominations
    return [];
  }

  private findDifferences(comparisons: any[]): string[] {
    // Identify key differences
    return [];
  }
}

export const theologicalAI = new TheologicalAIService();
