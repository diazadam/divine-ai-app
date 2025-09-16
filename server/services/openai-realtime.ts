import { WebSocket } from 'ws';
import OpenAI from 'openai';

interface RealtimeSession {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  context: string;
}

export class OpenAIRealtimeService {
  private openai: OpenAI;
  private sessions: Map<string, RealtimeSession> = new Map();
  
  constructor() {
    const apiKey = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Initialize a realtime prayer session with voice interaction
   */
  async createPrayerSession(userId: string, preferences: {
    language?: string;
    denomination?: string;
    prayerStyle?: 'contemplative' | 'charismatic' | 'liturgical' | 'conversational';
  }) {
    const sessionId = `prayer_${Date.now()}_${userId}`;
    
    // Create WebSocket connection to OpenAI Realtime API
    const key = process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY;
    const ws = new WebSocket('wss://api.openai.com/v1/realtime', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'OpenAI-Beta': 'realtime=v1',
      }
    });

    const session: RealtimeSession = {
      ws,
      sessionId,
      userId,
      context: `You are a compassionate prayer companion. Style: ${preferences.prayerStyle || 'conversational'}. 
                ${preferences.denomination ? `Denomination: ${preferences.denomination}` : ''}
                Guide the user through prayer with empathy, wisdom, and appropriate scripture references.
                Listen actively and respond with spiritual comfort and guidance.`
    };

    // Handle WebSocket events
    ws.on('open', () => {
      console.log(`Prayer session ${sessionId} started`);
      
      // Send initial configuration
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: session.context,
          voice: 'alloy', // Calm, soothing voice for prayer
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_scripture',
                description: 'Get a relevant Bible verse for the prayer topic',
                parameters: {
                  type: 'object',
                  properties: {
                    topic: { type: 'string' },
                    version: { type: 'string', default: 'NIV' }
                  }
                }
              }
            },
            {
              type: 'function', 
              function: {
                name: 'suggest_prayer',
                description: 'Suggest a traditional prayer or psalm',
                parameters: {
                  type: 'object',
                  properties: {
                    occasion: { type: 'string' },
                    tradition: { type: 'string' }
                  }
                }
              }
            }
          ]
        }
      }));
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'conversation.item.created':
          if (message.item.type === 'function_call') {
            await this.handleFunctionCall(sessionId, message.item);
          }
          break;
          
        case 'response.audio.transcript.done':
          // Log prayer transcripts for user's prayer journal
          await this.savePrayerTranscript(userId, message.transcript);
          break;
          
        case 'error':
          console.error(`Prayer session error: ${message.error.message}`);
          break;
      }
    });

    ws.on('close', () => {
      console.log(`Prayer session ${sessionId} ended`);
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Send audio data to the prayer session
   */
  sendAudio(sessionId: string, audioData: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    session.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: audioData.toString('base64')
    }));
  }

  /**
   * Handle function calls from the AI
   */
  private async handleFunctionCall(sessionId: string, item: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    let result;
    switch (item.function.name) {
      case 'get_scripture':
        result = await this.getScripture(item.function.arguments);
        break;
      case 'suggest_prayer':
        result = await this.suggestPrayer(item.function.arguments);
        break;
    }

    // Send function result back
    session.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: item.id,
        output: JSON.stringify(result)
      }
    }));
  }

  private async getScripture(args: any) {
    // Integrate with existing Bible API service
    const { topic, version } = JSON.parse(args);
    // Implementation would call your Bible API service
    return {
      verse: "Philippians 4:6-7",
      text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
      version
    };
  }

  private async suggestPrayer(args: any) {
    const { occasion, tradition } = JSON.parse(args);
    // Return appropriate prayer based on occasion and tradition
    const prayers = {
      morning: "Lord, thank you for this new day...",
      evening: "As this day comes to a close...",
      meal: "Bless this food to our bodies...",
      healing: "Divine Healer, we come before you..."
    };
    return prayers[occasion] || "Lord, hear our prayer...";
  }

  private async savePrayerTranscript(userId: string, transcript: string) {
    // Save to user's prayer journal
    console.log(`Saving prayer transcript for user ${userId}`);
    // Implementation would save to database
  }

  /**
   * Create an interactive Bible study session
   */
  async createBibleStudySession(userId: string, passage: string) {
    const sessionId = `study_${Date.now()}_${userId}`;
    
    const ws = new WebSocket('wss://api.openai.com/v1/realtime', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      }
    });

    const session: RealtimeSession = {
      ws,
      sessionId,
      userId,
      context: `You are an knowledgeable Bible teacher conducting an interactive study on ${passage}.
                Ask thought-provoking questions, provide historical context, and relate scripture to modern life.
                Encourage deep reflection and personal application.`
    };

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: session.context,
          voice: 'nova', // Clear, engaging voice for teaching
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_commentary',
                description: 'Get scholarly commentary on a verse',
                parameters: {
                  type: 'object',
                  properties: {
                    verse: { type: 'string' },
                    commentary_type: { type: 'string' }
                  }
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'get_cross_references',
                description: 'Get related verses',
                parameters: {
                  type: 'object',
                  properties: {
                    verse: { type: 'string' }
                  }
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'get_original_language',
                description: 'Get Hebrew/Greek word analysis',
                parameters: {
                  type: 'object',
                  properties: {
                    verse: { type: 'string' },
                    word: { type: 'string' }
                  }
                }
              }
            }
          ]
        }
      }));
    });

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * End a session
   */
  endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ws.close();
      this.sessions.delete(sessionId);
    }
  }
}

export const realtimeService = new OpenAIRealtimeService();
