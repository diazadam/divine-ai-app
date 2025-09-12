export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  category: string;
  gender: 'male' | 'female';
  accent?: string;
  age?: string;
  use_case?: string;
}

export interface VoiceSettings {
  stability: number; // 0.0 to 1.0
  similarity_boost: number; // 0.0 to 1.0
  style?: number; // 0.0 to 1.0
  use_speaker_boost?: boolean;
}

class ElevenLabsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || 'sk_d596f502ade115eb859426c6b358a8d6cb158be3e244c726';
  }

  private get headers() {
    return {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': this.apiKey
    };
  }

  async generateSpeech(
    text: string, 
    voiceId: string, 
    settings: VoiceSettings = { stability: 0.5, similarity_boost: 0.75 }
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: settings
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Error generating speech with ElevenLabs:', error);
      throw new Error(`Failed to generate speech: ${error}`);
    }
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  async getVoiceDetails(voiceId: string): Promise<ElevenLabsVoice | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voice details:', error);
      return null;
    }
  }

  // Your custom ElevenLabs voices
  getPredefinedVoices(): Record<string, { voice_id: string; name: string; description: string; gender: 'male' | 'female' }> {
    return {
      brad: {
        voice_id: 'QTGiyJvep6bcx4WD1qAq',
        name: 'Brad',
        description: 'Professional male voice',
        gender: 'male'
      },
      hope: {
        voice_id: 'uYXf8XasLslADfZ2MB4u',
        name: 'Hope',
        description: 'Inspiring female voice',
        gender: 'female'
      },
      will: {
        voice_id: 'Dslrhjl3ZpzrctukrQSN',
        name: 'Will',
        description: 'Strong male voice',
        gender: 'male'
      },
      sarah: {
        voice_id: 'zGjIP4SZlMnY9m93k97r',
        name: 'Sarah',
        description: 'Gentle female voice',
        gender: 'female'
      },
      jedediah: {
        voice_id: 'Cb8NLd0sUB8jI4MW2f9M',
        name: 'Jedediah',
        description: 'Wise pastoral male voice',
        gender: 'male'
      },
      christian: {
        voice_id: '6xPz2opT0y5qtoRh1U1Y',
        name: 'Christian',
        description: 'Confident middle-aged male voice',
        gender: 'male'
      },
      clyde: {
        voice_id: 'wyWA56cQNU2KqUW4eCsI',
        name: 'Clyde',
        description: 'Authoritative male voice',
        gender: 'male'
      },
      burt: {
        voice_id: '4YYIPFl9wE5c4L2eu2Gb',
        name: 'Burt',
        description: 'Warm male narrator',
        gender: 'male'
      },
      allison: {
        voice_id: 'xctasy8XvGp2cVO9HL9k',
        name: 'Allison',
        description: 'Clear female voice',
        gender: 'female'
      }
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
}

export const elevenLabsService = new ElevenLabsService();
