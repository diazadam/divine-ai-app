import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Wand2, 
  Download, 
  Edit, 
  Share, 
  Layers, 
  ArrowRight,
  Church,
  Mountain,
  Quote,
  ChevronLeft,
  Video,
  Play,
  Film
} from "lucide-react";
import { Link } from "wouter";
import GlassCard from "@/components/ui/glass-card";
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
import { useToast } from "@/hooks/use-toast";

interface StylePreset {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
}

export default function MediaCreator() {
  const [imagePrompt, setImagePrompt] = useState("A dramatic church interior with golden light streaming through stained glass windows, empty pews facing an ornate altar, cinematic lighting, divine atmosphere");
  const [videoPrompt, setVideoPrompt] = useState("A sunrise over mountains with clouds slowly parting to reveal golden rays of light, birds flying across the sky, peaceful and inspiring atmosphere");
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState("high");
  
  const { toast } = useToast();
  const [videoDuration, setVideoDuration] = useState("5");
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'image' | 'video' | 'audio'; id: string } | null>(null);
  const [videoJobStatus, setVideoJobStatus] = useState<string>("");
  const evtRef = useRef<EventSource | null>(null);

  const queryClient = useQueryClient();

  const { data: generatedImages = [] } = useQuery<GeneratedImage[]>({
    queryKey: ['/api/generated-images'],
  });

  const { data: generatedVideos = [] } = useQuery<GeneratedVideo[]>({
    queryKey: ['/api/generated-videos'],
  });

  const { data: generatedAudios = [] } = useQuery<GeneratedAudio[]>({
    queryKey: ['/api/generated-audios'],
  });

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const [w, h] = (() => {
        switch (aspectRatio) {
          case '1:1': return [1024, 1024];
          case '4:3': return [1024, 768];
          case '9:16': return [576, 1024];
          default: return [1024, 576];
        }
      })();
      const response = await apiRequest('POST', '/api/huggingface/generate-image', {
        prompt: `${imagePrompt}, ${selectedStyle} style, high quality, professional, suitable for church/ministry`,
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        width: w,
        height: h,
        num_inference_steps: quality === 'ultra' ? 50 : quality === 'high' ? 35 : 25,
        guidance_scale: quality === 'ultra' ? 8.0 : 7.5,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      // Use job queue + SSE for progress
      const params = {
        prompt: `${videoPrompt}, ${videoStyle} cinematography, smooth motion, high quality`,
        model: 'Wan-AI/Wan2.2-T2V-A14B',
        num_frames: Math.min(parseInt(videoDuration) * 8, 64),
        width: aspectRatio === '9:16' ? 320 : 512,
        height: aspectRatio === '9:16' ? 512 : 320,
      };
      const startResp = await apiRequest('POST', '/api/jobs/start', { type: 'video', params });
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
          } catch (e) {
            // ignore malformed event
          }
        };
        es.onerror = () => {
          es.close();
          reject(new Error('Event stream error'));
        };
      });
    },
    onSuccess: () => {
      setVideoJobStatus('');
      queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] });
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

  const stylePresets: StylePreset[] = [
    {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Dramatic lighting',
      selected: selectedStyle === 'cinematic',
    },
    {
      id: 'photorealistic',
      name: 'Photorealistic',
      description: 'Natural look',
      selected: selectedStyle === 'photorealistic',
    },
    {
      id: 'illustrated',
      name: 'Illustrated',
      description: 'Artistic style',
      selected: selectedStyle === 'illustrated',
    },
    {
      id: 'abstract',
      name: 'Abstract',
      description: 'Modern design',
      selected: selectedStyle === 'abstract',
    },
  ];

  const templates: Template[] = [
    {
      id: 'church-backgrounds',
      name: 'Church Backgrounds',
      description: '12 templates',
      icon: <Church className="w-5 h-5" />,
      count: 12,
    },
    {
      id: 'nature-scenes',
      name: 'Nature Scenes',
      description: '18 templates',
      icon: <Mountain className="w-5 h-5" />,
      count: 18,
    },
    {
      id: 'scripture-graphics',
      name: 'Scripture Graphics',
      description: '24 templates',
      icon: <Quote className="w-5 h-5" />,
      count: 24,
    },
  ];

  // Default images for demonstration (will be replaced by actual generated images)
  const defaultImages = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Church interior with stained glass'
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Mountain sunrise landscape'
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Peaceful lake with evening sky reflection'
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300',
      alt: 'Biblical landscape with olive trees'
    },
  ];

  const displayImages = generatedImages.length > 0 
    ? generatedImages.map(img => ({
        id: img.id,
        url: img.imageUrl,
        alt: img.prompt.substring(0, 50) + '...'
      }))
    : defaultImages;

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    generateImageMutation.mutate();
  };

  const handleGenerateVideo = () => {
    if (!videoPrompt.trim()) return;
    generateVideoMutation.mutate();
  };

  const handleDownloadImage = (idOrUrl: string, isGenerated: boolean) => {
    const url = isGenerated ? `/api/generated-images/${idOrUrl}/download` : idOrUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadVideo = (id: string) => {
    const a = document.createElement('a');
    a.href = `/api/generated-videos/${id}/download`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteImage = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-images/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
  };

  const deleteVideo = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-videos/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] });
  };

  const handleDownloadAudio = (id: string) => {
    const a = document.createElement('a');
    a.href = `/api/generated-audios/${id}/download`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteAudio = async (id: string) => {
    const resp = await apiRequest('DELETE', `/api/generated-audios/${id}`);
    if (resp.ok) queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] });
  };

  useEffect(() => () => { evtRef.current?.close(); }, []);

  return (
    <section id="media" className="pt-24 pb-16 min-h-screen relative z-10" data-testid="media-creator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The file will be removed from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!deleteTarget) return;
                  const { type, id } = deleteTarget;
                  try {
                    if (type === 'image') await deleteImage(id);
                    if (type === 'video') await deleteVideo(id);
                    if (type === 'audio') await deleteAudio(id);
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group glass-card px-4 py-2 rounded-xl">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </button>
          </Link>
        </div>
        
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-sacred-500 to-divine-500 bg-clip-text text-transparent">
            AI Media Creator
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto px-4">Generate stunning images and videos for your ministry with AI</p>
        </div>
        
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="images" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Images</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Videos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Generation */}
              <GlassCard className="p-6 premium-shadow">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <Palette className="text-sacred-500 mr-3" />
                  AI Image Generator
                </h3>
            
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Describe your vision</label>
                <Textarea
                  rows={4}
                  placeholder="A serene mountain landscape at sunrise, representing hope and new beginnings, cinematic lighting, dramatic clouds..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full bg-celestial-800/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sacred-500 resize-none"
                  data-testid="image-prompt-input"
                />
              </div>
              
              {/* Style Options */}
              <div>
                <label className="block text-sm font-medium mb-3">Style Presets</label>
                <div className="grid grid-cols-2 gap-3">
                  {stylePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedStyle(preset.id)}
                      className={`rounded-lg p-3 text-left transition-colors ${
                        preset.selected
                          ? 'bg-sacred-600/20 border-2 border-sacred-600'
                          : 'bg-celestial-800/30 border-2 border-transparent hover:border-celestial-600'
                      }`}
                      data-testid={`style-preset-${preset.id}`}
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-400">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Generation Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="ultra">Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || generateImageMutation.isPending}
                className="w-full bg-gradient-to-r from-sacred-600 to-divine-600 hover:from-sacred-500 hover:to-divine-500"
                data-testid="generate-image-button"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateImageMutation.isPending ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </GlassCard>
          
          {/* Generated Images Gallery & Templates */}
          <div className="space-y-6">
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Layers className="text-divine-500 mr-3" />
                Generated Images
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {displayImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer"
                    data-testid={`generated-image-${image.id}`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to a gradient if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-32 bg-gradient-to-br from-divine-600 to-sacred-600 rounded-lg flex items-center justify-center">
                      <Palette className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownloadImage((image as any).id || image.url, String(image.url).startsWith('/uploads/'))}
                          className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                          data-testid={`download-image-${image.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {String(image.url).startsWith('/uploads/') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget({ type: 'image', id: (image as any).id })}
                            className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                          >
                            Delete
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                          data-testid={`edit-image-${image.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                          data-testid={`share-image-${image.id}`}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                className="w-full bg-celestial-700 hover:bg-celestial-600 border-celestial-600 mt-4 text-sm"
                data-testid="view-all-images-button"
              >
                View All Generated Images
              </Button>
            </GlassCard>
            
            {/* Template Library */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Layers className="text-sacred-500 mr-3" />
                Template Library
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between hover:bg-celestial-800/50 transition-colors cursor-pointer"
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-divine-600 to-sacred-600 rounded-lg flex items-center justify-center">
                        {template.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-400">{template.description}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
    </TabsContent>

    <TabsContent value="videos">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Generation */}
        <GlassCard className="p-6 premium-shadow">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Video className="text-sacred-500 mr-3" />
            AI Video Generator
          </h3>
          
          <div className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Describe your video</label>
              <Textarea
                rows={4}
                placeholder="A sunrise over mountains with clouds slowly parting to reveal golden rays of light, birds flying across the sky, peaceful and inspiring atmosphere..."
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full bg-celestial-800/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sacred-500 resize-none"
                data-testid="video-prompt-input"
              />
            </div>
            
            {/* Video Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <Select value={videoDuration} onValueChange={setVideoDuration}>
                  <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 seconds</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <Select value={videoStyle} onValueChange={setVideoStyle}>
                  <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="animated">Animated</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleGenerateVideo}
              disabled={!videoPrompt.trim() || generateVideoMutation.isPending}
              className="w-full bg-gradient-to-r from-sacred-600 to-divine-600 hover:from-sacred-500 hover:to-divine-500"
              data-testid="generate-video-button"
            >
              <Film className="w-4 h-4 mr-2" />
              {generateVideoMutation.isPending ? 'Generating Video...' : 'Generate Video'}
            </Button>
          </div>
        </GlassCard>
        
        {/* Generated Videos Gallery */}
        <GlassCard className="p-6 premium-shadow">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Film className="text-divine-500 mr-3" />
            Generated Videos
          </h3>
          
          <div className="space-y-4">
            {generatedVideos.length > 0 ? (
              generatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-celestial-800/30 rounded-lg p-4 hover:bg-celestial-800/50 transition-colors"
                  data-testid={`generated-video-${video.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-divine-600 to-sacred-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{video.prompt.substring(0, 60)}...</h4>
                      <p className="text-xs text-gray-400 mb-2">
                        {video.duration}s • {video.aspectRatio} • {video.style}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          data-testid={`play-video-${video.id}`}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleDownloadVideo(video.id)}
                          data-testid={`download-video-${video.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-red-300 hover:text-red-200"
                          onClick={() => setDeleteTarget({ type: 'video', id: video.id })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No videos generated yet</p>
                <p className="text-xs text-gray-500 mt-2">Create your first AI video above!</p>
              </div>
            )}
          </div>
          
          {generatedVideos.length > 0 && (
            <Button
              variant="outline"
              className="w-full bg-celestial-700 hover:bg-celestial-600 border-celestial-600 mt-4 text-sm"
              data-testid="view-all-videos-button"
            >
              View All Generated Videos
            </Button>
          )}
        </GlassCard>

        {/* Generated Audios Gallery */}
        <GlassCard className="p-6 premium-shadow">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Video className="text-divine-500 mr-3" />
            Generated Audio
          </h3>
          <div className="space-y-3">
            {generatedAudios.length > 0 ? (
              generatedAudios.map((audio) => (
                <div key={audio.id} className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{audio.prompt.substring(0, 60)}...</div>
                    <div className="text-xs text-gray-400">{audio.model} • {audio.format?.toUpperCase?.()} {audio.duration ? `• ${audio.duration}s` : ''}</div>
                    {audio.audioUrl && (
                      <audio controls src={audio.audioUrl} className="mt-2 w-full" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleDownloadAudio(audio.id)}>
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => setDeleteTarget({ type: 'audio', id: audio.id })}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">No audio generated yet</div>
            )}
          </div>
        </GlassCard>
      </div>
    </TabsContent>
  </Tabs>
      </div>
    </section>
  );
}
