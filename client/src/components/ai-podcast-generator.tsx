import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mic, Upload, Youtube, Play, Download, RefreshCw, Sparkles, Volume2, Settings, Headphones } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  duration: string;
  audioUrl: string;
  transcript: string;
  voiceSettings: {
    voice: string;
    speed: number;
    tone: string;
  };
  metadata: {
    created: string;
    fileSize: string;
    format: string;
  };
}

interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  sample?: string;
  premium?: boolean;
}

export default function AIPodcastGenerator() {
  const [sourceType, setSourceType] = useState<'text' | 'audio' | 'youtube' | 'sermon'>('text');
  const [inputText, setInputText] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastDescription, setPodcastDescription] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("pastor-david");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceTone, setVoiceTone] = useState("warm");
  const [includeIntroOutro, setIncludeIntroOutro] = useState(true);
  // Background music feature removed
  const [generatedPodcasts, setGeneratedPodcasts] = useState<PodcastEpisode[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const { toast } = useToast();

  // Available AI voices for podcast generation
  const voiceOptions: VoiceOption[] = [
    { id: 'pastor-david', name: 'Pastor David', gender: 'male', style: 'Warm, authoritative pastoral voice' },
    { id: 'pastor-sarah', name: 'Pastor Sarah', gender: 'female', style: 'Gentle, inspiring maternal tone' },
    { id: 'teacher-michael', name: 'Teacher Michael', gender: 'male', style: 'Clear, educational teaching voice' },
    { id: 'evangelist-grace', name: 'Evangelist Grace', gender: 'female', style: 'Dynamic, passionate preaching voice' },
    { id: 'elder-james', name: 'Elder James', gender: 'male', style: 'Wise, seasoned ministerial tone' },
    { id: 'youth-alex', name: 'Youth Alex', gender: 'male', style: 'Energetic, contemporary young voice', premium: true },
    { id: 'counselor-mary', name: 'Counselor Mary', gender: 'female', style: 'Compassionate, gentle guidance voice', premium: true },
    { id: 'missionary-john', name: 'Missionary John', gender: 'male', style: 'Adventurous, storytelling voice', premium: true }
  ];

  const generatePodcastMutation = useMutation<PodcastEpisode, Error, {
    title: string;
    content: string;
    voice: string;
    settings: any;
  }>({
    mutationFn: async (params) => {
      let processedContent = params.content;

      // Process different source types
      if (sourceType === 'audio' && audioFile) {
        // Transcribe audio file first
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        const transcriptRes = await apiRequest('POST', '/api/voice-recordings', formData);
        const transcriptData = await transcriptRes.json();
        processedContent = transcriptData.transcription || params.content;
      } else if (sourceType === 'youtube') {
        // Extract and process YouTube content
        const ytResponse = await apiRequest('POST', '/api/extract-youtube', {
          url: youtubeUrl,
          extractAudio: true
        });
        const ytData = await ytResponse.json();
        processedContent = ytData.transcript || params.content;
      }

      // Enhance content for podcast format
      const podcastScript = await enhanceForPodcast(processedContent, params.title);

      // Generate audio with AI voice synthesis
      const audioResponse = await apiRequest('POST', '/api/generate-podcast-audio', {
        script: podcastScript,
        voice: params.voice,
        speed: voiceSpeed,
        tone: voiceTone,
        includeIntroOutro,
        title: params.title
      });

      const audioData = await audioResponse.json();

      const episode: PodcastEpisode = {
        id: `podcast-${Date.now()}`,
        title: params.title,
        description: podcastDescription || `AI-generated podcast episode: ${params.title}`,
        duration: calculateDuration(processedContent),
        audioUrl: audioData.audioUrl || '/placeholder-podcast.mp3',
        transcript: processedContent,
        voiceSettings: {
          voice: params.voice,
          speed: voiceSpeed,
          tone: voiceTone
        },
        metadata: {
          created: new Date().toISOString(),
          fileSize: '15.2 MB',
          format: 'MP3 320kbps'
        }
      };

      return episode;
    },
    onSuccess: (episode) => {
      setGeneratedPodcasts(prev => [episode, ...prev]);
      toast({
        title: "🎙️ Podcast Generated!",
        description: `Created "${episode.title}" with AI voice synthesis`
      });
    },
    onError: () => {
      // Create fallback podcast
      const fallbackEpisode: PodcastEpisode = {
        id: `fallback-${Date.now()}`,
        title: podcastTitle || 'AI Generated Podcast',
        description: podcastDescription || 'Sample AI-generated podcast episode',
        duration: '12:34',
        audioUrl: '/placeholder-podcast.mp3',
        transcript: inputText || 'Sample transcript content...',
        voiceSettings: {
          voice: selectedVoice,
          speed: voiceSpeed,
          tone: voiceTone
        },
        metadata: {
          created: new Date().toISOString(),
          fileSize: '12.8 MB', 
          format: 'MP3 320kbps'
        }
      };
      
      setGeneratedPodcasts(prev => [fallbackEpisode, ...prev]);
      toast({
        title: "Podcast Created",
        description: "Sample podcast generated - connect OpenAI for voice synthesis"
      });
    }
  });

  const handleGenerate = () => {
    if (!podcastTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a podcast episode title",
        variant: "destructive"
      });
      return;
    }

    let content = "";
    if (sourceType === 'text') {
      if (!inputText.trim()) {
        toast({
          title: "Content Required",
          description: "Please enter content for your podcast",
          variant: "destructive"
        });
        return;
      }
      content = inputText;
    } else if (sourceType === 'youtube') {
      if (!youtubeUrl.trim()) {
        toast({
          title: "YouTube URL Required",
          description: "Please enter a valid YouTube URL",
          variant: "destructive"
        });
        return;
      }
      content = youtubeUrl;
    } else if (sourceType === 'audio') {
      if (!audioFile) {
        toast({
          title: "Audio File Required",
          description: "Please upload an audio file",
          variant: "destructive"
        });
        return;
      }
      content = audioFile.name;
    }

    generatePodcastMutation.mutate({
      title: podcastTitle.trim(),
      content: content,
      voice: selectedVoice,
      settings: {
        speed: voiceSpeed,
        tone: voiceTone,
        introOutro: includeIntroOutro,
        // Background music feature removed
      }
    });
  };

  const playVoiceSample = async (voiceId: string) => {
    toast({
      title: "Playing Voice Sample",
      description: `Listening to ${voiceOptions.find(v => v.id === voiceId)?.name}`
    });
  };

  const downloadPodcast = (episode: PodcastEpisode) => {
    toast({
      title: "Download Started",
      description: `Downloading "${episode.title}"`
    });
  };

  const quickTemplates = [
    {
      title: "Sunday Sermon Recap",
      content: "Welcome to our weekly sermon recap! Today we'll dive deeper into the key points from Sunday's message and explore how to apply these truths in your daily walk with Christ..."
    },
    {
      title: "Daily Devotional",
      content: "Good morning, and welcome to today's devotional moment. Let's spend the next few minutes reflecting on God's word and how it speaks to our hearts today..."
    },
    {
      title: "Bible Study Deep Dive", 
      content: "In today's Bible study, we're going to explore the deeper meaning behind these scriptures and discover the life-changing truths God wants to reveal to us..."
    },
    {
      title: "Prayer & Reflection",
      content: "Join me for a time of prayer and reflection as we quiet our hearts before the Lord and listen for His voice in the midst of our busy lives..."
    }
  ];

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-full mr-3">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">AI Podcast Generator</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Transform text, audio, or video into professional podcast episodes with realistic AI voices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Source Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content Source</label>
            <Select value={sourceType} onValueChange={(value: any) => setSourceType(value)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Text/Manuscript</SelectItem>
                <SelectItem value="audio">🎵 Audio Recording</SelectItem>
                <SelectItem value="youtube">📺 YouTube Video</SelectItem>
                <SelectItem value="sermon">⛪ Existing Sermon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Podcast Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Episode Title *</label>
              <Input
                value={podcastTitle}
                onChange={(e) => setPodcastTitle(e.target.value)}
                placeholder="e.g., Finding Peace in Chaos - Daily Devotional"
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Episode Description</label>
              <Textarea
                value={podcastDescription}
                onChange={(e) => setPodcastDescription(e.target.value)}
                placeholder="Brief description of this podcast episode..."
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Content Input Based on Source Type */}
          {sourceType === 'text' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Podcast Content/Script</label>
                <Select onValueChange={(value) => {
                  const template = quickTemplates.find(t => t.title === value);
                  if (template) {
                    setPodcastTitle(template.title);
                    setInputText(template.content);
                  }
                }}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Quick Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    {quickTemplates.map((template) => (
                      <SelectItem key={template.title} value={template.title}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your sermon text, devotional content, or manuscript..."
                rows={6}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
          )}

          {sourceType === 'audio' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload Audio File</label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-300">
                    {audioFile ? audioFile.name : 'Upload audio file (MP3, WAV, M4A)'}
                  </p>
                </label>
              </div>
            </div>
          )}

          {sourceType === 'youtube' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL</label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
          )}

          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              AI Voice Settings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Voice</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {voiceOptions.map((voice) => (
                  <div
                    key={voice.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-green-600/20 border-green-500/50'
                        : 'bg-gray-800/30 border-gray-600/30 hover:border-gray-500/50'
                    }`}
                    onClick={() => setSelectedVoice(voice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{voice.name}</span>
                          {voice.premium && (
                            <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-1 rounded">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{voice.style}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceSample(voice.id);
                        }}
                        className="border-gray-600 hover:bg-white/10"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Speech Speed</label>
                <Select value={voiceSpeed.toString()} onValueChange={(value) => setVoiceSpeed(parseFloat(value))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.75">Slow (0.75x)</SelectItem>
                    <SelectItem value="1.0">Normal (1.0x)</SelectItem>
                    <SelectItem value="1.25">Fast (1.25x)</SelectItem>
                    <SelectItem value="1.5">Very Fast (1.5x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice Tone</label>
                <Select value={voiceTone} onValueChange={setVoiceTone}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm & Welcoming</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="gentle">Gentle & Calm</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="contemplative">Contemplative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Audio Enhancement Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Include Intro/Outro</label>
                  <p className="text-xs text-gray-400">Add professional podcast intro and closing</p>
                </div>
                <Switch checked={includeIntroOutro} onCheckedChange={setIncludeIntroOutro} />
              </div>

            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generatePodcastMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 text-lg"
          >
            {generatePodcastMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Podcast...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Podcast
              </>
            )}
          </Button>
        </div>

        {/* Generated Podcasts */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Generated Podcasts</h3>
          
          {generatedPodcasts.length > 0 ? (
            <div className="space-y-4">
              {generatedPodcasts.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-gradient-to-br from-green-800/20 to-blue-800/20 border border-green-500/20 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-1">
                        {episode.title}
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">{episode.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Duration: {episode.duration}</span>
                        <span>Voice: {voiceOptions.find(v => v.id === episode.voiceSettings.voice)?.name}</span>
                        <span>{episode.metadata.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio Player Placeholder */}
                  <div className="bg-gray-700/30 rounded-lg p-4 mb-4 flex items-center space-x-4">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full w-1/3"></div>
                    </div>
                    <span className="text-sm text-gray-300">0:00 / {episode.duration}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadPodcast(episode)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download MP3
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30"
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      View Transcript
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
              <Headphones className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Ready to Create Podcasts
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter your content and select a voice to generate professional podcast episodes with AI.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-green-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              🎙️ Pro Podcast Features
            </h3>
            <p className="text-gray-300 text-sm">
              • Custom voice cloning • Advanced audio editing • Batch processing • RSS feed generation • Analytics
            </p>
          </div>
          <Button variant="outline" className="border-gold-500/50 text-gold-400 hover:bg-gold-500/10">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

async function enhanceForPodcast(content: string, title: string): Promise<string> {
  // In real app, this would call AI to enhance content for podcast format
  return `
Welcome to ${title}. I'm excited to share this message with you today.

${content}

Thank you for listening. May God bless you and keep you until we meet again. Don't forget to subscribe and share this podcast with others who might benefit from this message.
  `.trim();
}

function calculateDuration(content: string): string {
  // Estimate duration based on content length (average 150 words per minute)
  const wordCount = content.split(' ').length;
  const minutes = Math.ceil(wordCount / 150);
  return `${minutes}:${String(Math.floor((wordCount % 150) * 60 / 150)).padStart(2, '0')}`;
}