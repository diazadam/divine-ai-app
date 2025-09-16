import { HfInference } from '@huggingface/inference';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

class HuggingFaceTtsService {
  private hf: HfInference | null = null;
  private readonly models: string[];
  private readonly openaiVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  private readonly vibeVoiceVoices = [
    { id: 'en-Alice_woman', name: 'Alice (Female)', language: 'English' },
    { id: 'en-Carter_man', name: 'Carter (Male)', language: 'English' },
    { id: 'en-Frank_man', name: 'Frank (Male)', language: 'English' },
    { id: 'en-Mary_woman_bgm', name: 'Mary (Female with BGM)', language: 'English' }
  ];
  private readonly edgeTtsVoices = [
    { id: 'en-US-JennyNeural - en-US (Female)', name: 'Jenny (Female)', language: 'English' },
    { id: 'en-US-BrianNeural - en-US (Male)', name: 'Brian (Male)', language: 'English' },
    { id: 'en-US-EmmaNeural - en-US (Female)', name: 'Emma (Female)', language: 'English' },
    { id: 'en-US-AndrewNeural - en-US (Male)', name: 'Andrew (Male)', language: 'English' },
    { id: 'en-US-AriaNeural - en-US (Female)', name: 'Aria (Female)', language: 'English' }
  ];

  constructor() {
    const token = process.env.HUGGINGFACE_TOKEN || '';
    if (token) {
      this.hf = new HfInference(token);
    }
    // Order of preference - podcast-optimized working models
    // Note: VibeVoice-Large is a Space, not a model - it's handled separately via Gradio Client
    this.models = [
      'parler-tts/parler_tts_mini_v1',        // Natural conversation style
      'suno/bark',                            // Supports emotions, non-verbal sounds
      'microsoft/speecht5_tts',               // Fallback (if provider available)
      // Removed failing models:
      // 'espnet/kan-bayashi_ljspeech_vits', 'facebook/fastspeech2-en-ljspeech'
      // 'Steveeeeeeen/VibeVoice-Large' - This is a Space, not a model
    ];
  }

  isConfigured(): boolean {
    return this.hf !== null || !!(process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY);
  }

  // Get available voices for selection
  getAvailableVoices() {
    return {
      vibeVoice: this.vibeVoiceVoices,
      edgeTts: this.edgeTtsVoices,
      openai: this.openaiVoices.map(voice => ({ 
        id: voice, 
        name: voice.charAt(0).toUpperCase() + voice.slice(1), 
        language: 'English' 
      }))
    };
  }

