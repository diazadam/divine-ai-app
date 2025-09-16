import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "@/components/ui/audio-player";
import GenerationProgress from "@/components/generation-progress";
import type { Podcast as BasePodcastType } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    CloudUpload,
    Download,
    FileText,
    History,
    Play,
    Podcast,
    Settings,
    Sliders,
    Users,
    Volume2,
    Wand2,
    Youtube
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";

// Extend Podcast type with additional fields from API response
interface PodcastType extends BasePodcastType {
  hosts?: Array<{
    name: string;
    voiceId: string;
    voiceName: string;
    gender: string;
  }>;
}

// OpenAI TTS Voices - Superior quality and natural conversation
const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', gender: 'neutral', avatar: '🎭' },
  { id: 'echo', name: 'Echo', description: 'Warm and engaging', gender: 'male', avatar: '🎤' },
  { id: 'fable', name: 'Fable', description: 'Expressive British accent', gender: 'male', avatar: '🎨' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', gender: 'male', avatar: '🗿' },
  { id: 'nova', name: 'Nova', description: 'Energetic and youthful', gender: 'female', avatar: '⭐' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear and soothing', gender: 'female', avatar: '✨' }
];

// ONLY YOUR 9 ELEVENLABS VOICES - NO OTHER VOICES!
const ELEVENLABS_VOICES = [
  { id: 'QTGiyJvep6bcx4WD1qAq', name: 'Brad', description: 'Professional Documentary Narrator', gender: 'male', avatar: '👨‍💼' },
  { id: 'uYXf8XasLslADfZ2MB4u', name: 'Hope', description: 'Perfect Podcast Host Voice', gender: 'female', avatar: '✨' },
  { id: 'Dslrhjl3ZpzrctukrQSN', name: 'Will', description: 'Confident Rock & Roll Voice', gender: 'male', avatar: '💪' },
  { id: 'zGjIP4SZlMnY9m93k97r', name: 'Sarah', description: 'Clear Gentle Female Voice', gender: 'female', avatar: '👩‍🦰' },
  { id: 'Cb8NLd0sUB8jI4MW2f9M', name: 'Jedediah', description: 'Southern Pastoral Voice', gender: 'male', avatar: '📿' },
  { id: '6xPz2opT0y5qtoRh1U1Y', name: 'Christian', description: 'Confident Middle-Aged Male', gender: 'male', avatar: '🙏' },
  { id: 'wyWA56cQNU2KqUW4eCsI', name: 'Clyde', description: 'Authoritative Male Voice', gender: 'male', avatar: '🗣️' },
  { id: '4YYIPFl9wE5c4L2eu2Gb', name: 'Burt', description: 'Warm Male Narrator', gender: 'male', avatar: '🤗' },
  { id: 'xctasy8XvGp2cVO9HL9k', name: 'Allison', description: 'Fun Millennial Female Voice', gender: 'female', avatar: '💼' }
];

export default function PodcastStudio() {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [numHosts, setNumHosts] = useState(1);
  
  // Advanced HuggingFace and AI customization settings
  const [podcastDuration, setPodcastDuration] = useState(15); // minutes
  const [conversationStyle, setConversationStyle] = useState("theological"); // theological, pastoral, natural, energetic, thoughtful, professional
  const [aiModel, setAiModel] = useState("gpt-4"); // gpt-4, gpt-5-nano, gpt-realtime, auto
  const [emotionAnalysis, setEmotionAnalysis] = useState(true);
  const [advancedDialogue, setAdvancedDialogue] = useState(true);
  const [customTopic, setCustomTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("general"); // general, technical, casual, professional
  const [includeTransitions, setIncludeTransitions] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [useAgentsSDK, setUseAgentsSDK] = useState(true); // Use OpenAI Agents SDK by default
  
  // Safety and moderation settings
  const [moderationOverride, setModerationOverride] = useState(false);
  const [enableRAG, setEnableRAG] = useState(true);
  const [contentModerationLevel, setContentModerationLevel] = useState("moderate");
  
  // Initialize with OpenAI voices by default
  const [hosts, setHosts] = useState([
    { name: "Alex", voice: OPENAI_VOICES[1], gender: OPENAI_VOICES[1].gender, openaiVoice: OPENAI_VOICES[1].id },
    { name: "Sarah", voice: OPENAI_VOICES[4], gender: OPENAI_VOICES[4].gender, openaiVoice: OPENAI_VOICES[4].id },
    { name: "Mike", voice: OPENAI_VOICES[3], gender: OPENAI_VOICES[3].gender, openaiVoice: OPENAI_VOICES[3].id }
  ]);

  
  const [showLibrary, setShowLibrary] = useState(false);
  const [playingPodcast, setPlayingPodcast] = useState<PodcastType | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  
  // Debug: Force show progress modal for testing
  useEffect(() => {
    console.log('🔍 showProgress state changed to:', showProgress);
  }, [showProgress]);

  // Debug logging
  console.log('🔍 PodcastStudio Debug:', { 
    step, 
    contentType, 
    showLibrary,
    title: title?.trim(),
    showProgress
  });

  const queryClient = useQueryClient();

  // Advanced OpenAI Theological AI Mutations
  const theologicalAnalysisMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch('/api/theology/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: topic,
          includeHistorical: true,
          includeCitations: true
        })
      });
      return response.json();
    }
  });

  const pastoralCounselingMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await fetch('/api/counseling/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concerns: [topic],
          sessionType: 'pastoral'
        })
      });
      return response.json();
    }
  });

  const mcpConnectorsMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch('/api/mcp/church-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'upcoming church events and calendar',
          includeReminders: true
        })
      });
      return response.json();
    }
  });

  const { data: podcasts = [] } = useQuery<PodcastType[]>({
    queryKey: ['/api/podcasts'],
    queryFn: async () => {
      const response = await fetch('/api/podcasts', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch podcasts');
      }
      return response.json();
    },
  });

  const generatePodcastMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🎙️ SWARM: Starting podcast generation with OpenAI agents:', data);
      
      // IMMEDIATELY show progress - before any async operations
      console.log('🚨 SETTING showProgress to TRUE');
      setShowProgress(true);
      
      // Wait a bit to ensure React has re-rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Progress modal should definitely be visible now, showProgress =', showProgress);
      
      try {
        const response = await fetch('/api/podcasts/generate-swarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Generation failed:', error);
          throw new Error(error.details || 'Failed to generate podcast');
        }
        
        const result = await response.json();
        console.log('✅ Podcast generated successfully:', result);
        return result;
      } finally {
        // Hide progress after a delay to show completion
        setTimeout(() => {
          console.log('🚨 SETTING showProgress to FALSE');
          setShowProgress(false);
        }, 2000);
      }
    },
    onSuccess: (data) => {
      console.log('✅ Mutation succeeded with data:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/podcasts'] });
      // Show library after a short delay
      setTimeout(() => {
        setShowLibrary(true);
        setStep(1);
        setContentType("");
      }, 2500);
    },
    onError: (error) => {
      console.error('❌ Mutation failed:', error);
      setShowProgress(false);
      alert(`Failed to generate podcast: ${error.message}`);
    }
  });

  const handleGenerate = () => {
    try {
      console.log('🎙️ CLEAN GENERATOR: Generate button clicked!');
      console.log('📋 Form validation:', { 
        title: title.trim(), 
        contentType, 
        canGenerate: canGenerate(),
        isPending: generatePodcastMutation.isPending 
      });
      
      // Removed annoying alert - progress modal will show instead
      
      if (!canGenerate()) {
        console.warn('❌ Cannot generate: Form validation failed');
        return;
      }
      
      console.log('✅ Validation passed, proceeding with generation...');
      const selectedHosts = hosts.slice(0, numHosts);
    
    let data: any = {
      title,
      description,
      hosts: selectedHosts.map(h => ({
        name: h.name,
        voice: h.openaiVoice,
        voiceName: h.voice.name,
        gender: h.voice.gender,
        openaiVoice: h.openaiVoice
      })),
      // New Agents SDK Settings
      useAgentsSDK,
      duration: podcastDuration,
      conversationStyle,
      speed: 1.0,
      emotionAnalysis,
      advancedDialogue,
      targetAudience,
      includeTransitions,
      customTopic: customTopic.trim() || undefined,
      theologicalContext: conversationStyle === 'theological' || conversationStyle === 'pastoral',
      // Safety settings
      moderationOverride,
      enableRAG,
      contentModerationLevel
    };

    console.log('🎙️ Voices being sent:', selectedHosts.map(h => `${h.name}: ${h.voice.name} (${h.voice.id})`));

    switch (contentType) {
      case 'youtube':
        data.type = 'youtube';
        data.youtubeUrl = youtubeUrl;
        break;
      case 'script':
        data.type = 'script';
        data.script = scriptContent;
        break;
      case 'ai':
        data.type = 'ai-generate';
        data.prompt = aiPrompt;
        break;
      default:
        return;
    }

    console.log('🚀 About to call generatePodcastMutation.mutate with data:', data);
    generatePodcastMutation.mutate(data);
    } catch (error) {
      console.error('❌ Error in handleGenerate:', error);
    }
  };

  const canGenerate = () => {
    if (!title.trim()) {
      console.log('❌ Cannot generate: Title is empty');
      return false;
    }
    switch (contentType) {
      case 'youtube': 
        if (!youtubeUrl.trim()) {
          console.log('❌ Cannot generate: YouTube URL is empty');
          return false;
        }
        return true;
      case 'script': 
        if (!scriptContent.trim()) {
          console.log('❌ Cannot generate: Script content is empty');
          return false;
        }
        return true;
      case 'ai': 
        if (!aiPrompt.trim()) {
          console.log('❌ Cannot generate: AI prompt is empty');
          return false;
        }
        return true;
      default: 
        console.log('❌ Cannot generate: No content type selected');
        return false;
    }
  };

  const selectVoice = (hostIndex: number, voice: any) => {
    const newHosts = [...hosts];
    newHosts[hostIndex] = {
      ...newHosts[hostIndex],
      voice: voice,
      gender: voice.gender,
      openaiVoice: voice.id
    };
    setHosts(newHosts);
    console.log(`✅ Host ${hostIndex + 1} voice set to: ${voice.name} (${voice.id}) - OpenAI TTS`);
  };

  const playVoicePreview = async (voice: any) => {
    if (!voice || !voice.id) {
      console.warn('🔊 No voice provided for preview');
      return;
    }
    
    console.log(`🔊 Requesting voice preview for: ${voice.name} (${voice.id})`);
    
    try {
      // Determine if this is an OpenAI voice
      const openaiVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      const isOpenAIVoice = openaiVoices.includes(voice.id.toLowerCase());
      
      // Request voice preview from backend with engine detection
      const response = await fetch('/api/voices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.id,
          text: `Hello, I'm ${voice.name}. This is a preview of my voice for your podcast creation!`,
          engine: isOpenAIVoice ? 'openai' : 'elevenlabs'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        console.log(`✅ Playing OpenAI voice preview for ${voice.name}`);
        audio.play();
        
        // Clean up the object URL after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
      } else {
        const errorText = await response.text();
        console.error('Voice preview failed:', errorText);
        alert(`Voice preview temporarily unavailable. ${voice.name} will be used for your podcast.`);
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert(`${voice.name} preview will be available in the generated podcast.`);
    }
  };

  return (
    <section className="pt-24 pb-16 min-h-screen relative overflow-hidden">
      {/* Stunning Pink Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-rose-500/25 rounded-full blur-lg animate-pulse"></div>
        
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-pink-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center space-x-2 text-pink-100 hover:text-white transition-all duration-300 mb-6 group">
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="font-medium">Back to Home</span>
            </button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-200 via-rose-300 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
              ✨ AI Podcast Studio ✨
            </h1>
            <p className="text-pink-100 text-xl font-medium mb-4 drop-shadow-lg">Create breathtaking podcasts with advanced AI voices and natural conversation flow</p>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full shadow-lg shadow-pink-500/50"></div>
          </div>
        </div>

        {/* Advanced OpenAI Features Panel */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">🤖 OpenAI Powered Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Theological Analysis */}
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">🧠</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Theological AI Analysis</h4>
                  <p className="text-purple-200 text-sm mb-4">GPT-4 powered biblical analysis for your podcast topics</p>
                  <button 
                    onClick={() => theologicalAnalysisMutation.mutate(title || 'general theological discussion')}
                    disabled={theologicalAnalysisMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/30"
                  >
                    {theologicalAnalysisMutation.isPending ? 'Analyzing...' : 'Analyze Topic'}
                  </button>
                </div>
              </div>

              {/* Pastoral Counseling */}
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">🙏</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Pastoral Guidance</h4>
                  <p className="text-green-200 text-sm mb-4">AI pastoral counseling insights for ministry topics</p>
                  <button 
                    onClick={() => pastoralCounselingMutation.mutate(title || 'general pastoral guidance')}
                    disabled={pastoralCounselingMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/30"
                  >
                    {pastoralCounselingMutation.isPending ? 'Generating...' : 'Get Guidance'}
                  </button>
                </div>
              </div>

              {/* MCP Church Integration */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl">⛪</span>
                  </div>
                  <h4 className="font-bold text-white mb-2">Church Integration</h4>
                  <p className="text-amber-200 text-sm mb-4">Connect with church calendar and systems via MCP</p>
                  <button 
                    onClick={() => mcpConnectorsMutation.mutate('church-calendar')}
                    disabled={mcpConnectorsMutation.isPending}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-amber-500/30"
                  >
                    {mcpConnectorsMutation.isPending ? 'Connecting...' : 'Sync Church'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl shadow-pink-500/20">
            <button 
              onClick={() => setShowLibrary(false)}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                !showLibrary 
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30" 
                  : "text-pink-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <Wand2 className="w-4 h-4 mr-2 inline" />
              ✨ Create Podcast
            </button>
            <button 
              onClick={() => setShowLibrary(true)}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                showLibrary 
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30" 
                  : "text-pink-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <History className="w-4 h-4 mr-2 inline" />
              🎧 My Podcasts
            </button>
          </div>
        </div>

        {/* LIBRARY VIEW */}
        {showLibrary && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">🎧 Your Podcast Library</h2>
              <div className="flex space-x-4">
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-green-400/20">
                  <p className="text-green-200 text-sm">🤖 OpenAI: <span className="font-bold text-white">{aiModel === 'gpt-4' ? 'GPT-4' : aiModel === 'gpt-5-nano' ? 'GPT-5 Nano' : 'Realtime'}</span></p>
                  <p className="text-green-200 text-sm">🎭 Advanced AI: <span className="font-bold text-white">{advancedDialogue ? 'Enhanced' : 'Standard'}</span></p>
                </div>
                <button 
                  onClick={() => {
                    setShowLibrary(false);
                    setStep(1);
                    setContentType("");
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-6 py-3 font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 rounded-2xl border border-white/20 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  ✨ Create New
                </button>
              </div>
            </div>

            {podcasts.length > 0 ? (
              <>
                <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this podcast?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        if (!deleteTarget) return;
                        try {
                          const resp = await fetch(`/api/podcasts/${deleteTarget}`, { method: 'DELETE' });
                          if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/podcasts'] });
                        } finally {
                          setDeleteTarget(null);
                        }
                      }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {/* Audio Player - Shows when a podcast is playing */}
                {playingPodcast && (
                  <div className="mb-8">
                    <AudioPlayer
                      audioUrl={playingPodcast.audioUrl || ''}
                      title={playingPodcast.title}
                      description={playingPodcast.description || undefined}
                      duration={playingPodcast.duration || undefined}
                      hosts={playingPodcast.hosts?.map(h => ({ name: h.name, voiceName: h.voiceName }))}
                      onClose={() => setPlayingPodcast(null)}
                      showWaveform={true}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {podcasts.map((podcast) => (
                    <div key={podcast.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 border-none text-white font-bold">
                          ✅ Ready
                        </Badge>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setPlayingPodcast(podcast)}
                            className="bg-white/10 hover:bg-green-500/20 text-pink-100 hover:text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-green-500/30 p-2"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <a 
                            href={podcast.audioUrl || '#'}
                            download={`${podcast.title}.mp3`}
                            className="bg-white/10 hover:bg-blue-500/20 text-pink-100 hover:text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-blue-500/30 p-2 inline-block"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setDeleteTarget(podcast.id)}
                            className="bg-white/10 hover:bg-red-500/20 text-pink-100 hover:text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-red-500/30 p-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 drop-shadow-lg">{podcast.title}</h3>
                      <p className="text-pink-100/80 mb-2">{podcast.description}</p>
                      <p className="text-pink-100/60 text-sm">🕒 {Math.floor((podcast.duration || 0) / 60)}:{String((podcast.duration || 0) % 60).padStart(2, '0')}</p>
                      {podcast.hosts && podcast.hosts.length > 0 && (
                        <p className="text-green-300 text-xs mt-2">🎙️ Voices: {podcast.hosts.map(h => h.voiceName).join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                  <Podcast className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">🎙️ No podcasts yet</h3>
                <p className="text-pink-100/90 mb-10 text-lg">Create your first AI-powered podcast!</p>
                <button
                  onClick={() => {
                    setShowLibrary(false);
                    setStep(1);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-12 py-4 text-xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-2xl border border-white/20 text-white"
                >
                  <Wand2 className="w-6 h-6 mr-3" />
                  ✨ Create Your First Podcast
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREATE VIEW */}
        {!showLibrary && (
          <div className="space-y-8">
            {/* Step 1: Choose Content Type */}
            {step === 1 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-5xl mx-auto shadow-2xl shadow-pink-500/20">
                <h2 className="text-3xl font-bold mb-8 text-center text-white drop-shadow-lg">
                  🎙️ How do you want to create your podcast?
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Upload Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "upload" 
                        ? "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border-2 border-emerald-400 shadow-xl shadow-emerald-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/50"
                    }`}
                    onClick={() => setContentType("upload")}
                  >
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CloudUpload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">📁 Upload File</h3>
                    <p className="text-sm text-pink-100/80">Upload audio or video file</p>
                  </button>

                  {/* YouTube Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "youtube" 
                        ? "bg-gradient-to-br from-red-400/20 to-rose-500/20 border-2 border-red-400 shadow-xl shadow-red-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-400/50"
                    }`}
                    onClick={() => setContentType("youtube")}
                  >
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Youtube className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">🎥 YouTube Video</h3>
                    <p className="text-sm text-pink-100/80">Convert YouTube content</p>
                  </button>

                  {/* Script Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "script" 
                        ? "bg-gradient-to-br from-blue-400/20 to-cyan-500/20 border-2 border-blue-400 shadow-xl shadow-blue-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50"
                    }`}
                    onClick={() => setContentType("script")}
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">✍️ Write Script</h3>
                    <p className="text-sm text-pink-100/80">Type your own content</p>
                  </button>

                  {/* AI Generate Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "ai" 
                        ? "bg-gradient-to-br from-purple-400/20 to-fuchsia-500/20 border-2 border-purple-400 shadow-xl shadow-purple-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50"
                    }`}
                    onClick={() => setContentType("ai")}
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                      <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">🤖 AI Generate</h3>
                    <p className="text-sm text-pink-100/80">Describe your idea</p>
                  </button>
                </div>

                {contentType && (
                  <div className="mt-10 text-center">
                    <button 
                      onClick={() => setStep(2)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-12 py-4 text-lg font-bold shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 transition-all duration-300 hover:scale-105 rounded-2xl border border-white/20 text-white"
                    >
                      ✨ Continue to Content ✨
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Add Content */}
            {step === 2 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-5xl mx-auto shadow-2xl shadow-pink-500/20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-pink-100 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                  </button>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">✨ Add Your Content ✨</h2>
                  <div></div>
                </div>

                <div className="space-y-8">
                  {contentType === "upload" && (
                    <div className="border-2 border-dashed border-emerald-400/50 rounded-3xl p-16 text-center hover:border-emerald-400 transition-all duration-300 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm">
                      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                        <CloudUpload className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">📁 Upload Your Audio or Video</h3>
                      <p className="text-pink-100/90 mb-8 text-lg">Supports MP3, MP4, WAV, and more formats</p>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTitle(file.name.replace(/\.[^/.]+$/, ""));
                            setStep(3);
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-12 py-4 rounded-2xl cursor-pointer inline-block font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-emerald-500/40 border border-white/20"
                      >
                        🚀 Choose File
                      </label>
                    </div>
                  )}

                  {contentType === "youtube" && (
                    <div className="space-y-6 bg-gradient-to-br from-red-500/5 to-rose-500/5 backdrop-blur-sm rounded-3xl p-8 border border-red-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Youtube className="w-6 h-6 text-white" />
                        </div>
                        🎥 YouTube Video URL
                      </h3>
                      <Input
                        type="url"
                        placeholder="🔗 Paste YouTube URL here: https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="text-lg p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-red-500/30 focus:border-red-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {contentType === "script" && (
                    <div className="space-y-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        ✍️ Podcast Script
                      </h3>
                      <Textarea
                        rows={12}
                        placeholder="✨ Write your podcast script here..."
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        className="text-base p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-blue-500/30 focus:border-blue-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {contentType === "ai" && (
                    <div className="space-y-6 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-pulse">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        🤖 Describe Your Podcast
                      </h3>
                      <Textarea
                        rows={10}
                        placeholder="🎙️ Tell the AI what kind of podcast you want to create..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="text-base p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-purple-500/30 focus:border-purple-400 transition-all duration-300"
                      />
                    </div>
                  )}


                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div>
                      <label className="block text-lg font-bold mb-3 text-white drop-shadow-lg">🎵 Episode Title</label>
                      <Input
                        placeholder="Enter your amazing podcast title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-bold mb-3 text-white drop-shadow-lg">📝 Description (Optional)</label>
                      <Input
                        placeholder="Brief description of your episode..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-lg p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-10">
                    <button 
                      onClick={() => setStep(3)}
                      disabled={!title.trim() || (contentType !== "upload" && !canGenerate())}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-16 py-5 text-xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-2xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      🎙️ Next: Choose Voice Settings ✨
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Choose OpenAI TTS Voices */}
            {step === 3 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-6xl mx-auto shadow-2xl shadow-pink-500/20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setStep(2)}
                    className="text-pink-100 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                  </button>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">🎙️ Voice & Host Configuration ✨</h2>
                  <div></div>
                </div>

                {/* Number of Hosts */}
                <div className="mb-10">
                  <h3 className="text-2xl font-bold mb-6 text-center text-white drop-shadow-lg">👥 How many hosts do you want?</h3>
                  <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        className={`cursor-pointer transition-all duration-300 hover:scale-110 p-6 text-center backdrop-blur-sm rounded-2xl ${
                          numHosts === num 
                            ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-400 shadow-xl shadow-pink-500/30" 
                            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-400/50"
                        }`}
                        onClick={() => setNumHosts(num)}
                      >
                        <div className="bg-gradient-to-br from-pink-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">{num} Host{num > 1 ? 's' : ''}</span>
                        <p className="text-sm text-pink-100/80 mt-2">
                          {num === 1 ? "Solo narrator" : num === 2 ? "Conversation" : "Panel discussion"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Engine Selection */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">🎙️ Voice Engine</h3>
                  
                  {/* Primary: Agents SDK */}
                  <div className="text-center">
                    <p className="text-green-300">✅ Using OpenAI TTS with Gemini Script Generation</p>
                    <p className="text-green-200 text-sm">Clean, simple, and cost-effective podcast generation</p>
                  </div>
                </div>

                {/* Host Configuration */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-center text-white drop-shadow-lg">
                    🎤 Choose Voice for Each Host
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: numHosts }, (_, hostIndex) => (
                      <div key={hostIndex} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                        <div className="text-center mb-6">
                          <div className="text-6xl mb-4">{hosts[hostIndex]?.voice?.avatar || '🎙️'}</div>
                          <h4 className="text-xl font-bold text-white drop-shadow-lg">Host {hostIndex + 1}</h4>
                          <p className="text-pink-200 font-bold">{hosts[hostIndex]?.voice?.name || 'Select Voice'}</p>
                          <p className="text-xs text-green-300">✅ AI Voice (OpenAI TTS)</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-pink-200">✨ Host Name</label>
                            <Input
                              placeholder="Enter host name..."
                              value={hosts[hostIndex]?.name || ''}
                              onChange={(e) => {
                                const newHosts = [...hosts];
                                newHosts[hostIndex] = { ...newHosts[hostIndex], name: e.target.value };
                                setHosts(newHosts);
                              }}
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                            />
                          </div>

                          {/* Voice Selection Grid */}
                          <div>
                            <label className="block text-sm font-bold mb-3 text-pink-200">🎵 Choose Voice</label>
                            
                            {/* Current Selection Display */}
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4 mb-4 text-center">
                              <div className="text-4xl mb-2">{hosts[hostIndex]?.voice?.avatar}</div>
                              <h5 className="font-bold text-white text-lg">{hosts[hostIndex]?.voice?.name}</h5>
                              <p className="text-pink-200 text-sm">{hosts[hostIndex]?.voice?.description}</p>
                              <p className="text-green-300 text-xs mt-2">✅ Voice ID: {hosts[hostIndex]?.voice?.id}</p>
                            </div>

                            {/* Voice Selection Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              {OPENAI_VOICES.map((voice) => {
                                const isSelected = hosts[hostIndex]?.voice?.id === voice.id;
                                return (
                                  <button
                                    key={voice.id}
                                    onClick={() => selectVoice(hostIndex, voice)}
                                    className={`p-3 rounded-xl text-center transition-all duration-300 border ${
                                      isSelected 
                                        ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 shadow-lg shadow-green-500/30" 
                                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50"
                                    }`}
                                  >
                                    <div className="text-2xl mb-1">{voice.avatar}</div>
                                    <p className="text-white text-xs font-bold">{voice.name}</p>
                                    <p className="text-pink-200 text-xs">{voice.gender}</p>
                                    {isSelected && (
                                      <div className="text-green-400 text-xs mt-1">✅ Selected</div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button 
                              className={`w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 rounded-xl shadow-lg hover:shadow-purple-500/30 p-3 font-bold ${
                                !hosts[hostIndex]?.voice ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={() => {
                                if (hosts[hostIndex]?.voice) {
                                  playVoicePreview(hosts[hostIndex].voice);
                                } else {
                                  alert('Please select a voice first!');
                                }
                              }}
                              disabled={!hosts[hostIndex]?.voice}
                            >
                              <Volume2 className="w-4 h-4 mr-2 inline" />
                              🔊 Preview {hosts[hostIndex]?.voice?.name ? `${hosts[hostIndex].voice.name}'s Voice` : 'Voice (Select First)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mt-12">
                  <button 
                    onClick={() => setStep(4)}
                    disabled={!canGenerate()}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 px-16 py-6 text-2xl font-bold shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-110 rounded-3xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <Settings className="w-8 h-8 mr-4 inline" />
                    ⚙️ Advanced AI Settings ✨
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Advanced HuggingFace AI Settings */}
            {step === 4 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-6xl mx-auto shadow-2xl shadow-pink-500/20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setStep(3)}
                    className="text-pink-100 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                  </button>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">⚙️ Advanced AI Settings ✨</h2>
                  <div></div>
                </div>

                <div className="space-y-10">
                  <div className="text-center mb-10">
                    <p className="text-pink-100 text-lg">Customize your AI-powered podcast with OpenAI GPT-4/GPT-5 + Realtime API models</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-4 shadow-lg shadow-purple-500/50"></div>
                  </div>

                  {/* Podcast Duration & Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Sliders className="w-6 h-6 text-white" />
                        </div>
                        ⏱️ Episode Duration
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          {[5, 15, 30].map(duration => (
                            <button
                              key={duration}
                              onClick={() => setPodcastDuration(duration)}
                              className={`p-4 rounded-xl text-center transition-all duration-300 border ${
                                podcastDuration === duration
                                  ? "bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border-purple-400 shadow-lg shadow-purple-500/30" 
                                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50"
                              }`}
                            >
                              <span className="text-xl font-bold text-white">{duration}min</span>
                              <p className="text-sm text-pink-100/80 mt-1">
                                {duration === 5 ? "Quick" : duration === 15 ? "Standard" : "Deep Dive"}
                              </p>
                            </button>
                          ))}
                        </div>
                        <div className="text-center space-y-4">
                          <p className="text-pink-200 text-sm">Selected: <span className="font-bold text-white">{podcastDuration} minutes</span></p>
                          <div className="border-t border-white/10 pt-4">
                            <label className="block text-white text-sm font-medium mb-2">
                              💫 Custom Duration
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={podcastDuration}
                                onChange={(e) => setPodcastDuration(parseInt(e.target.value) || 1)}
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-center font-bold focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                                placeholder="Minutes"
                              />
                              <span className="text-pink-100 text-sm">minutes</span>
                            </div>
                            <p className="text-pink-200/60 text-xs mt-2">Enter any duration from 1-60 minutes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-8 border border-rose-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        💫 Conversation Style
                      </h3>
                      <div className="space-y-3">
                        {[
                          { id: "theological", name: "Theological", desc: "Scripture-based discussions", emoji: "⛪" },
                          { id: "pastoral", name: "Pastoral", desc: "Ministry and guidance focused", emoji: "🙏" },
                          { id: "natural", name: "Natural", desc: "Realistic everyday conversation", emoji: "💬" },
                          { id: "energetic", name: "Energetic", desc: "High-energy, enthusiastic", emoji: "⚡" },
                          { id: "thoughtful", name: "Thoughtful", desc: "Deep, contemplative discussion", emoji: "🤔" },
                          { id: "professional", name: "Professional", desc: "Formal, expert-level", emoji: "🎯" }
                        ].map(style => (
                          <button
                            key={style.id}
                            onClick={() => setConversationStyle(style.id)}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-300 border ${
                              conversationStyle === style.id
                                ? "bg-gradient-to-r from-rose-500/30 to-pink-500/30 border-rose-400 shadow-lg shadow-rose-500/30" 
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-rose-400/50"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{style.emoji}</span>
                              <div>
                                <p className="font-bold text-white">{style.name}</p>
                                <p className="text-sm text-pink-200/80">{style.desc}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Model Selection */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/20">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      🤖 OpenAI Model Selection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { id: "gpt-4", name: "GPT-4", desc: "Most capable model", emoji: "🧠", color: "emerald" },
                        { id: "gpt-5-nano", name: "GPT-5 Nano", desc: "Latest efficient model", emoji: "⚡", color: "purple" },
                        { id: "gpt-realtime", name: "Realtime API", desc: "Voice-optimized", emoji: "🎙️", color: "orange" },
                        { id: "auto", name: "Auto Select", desc: "Best for content type", emoji: "🎯", color: "blue" }
                      ].map(model => (
                        <button
                          key={model.id}
                          onClick={() => setAiModel(model.id)}
                          className={`p-4 rounded-xl text-center transition-all duration-300 border ${
                            aiModel === model.id
                              ? `bg-gradient-to-br from-${model.color}-500/30 to-${model.color}-600/30 border-${model.color}-400 shadow-lg shadow-${model.color}-500/30` 
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50"
                          }`}
                        >
                          <div className="text-3xl mb-2">{model.emoji}</div>
                          <p className="font-bold text-white text-sm">{model.name}</p>
                          <p className="text-xs text-pink-200/80">{model.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Features Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-3xl p-8 border border-green-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6">🎭 AI Enhancements</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="font-bold text-white">OpenAI Emotion Analysis</p>
                            <p className="text-sm text-green-200/80">GPT-4 powered emotion detection for natural voice tone</p>
                          </div>
                          <button
                            onClick={() => setEmotionAnalysis(!emotionAnalysis)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 ${
                              emotionAnalysis ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-gray-600"
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                              emotionAnalysis ? "translate-x-7" : "translate-x-1"
                            }`}></div>
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="font-bold text-white">Advanced Dialogue</p>
                            <p className="text-sm text-green-200/80">OpenAI GPT-5 conversation models for natural flow</p>
                          </div>
                          <button
                            onClick={() => setAdvancedDialogue(!advancedDialogue)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 ${
                              advancedDialogue ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-gray-600"
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                              advancedDialogue ? "translate-x-7" : "translate-x-1"
                            }`}></div>
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="font-bold text-white">Smart Transitions</p>
                            <p className="text-sm text-green-200/80">AI-generated smooth topic transitions</p>
                          </div>
                          <button
                            onClick={() => setIncludeTransitions(!includeTransitions)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 ${
                              includeTransitions ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-gray-600"
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                              includeTransitions ? "translate-x-7" : "translate-x-1"
                            }`}></div>
                          </button>
                        </div>

                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm rounded-3xl p-8 border border-orange-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6">🎯 Target Audience</h3>
                      <div className="space-y-3">
                        {[
                          { id: "general", name: "General", desc: "Accessible to everyone", emoji: "👥" },
                          { id: "technical", name: "Technical", desc: "Industry professionals", emoji: "⚙️" },
                          { id: "casual", name: "Casual", desc: "Relaxed, informal tone", emoji: "😊" },
                          { id: "professional", name: "Professional", desc: "Business & corporate", emoji: "💼" }
                        ].map(audience => (
                          <button
                            key={audience.id}
                            onClick={() => setTargetAudience(audience.id)}
                            className={`w-full p-4 rounded-xl text-left transition-all duration-300 border ${
                              targetAudience === audience.id
                                ? "bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-400 shadow-lg shadow-orange-500/30" 
                                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-400/50"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{audience.emoji}</span>
                              <div>
                                <p className="font-bold text-white">{audience.name}</p>
                                <p className="text-sm text-orange-200/80">{audience.desc}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-sm rounded-3xl p-8 border border-red-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6">🛡️ Safety & Moderation</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <div>
                            <p className="font-bold text-white">Theological RAG</p>
                            <p className="text-sm text-red-200/80">Use Biblical semantic search for better content</p>
                          </div>
                          <button
                            onClick={() => setEnableRAG(!enableRAG)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 ${
                              enableRAG ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-gray-600"
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                              enableRAG ? "translate-x-7" : "translate-x-1"
                            }`}></div>
                          </button>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <p className="font-bold text-white mb-3">Content Moderation Level</p>
                          <div className="space-y-2">
                            {[
                              { id: "minimal", name: "Minimal", desc: "Basic safety checks", color: "green" },
                              { id: "moderate", name: "Moderate", desc: "Balanced filtering", color: "yellow" },
                              { id: "strict", name: "Strict", desc: "Maximum safety", color: "red" }
                            ].map(level => (
                              <button
                                key={level.id}
                                onClick={() => setContentModerationLevel(level.id)}
                                className={`w-full p-2 rounded-lg text-left transition-all duration-300 border text-xs ${
                                  contentModerationLevel === level.id
                                    ? `bg-${level.color}-500/20 border-${level.color}-400 text-white` 
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-red-200"
                                }`}
                              >
                                <span className="font-bold">{level.name}</span> - {level.desc}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-400/30">
                          <div>
                            <p className="font-bold text-white">⚠️ Moderation Override</p>
                            <p className="text-sm text-red-200/80">Skip safety checks (admin only)</p>
                          </div>
                          <button
                            onClick={() => setModerationOverride(!moderationOverride)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 ${
                              moderationOverride ? "bg-red-500 shadow-lg shadow-red-500/30" : "bg-gray-600"
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                              moderationOverride ? "translate-x-7" : "translate-x-1"
                            }`}></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Topic Enhancement (for AI generation) */}
                  {contentType === "ai" && (
                    <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-violet-400/20">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        💡 Custom Topic Focus (Optional)
                      </h3>
                      <Textarea
                        rows={4}
                        placeholder="Add specific topics, angles, or questions you want the AI to focus on..."
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        className="text-base p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-violet-200/70 rounded-2xl shadow-lg focus:shadow-violet-500/30 focus:border-violet-400 transition-all duration-300"
                      />
                      <p className="text-violet-200/80 text-sm mt-3">This will enhance your main prompt with additional focus areas</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-pink-400/20 mb-6">
                      <h4 className="text-xl font-bold text-white mb-4">🚀 Ready to Generate!</h4>
                      <p className="text-pink-100 mb-2">Your AI-powered podcast will use:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                          <p className="text-green-300">✅ Duration: <span className="font-bold">{podcastDuration} minutes</span></p>
                          <p className="text-green-300">✅ Style: <span className="font-bold">{conversationStyle}</span></p>
                          <p className="text-green-300">✅ Model: <span className="font-bold">{aiModel === "gpt-4" ? "GPT-4" : aiModel === "gpt-5-nano" ? "GPT-5 Nano" : aiModel === "gpt-realtime" ? "Realtime API" : "Auto-Select"}</span></p>
                        </div>
                        <div className="text-left">
                          <p className="text-green-300">✅ Audience: <span className="font-bold">{targetAudience}</span></p>
                          <p className="text-green-300">✅ Emotions: <span className="font-bold">{emotionAnalysis ? "Enhanced" : "Standard"}</span></p>
                          <p className="text-green-300">✅ Dialogue: <span className="font-bold">{advancedDialogue ? "OpenAI Enhanced" : "Standard"}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!canGenerate() && !generatePodcastMutation.isPending && (
                        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 text-center">
                          <p className="text-yellow-200 font-bold">⚠️ Complete all steps to generate</p>
                          <p className="text-yellow-300 text-sm">
                            {!title.trim() ? "• Add a title" : ""}
                            {!contentType ? "• Select content type" : ""}
                            {contentType === 'youtube' && !youtubeUrl.trim() ? "• Add YouTube URL" : ""}
                            {contentType === 'script' && !scriptContent.trim() ? "• Add script content" : ""}
                            {contentType === 'ai' && !aiPrompt.trim() ? "• Add AI prompt" : ""}
                          </p>
                        </div>
                      )}
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleGenerate();
                        }}
                        disabled={generatePodcastMutation.isPending || !canGenerate()}
                        className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 px-20 py-6 text-2xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-3xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      >
                        <Wand2 className="w-8 h-8 mr-4 inline" />
                        {generatePodcastMutation.isPending ? '🎧 Creating with AI...' : '🚀 Generate Divine Podcast! ✨'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug: Test Progress Modal Button */}
      <button 
        onClick={() => {
          console.log('🧪 TEST: Forcing progress modal to show');
          setShowProgress(true);
          setTimeout(() => setShowProgress(false), 10000);
        }}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg z-50 hover:bg-purple-700"
      >
        Test Progress Modal
      </button>

      {/* Generation Progress Modal */}
      <GenerationProgress
        isVisible={showProgress}
        title="Creating Your Divine Podcast"
        subtitle="Using Advanced AI Voice Technology"
        onComplete={() => setShowProgress(false)}
        onCancel={() => {
          setShowProgress(false);
          generatePodcastMutation.reset();
        }}
      />
    </section>
  );
}
