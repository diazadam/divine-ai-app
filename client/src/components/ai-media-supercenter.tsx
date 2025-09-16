import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Wand2, 
  Download, 
  Share2, 
  Copy,
  Palette, 
  Video, 
  Music, 
  Image as ImageIcon,
  FileImage,
  Film,
  Mic,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  Loader2,
  Zap,
  Star,
  Heart,
  Quote,
  Calendar,
  Church,
  BookOpen,
  Users,
  Megaphone,
  Camera,
  Headphones,
  Edit3,
  Layers,
  Cpu,
  Brain,
  Eye,
  Target,
  Lightbulb,
  Brush
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GeneratedImage, GeneratedVideo, GeneratedAudio } from "@shared/schema";
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

interface MediaProject {
  id: string;
  type: 'image' | 'video' | 'audio' | 'graphics';
  title: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  url?: string;
  thumbnail?: string;
  metadata: {
    prompt: string;
    model: string;
    style?: string;
    duration?: number;
    dimensions?: string;
  };
  createdAt: string;
}

export default function AIMediaSupercenter() {
  const [activeCategory, setActiveCategory] = useState<'images' | 'videos' | 'audio' | 'graphics' | 'smart'>('images');
  const [generating, setGenerating] = useState(false);
  const [currentProject, setCurrentProject] = useState<MediaProject | null>(null);
  
  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("cinematic");
  const [imageAspect, setImageAspect] = useState("16:9");
  
  // Video Generation State  
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoStyle, setVideoStyle] = useState("cinematic");
  
  // Audio Generation State
  const [audioPrompt, setAudioPrompt] = useState("");
  const [audioType, setAudioType] = useState("background-music");
  const [audioDuration, setAudioDuration] = useState(30);
  
  // Graphics Generation State
  const [graphicsType, setGraphicsType] = useState("scripture-verse");
  const [scriptureText, setScriptureText] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'image'|'video'|'audio'; id: string } | null>(null);
  const [videoJobStatus, setVideoJobStatus] = useState("");
  const evtRef = useRef<EventSource | null>(null);

  // Generated content lists
  const { data: generatedImages = [] } = useQuery<GeneratedImage[]>({ queryKey: ['/api/generated-images'] });
  const { data: generatedVideos = [] } = useQuery<GeneratedVideo[]>({ queryKey: ['/api/generated-videos'] });
  const { data: generatedAudios = [] } = useQuery<GeneratedAudio[]>({ queryKey: ['/api/generated-audios'] });

  const [projects] = useState<MediaProject[]>([
    {
      id: '1',
      type: 'image',
      title: 'Sunset Worship Background',
      description: 'Cinematic worship background with golden light',
      status: 'completed',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      metadata: {
        prompt: 'Golden sunset over mountains with rays of light',
        model: 'stabilityai/stable-diffusion-xl',
        style: 'cinematic',
        dimensions: '1920x1080'
      },
      createdAt: new Date().toISOString()
    }
  ]);

  // Advanced OpenAI + HuggingFace Integration
  const theologicalAnalysisMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch('/api/theology/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Create visual content for: ${prompt}`,
          includeHistorical: true,
          includeCitations: true
        })
      });
      return response.json();
    }
  });

  const aiContentEnhancementMutation = useMutation({
    mutationFn: async (params: { prompt: string; type: string }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Enhance this ${params.type} prompt for ministry content: ${params.prompt}`,
          type: 'visual_prompts',
          context: JSON.stringify({ style: 'inspirational', purpose: 'ministry' })
        })
      });
      return response.json();
    }
  });

  // Enhanced Image Generation with OpenAI
  const generateImageMutation = useMutation({
    mutationFn: async (params: { prompt: string; style: string; aspect: string }) => {
      // First enhance prompt with OpenAI if enabled
      let enhancedPrompt = params.prompt;
      try {
        const enhancementResult = await aiContentEnhancementMutation.mutateAsync({
          prompt: params.prompt,
          type: 'image'
        });
        enhancedPrompt = enhancementResult.response || params.prompt;
      } catch {
        // Fallback to original prompt if enhancement fails
      }
      
      const response = await apiRequest('POST', '/api/huggingface/generate-image', {
        prompt: `${enhancedPrompt}, ${params.style} style, biblical inspiration, divine ministry content, high quality, professional photography`,
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        width: params.aspect === '16:9' ? 1024 : params.aspect === '1:1' ? 1024 : 768,
        height: params.aspect === '16:9' ? 576 : params.aspect === '1:1' ? 1024 : 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎨 Divine Image Generated!",
        description: "Your OpenAI-enhanced ministry image is ready!"
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate image. Please try again.",
        variant: "destructive"
      });
    }
  });

  // HuggingFace Video Generation
  const generateVideoMutation = useMutation({
    mutationFn: async (params: { prompt: string; duration: number; style: string }) => {
      const jobParams = {
        prompt: `${params.prompt}, ${params.style} cinematography, divine inspiration, biblical themes, smooth motion, high quality`,
        model: 'Wan-AI/Wan2.2-T2V-A14B',
        num_frames: Math.min(params.duration * 8, 64),
        width: 512,
        height: 320,
      };
      const startResp = await apiRequest('POST', '/api/jobs/start', { type: 'video', params: jobParams });
      const { jobId } = await startResp.json();
      setVideoJobStatus('Queued');
      return await new Promise((resolve, reject) => {
        const es = new EventSource(`/api/jobs/stream/${jobId}`);
        evtRef.current = es;
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            setVideoJobStatus(payload.status ?? 'running');
            if (payload.status === 'completed') {
              es.close();
              resolve(payload);
            } else if (payload.status === 'failed') {
              es.close();
              reject(new Error(payload.error || 'Job failed'));
            }
          } catch {}
        };
        es.onerror = () => { es.close(); reject(new Error('Event stream error')); };
      });
    },
    onSuccess: () => {
      setVideoJobStatus('');
      queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] });
      toast({ title: '🎬 Video Generated!', description: 'Your AI video is ready for ministry use!' });
    },
    onError: (error) => {
      setVideoJobStatus('');
      toast({
        title: "Video Generation Failed",
        description: "Unable to generate video. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => () => { evtRef.current?.close(); }, []);

  // Music Generation
  const generateMusicMutation = useMutation({
    mutationFn: async (params: { prompt: string; duration: number; type: string }) => {
      const response = await apiRequest('POST', '/api/huggingface/generate-audio', {
        prompt: `${params.prompt}, worship music, ${params.type}, peaceful and inspiring`,
        model: 'facebook/musicgen-medium',
        duration: params.duration,
        format: 'mp3'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] });
      toast({
        title: "🎵 Music Generated!",
        description: "Your AI worship music is ready!"
      });
    }
  });

  // Download helpers
  const downloadUrl = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleDownloadImage = (id: string) => downloadUrl(`/api/generated-images/${id}/download`);
  const handleDownloadVideo = (id: string) => downloadUrl(`/api/generated-videos/${id}/download`);
  const handleDownloadAudio = (id: string) => downloadUrl(`/api/generated-audios/${id}/download`);

  // Delete helpers
  const deleteImage = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-images/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
  };
  const deleteVideo = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-videos/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] });
  };
  const deleteAudio = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-audios/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] });
  };

  const categories = [
    { 
      id: 'images', 
      name: 'Smart Images', 
      icon: ImageIcon, 
      color: 'purple',
      description: 'AI-powered sermon graphics, backgrounds, and event posters'
    },
    { 
      id: 'videos', 
      name: 'Dynamic Videos', 
      icon: Video, 
      color: 'blue',
      description: 'Animated scripture, worship backgrounds, and announcement videos'
    },
    { 
      id: 'audio', 
      name: 'Audio Creation', 
      icon: Music, 
      color: 'green',
      description: 'Worship music, narration, and podcast content generation'
    },
    { 
      id: 'graphics', 
      name: 'Scripture Graphics', 
      icon: Quote, 
      color: 'yellow',
      description: 'Bible verse cards, infographics, and study materials'
    },
    { 
      id: 'smart', 
      name: 'AI Assistant', 
      icon: Brain, 
      color: 'pink',
      description: 'Intelligent design suggestions and batch processing'
    }
  ];

  const imageStyles = [
    { id: 'cinematic', name: 'Cinematic', desc: 'Dramatic lighting and composition' },
    { id: 'painterly', name: 'Painterly', desc: 'Artistic oil painting style' },
    { id: 'photorealistic', name: 'Photorealistic', desc: 'Natural photography look' },
    { id: 'minimalist', name: 'Minimalist', desc: 'Clean and simple design' },
    { id: 'vintage', name: 'Vintage', desc: 'Classic retro aesthetic' },
    { id: 'ethereal', name: 'Ethereal', desc: 'Heavenly and spiritual atmosphere' }
  ];

  const quickPrompts = {
    images: [
      "Peaceful church interior with golden light streaming through stained glass",
      "Mountain sunrise representing new beginnings and hope",
      "Hands in prayer silhouetted against sunset sky",
      "Open Bible with soft light emanating from pages",
      "Cross on hill overlooking valley in morning mist",
      "Community worship with raised hands in warm lighting"
    ],
    videos: [
      "Sunrise over mountains with gentle clouds and bird silhouettes",
      "Ocean waves gently lapping shore with peaceful sky",
      "Candle flame flickering in darkness symbolizing hope",
      "Pages of Bible turning in soft breeze with golden light",
      "Cross on hill with time-lapse clouds moving overhead",
      "Peaceful forest path with dappled sunlight filtering through trees"
    ],
    audio: [
      "Peaceful acoustic guitar worship background",
      "Ambient piano and strings for prayer time",
      "Uplifting orchestral music for celebrations",
      "Gentle nature sounds with soft piano",
      "Contemporary worship instrumental",
      "Classical hymn arrangement for meditation"
    ]
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      switch (activeCategory) {
        case 'images':
          if (!imagePrompt.trim()) {
            toast({
              title: "Prompt Required",
              description: "Please describe the image you want to create",
              variant: "destructive"
            });
            return;
          }
          await generateImageMutation.mutateAsync({
            prompt: imagePrompt,
            style: imageStyle,
            aspect: imageAspect
          });
          break;
          
        case 'videos':
          if (!videoPrompt.trim()) {
            toast({
              title: "Prompt Required", 
              description: "Please describe the video you want to create",
              variant: "destructive"
            });
            return;
          }
          await generateVideoMutation.mutateAsync({
            prompt: videoPrompt,
            duration: videoDuration,
            style: videoStyle
          });
          break;
          
        case 'audio':
          if (!audioPrompt.trim()) {
            toast({
              title: "Prompt Required",
              description: "Please describe the audio you want to create", 
              variant: "destructive"
            });
            return;
          }
          await generateMusicMutation.mutateAsync({
            prompt: audioPrompt,
            duration: audioDuration,
            type: audioType
          });
          break;
      }
    } finally {
      setGenerating(false);
    }
  };

  const CategoryIcon = categories.find(cat => cat.id === activeCategory)?.icon || ImageIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (!deleteTarget) return;
                const { type, id } = deleteTarget;
                try {
                  if (type === 'image') await deleteImage(id);
                  if (type === 'video') await deleteVideo(id);
                  if (type === 'audio') await deleteAudio(id);
                } finally {
                  setDeleteTarget(null);
                }
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-4 rounded-full mr-4 shadow-2xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                🎨 AI Media Supercenter
              </h1>
              <p className="text-xl text-purple-200">Powered by OpenAI GPT-5 + HuggingFace • Divine Ministry Content Creation</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-green-400">
                <Cpu className="w-5 h-5" />
                <span className="font-bold">OpenAI + 15+ Models</span>
              </div>
              <p className="text-xs text-green-200 mt-1">Image, Video, Audio</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-blue-400">
                <Zap className="w-5 h-5" />
                <span className="font-bold">Smart Automation</span>
              </div>
              <p className="text-xs text-blue-200 mt-1">Batch Processing</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-pink-400">
                <Eye className="w-5 h-5" />
                <span className="font-bold">Brand Consistency</span>
              </div>
              <p className="text-xs text-pink-200 mt-1">Auto-styling</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Target className="w-5 h-5" />
                <span className="font-bold">Ministry-Focused</span>
              </div>
              <p className="text-xs text-yellow-200 mt-1">Purpose-built</p>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  isActive 
                    ? `bg-gradient-to-br from-${category.color}-500/20 to-${category.color}-600/20 border-${category.color}-400 shadow-2xl shadow-${category.color}-500/30` 
                    : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex flex-col items-center space-y-3 text-center min-w-[120px]">
                  <Icon className={`w-8 h-8 ${isActive ? `text-${category.color}-400` : 'text-white'}`} />
                  <div>
                    <h3 className="font-bold text-white text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-300 mt-1 max-w-[100px]">{category.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel - Generation Controls */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <CategoryIcon className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">
                  {categories.find(cat => cat.id === activeCategory)?.name} Generator
                </h2>
              </div>

              {/* Image Generation */}
              {activeCategory === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-3">✨ Describe Your Vision</label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="A peaceful church interior with golden light streaming through stained glass windows, dramatic lighting, inspiring atmosphere..."
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 rounded-xl p-4"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">🎨 Quick Prompts</label>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.images.slice(0, 3).map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setImagePrompt(prompt)}
                          className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-purple-400/30 text-sm text-purple-200 hover:text-white transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Style</label>
                      <select
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        {imageStyles.map(style => (
                          <option key={style.id} value={style.id}>{style.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Aspect Ratio</label>
                      <select
                        value={imageAspect}
                        onChange={(e) => setImageAspect(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="16:9">16:9 Widescreen</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="9:16">9:16 Vertical</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Generation */}
              {activeCategory === 'videos' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-3">🎬 Video Description</label>
                    <Textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="A sunrise over mountains with gentle clouds and birds flying across the sky, peaceful and inspiring movement..."
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 rounded-xl p-4"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">🎥 Quick Video Ideas</label>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.videos.slice(0, 3).map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setVideoPrompt(prompt)}
                          className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-blue-400/30 text-sm text-blue-200 hover:text-white transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Duration</label>
                      <select
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value={3}>3 seconds</option>
                        <option value={5}>5 seconds</option>
                        <option value={8}>8 seconds</option>
                        <option value={10}>10 seconds</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Style</label>
                      <select
                        value={videoStyle}
                        onChange={(e) => setVideoStyle(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="cinematic">Cinematic</option>
                        <option value="peaceful">Peaceful</option>
                        <option value="dynamic">Dynamic</option>
                        <option value="ethereal">Ethereal</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Generation */}
              {activeCategory === 'audio' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-3">🎵 Audio Description</label>
                    <Textarea
                      value={audioPrompt}
                      onChange={(e) => setAudioPrompt(e.target.value)}
                      placeholder="Peaceful acoustic guitar worship background music, soft and inspiring, perfect for prayer time..."
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-green-200 rounded-xl p-4"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">🎼 Music Ideas</label>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.audio.slice(0, 3).map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setAudioPrompt(prompt)}
                          className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-green-400/30 text-sm text-green-200 hover:text-white transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Type</label>
                      <select
                        value={audioType}
                        onChange={(e) => setAudioType(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="background-music">Background Music</option>
                        <option value="worship">Worship Music</option>
                        <option value="ambient">Ambient Sounds</option>
                        <option value="instrumental">Instrumental</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Duration</label>
                      <select
                        value={audioDuration}
                        onChange={(e) => setAudioDuration(parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={120}>2 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Graphics Generation */}
              {activeCategory === 'graphics' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Graphic Type</label>
                    <select
                      value={graphicsType}
                      onChange={(e) => setGraphicsType(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="scripture-verse">Scripture Verse Card</option>
                      <option value="event-poster">Event Poster</option>
                      <option value="announcement">Announcement Graphic</option>
                      <option value="study-guide">Study Guide</option>
                    </select>
                  </div>

                  {graphicsType === 'scripture-verse' && (
                    <div>
                      <label className="block text-white font-medium mb-2">Scripture Text</label>
                      <Textarea
                        value={scriptureText}
                        onChange={(e) => setScriptureText(e.target.value)}
                        placeholder="Enter your Bible verse here..."
                        rows={3}
                        className="bg-white/10 border-white/20 text-white placeholder:text-yellow-200 rounded-xl p-4"
                      />
                    </div>
                  )}

                  {graphicsType === 'event-poster' && (
                    <div>
                      <label className="block text-white font-medium mb-2">Event Title</label>
                      <Input
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Sunday Service, Youth Group, etc."
                        className="bg-white/10 border-white/20 text-white placeholder:text-yellow-200 rounded-xl p-4"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Smart Assistant */}
              {activeCategory === 'smart' && (
                <div className="space-y-6 text-center">
                  <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-pink-400/30">
                    <Brain className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">AI Design Assistant</h3>
                    <p className="text-pink-200 text-sm mb-4">Coming Soon: Intelligent design suggestions, brand consistency checks, and automated workflows</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/10 rounded-lg p-3">
                        <Lightbulb className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <p className="text-white font-bold">Smart Suggestions</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <Brush className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-white font-bold">Auto-Styling</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {activeCategory !== 'smart' && (
                <div className="mt-8">
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-bold py-4 text-lg rounded-xl shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6 mr-3" />
                        Generate {categories.find(cat => cat.id === activeCategory)?.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results & Gallery */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Layers className="w-6 h-6 mr-3 text-blue-400" />
                Generated Content
              </h2>
              {videoJobStatus && (
                <div className="mb-4 text-sm text-purple-200">Video generation status: {videoJobStatus}</div>
              )}

              <div className="space-y-6 mb-6">
                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">Images <Badge variant="secondary" className="ml-2">{generatedImages.length}</Badge></div>
                    {generatedImages.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <a href="/media/images" className="text-blue-300 hover:text-blue-200">View all →</a>
                        <button
                          className="text-red-300 hover:text-red-200"
                          onClick={async () => { if (confirm('Delete all images?')) { await fetch('/api/generated-images', { method: 'DELETE' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] }); } }}
                        >Delete all</button>
                      </div>
                    )}
                  </div>
                  {generatedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {generatedImages.slice(0, 6).map(img => (
                        <div key={img.id} className="relative group">
                          <img src={img.imageUrl} alt={img.prompt} className="w-full h-24 object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => downloadUrl(`/api/generated-images/${img.id}/download`)}>Download</Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: 'image', id: img.id })}>Delete</Button>
                            <Button size="sm" variant="ghost" onClick={() => window.open(img.imageUrl, '_blank')}>Open</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                  ) : (
                    <div className="text-purple-200 text-sm">No images yet</div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">Videos <Badge variant="secondary" className="ml-2">{generatedVideos.length}</Badge></div>
                    {generatedVideos.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <a href="/media/videos" className="text-blue-300 hover:text-blue-200">View all →</a>
                        <button className="text-red-300 hover:text-red-200" onClick={async () => { if (confirm('Delete all videos?')) { await fetch('/api/generated-videos', { method: 'DELETE' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] }); } }}>Delete all</button>
                      </div>
                    )}
                  </div>
                  {generatedVideos.length > 0 ? (
                    <div className="space-y-2">
                      {generatedVideos.slice(0, 4).map(v => (
                        <div key={v.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                          <div className="text-white text-sm">{v.prompt.substring(0,60)}...</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => downloadUrl(`/api/generated-videos/${v.id}/download`)}>Download</Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: 'video', id: v.id })}>Delete</Button>
                            {v.videoUrl && <Button size="sm" variant="ghost" onClick={() => window.open(v.videoUrl!, '_blank')}>Open</Button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-purple-200 text-sm">No videos yet</div>
                  )}
                </div>

                {/* Audio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold">Audio <Badge variant="secondary" className="ml-2">{generatedAudios.length}</Badge></div>
                    {generatedAudios.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <a href="/media/audios" className="text-blue-300 hover:text-blue-200">View all →</a>
                        <button className="text-red-300 hover:text-red-200" onClick={async () => { if (confirm('Delete all audio?')) { await fetch('/api/generated-audios', { method: 'DELETE' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] }); } }}>Delete all</button>
                      </div>
                    )}
                  </div>
                  {generatedAudios.length > 0 ? (
                    <div className="space-y-2">
                      {generatedAudios.slice(0, 6).map(a => (
                        <div key={a.id} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-white text-sm">{a.prompt.substring(0,60)}...</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => downloadUrl(`/api/generated-audios/${a.id}/download`)}>Download</Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: 'audio', id: a.id })}>Delete</Button>
                              {a.audioUrl && <Button size="sm" variant="ghost" onClick={() => window.open(a.audioUrl!, '_blank')}>Open</Button>}
                            </div>
                          </div>
                          {a.audioUrl && <audio controls src={a.audioUrl} className="w-full" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-purple-200 text-sm">No audio yet</div>
                  )}
                </div>
              </div>

              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {project.type === 'image' && <ImageIcon className="w-8 h-8 text-white" />}
                          {project.type === 'video' && <Video className="w-8 h-8 text-white" />}
                          {project.type === 'audio' && <Music className="w-8 h-8 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white">{project.title}</h3>
                            <Badge className={`${
                              project.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              project.status === 'generating' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            } border-0`}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{project.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{project.metadata.model}</span>
                            {project.metadata.style && <span>• {project.metadata.style}</span>}
                            {project.metadata.dimensions && <span>• {project.metadata.dimensions}</span>}
                          </div>
                          <div className="flex items-center space-x-2 mt-4">
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <CategoryIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Create</h3>
                  <p className="text-gray-300 mb-4">Use the AI generator to create stunning ministry content</p>
                  <div className="flex justify-center space-x-4 text-sm">
                    <div className="flex items-center text-purple-300">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI-Powered
                    </div>
                    <div className="flex items-center text-blue-300">
                      <Zap className="w-4 h-4 mr-1" />
                      Instant Generation
                    </div>
                    <div className="flex items-center text-green-300">
                      <Heart className="w-4 h-4 mr-1" />
                      Ministry-Focused
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Models Info */}
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center">
                🤖 Powered by OpenAI + HuggingFace
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-white mb-2">OpenAI Models</h4>
                  <ul className="space-y-1 text-green-200">
                    <li>• GPT-4 Enhanced Prompts</li>
                    <li>• GPT-5 Nano Analysis</li>
                    <li>• Theological AI Insights</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Media Generation</h4>
                  <ul className="space-y-1 text-green-200">
                    <li>• Stable Diffusion XL</li>
                    <li>• Text-to-Video MS</li>
                    <li>• MusicGen + TTS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