  // Attempt synthesis across preferred models until one works
  async synthesize(text: string, voice?: string): Promise<{ buffer: Buffer; contentType: string; model: string }> {
    let lastErr: any = null;
    
    // First try HuggingFace models if available
    if (this.hf) {
      for (const model of this.models) {
        try {
          console.log(`🎙️ Trying HuggingFace TTS model: ${model}`);
          
          // Different models may need different parameters
          let options: any = { model, inputs: text };
          
          // Special handling for podcast-optimized models
          if (model.includes('XTTS-v2')) {
            // XTTS-v2 for multi-speaker podcast generation
            options.parameters = { 
              language: "en",
              speaker_wav: "default",  // Could be customized per speaker
              temperature: 0.7,
              length_penalty: 1.0
            };
          } else if (model.includes('parler-tts')) {
            // Parler-TTS for natural conversation
            options.parameters = { 
              description: "A clear, engaging speaker with natural conversation flow suitable for podcasts",
              temperature: 0.8
            };
          } else if (model.includes('bark')) {
            // Bark for emotional and natural speech
            options.parameters = { 
              voice_preset: "v2/en_speaker_6",  // Natural male voice
              temperature: 0.7
            };
          } else if (model.includes('speecht5')) {
            // SpeechT5 requires speaker embeddings
            options.parameters = { speaker_embeddings: "default" };
          }
          
          const resp: any = await this.hf.textToSpeech(options);
          const buf = Buffer.from(await resp.arrayBuffer());
          
          console.log(`✅ HuggingFace TTS successful with model: ${model}`);
          
          // Convert WAV to MP3 for consistency
          try {
            const mp3Buffer = await this.convertWavToMp3(buf);
            return { buffer: mp3Buffer, contentType: 'audio/mpeg', model };
          } catch (conversionError) {
            console.warn('⚠️ WAV to MP3 conversion failed, returning original WAV:', conversionError);
            return { buffer: buf, contentType: 'audio/wav', model };
          }
          
        } catch (e) {
          console.warn(`❌ HuggingFace TTS failed for model ${model}:`, e instanceof Error ? e.message : e);
          lastErr = e;
          continue;
        }
      }
    }
    
    // Try HuggingFace Spaces as backup (more reliable than Inference API)
    try {
      console.log('🎙️ Trying HuggingFace Spaces TTS fallback');
      const result = await this.synthesizeWithSpaces(text, voice);
      console.log(`✅ HuggingFace Spaces TTS successful`);
      return result;
    } catch (e) {
      console.warn(`❌ HuggingFace Spaces TTS failed:`, e instanceof Error ? e.message : e);
      lastErr = e;
    }
    
    // If HuggingFace models failed or aren't configured, try OpenAI TTS
    if (process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY) {
      console.log('🎙️ HuggingFace TTS failed, trying OpenAI TTS fallback');
      
      for (const voice of this.openaiVoices) {
        try {
          console.log(`🎙️ Trying OpenAI TTS with voice: ${voice}`);
          const buffer = await this.generateSpeechOpenAI(text, voice);
          
          console.log(`✅ OpenAI TTS successful with voice: ${voice}`);
          return { 
            buffer, 
            contentType: 'audio/mpeg', 
            model: `openai-tts-${voice}` 
          };
          
        } catch (e) {
          console.warn(`❌ OpenAI TTS failed for voice ${voice}:`, e instanceof Error ? e.message : e);
          lastErr = e;
          continue;
        }
      }
    }
    
    // Final fallback: return text-only response indicating TTS failure
    console.log('🎭 All TTS engines failed, creating text-only response');
    const textBuffer = Buffer.from('TTS_FAILED:' + text, 'utf8');
    return { 
      buffer: textBuffer, 
      contentType: 'text/plain', 
      model: 'text-only-fallback' 
    };
  }

  private async synthesizeWithSpaces(text: string, voice?: string): Promise<{ buffer: Buffer; contentType: string; model: string }> {
    // Use Gradio Client for proper HuggingFace Spaces integration
    try {
      console.log('🎙️ Trying HuggingFace Spaces via Gradio Client');
      
      const pythonScript = path.join(process.cwd(), 'server', 'scripts', 'gradio_tts.py');
      
      return new Promise((resolve, reject) => {
        const pythonPath = '/Users/adammach/divine-ai-app/venv-gradio/bin/python';
        
        // Pass voice parameter if provided, otherwise use default
        const args = [pythonScript, text, '1'];
        if (voice) {
          args.push(voice);
          console.log(`🎙️ Using specified voice: ${voice}`);
        }
        
        const pythonProcess = spawn(pythonPath, args);
        
        let result = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          result += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          error += data.toString();
        });
        
        pythonProcess.on('close', async (code: number) => {
          if (code !== 0) {
            reject(new Error(`Python script failed: ${error}`));
            return;
          }
          
          try {
            // Filter out Gradio loading messages and get only the JSON result
            const lines = result.trim().split('\n');
            const jsonLine = lines.find(line => line.startsWith('{')) || lines[lines.length - 1];
            const gradioResult = JSON.parse(jsonLine);
            
            if (!gradioResult.success) {
              reject(new Error(gradioResult.error));
              return;
            }
            
            // Read the generated audio file
            const audioBuffer = await fs.readFile(gradioResult.audio_file);
            
            console.log(`✅ HuggingFace Gradio Client successful with ${gradioResult.model}`);
            resolve({
              buffer: audioBuffer,
              contentType: 'audio/wav',
              model: `gradio-${gradioResult.model.split('/')[1] || 'vibevoice'}`
            });
            
          } catch (parseError) {
            reject(new Error(`Failed to parse Gradio result: ${parseError}`));
          }
        });
      });
      
    } catch (error) {
      console.warn('❌ HuggingFace Gradio Client failed:', error instanceof Error ? error.message : error);
      throw new Error(`Gradio Client failed: ${error}`);
    }
  }

  private async generateSpeechOpenAI(text: string, voice = 'alloy'): Promise<Buffer> {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_PODCAST_API_KEY ?? process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Speech API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

export const hfTtsService = new HuggingFaceTtsService();
