import { useState } from "react";
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
import type { GeneratedImage, GeneratedVideo } from "@shared/schema";

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
  const [videoDuration, setVideoDuration] = useState("5");
  const [videoStyle, setVideoStyle] = useState("cinematic");

  const queryClient = useQueryClient();

  const { data: generatedImages = [] } = useQuery<GeneratedImage[]>({
    queryKey: ['/api/generated-images'],
  });

  const { data: generatedVideos = [] } = useQuery<GeneratedVideo[]>({
    queryKey: ['/api/generated-videos'],
  });

  const generateImageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-image', {
        prompt: imagePrompt,
        style: selectedStyle,
        aspectRatio,
        quality,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-video', {
        prompt: videoPrompt,
        duration: parseInt(videoDuration),
        style: videoStyle,
        aspectRatio,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] });
    },
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

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'divine-ai-generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="media" className="pt-24 pb-16 min-h-screen relative z-10" data-testid="media-creator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
                          onClick={() => handleDownloadImage(image.url)}
                          className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
                          data-testid={`download-image-${image.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
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
                          data-testid={`download-video-${video.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
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
      </div>
    </TabsContent>
  </Tabs>
      </div>
    </section>
  );
}
