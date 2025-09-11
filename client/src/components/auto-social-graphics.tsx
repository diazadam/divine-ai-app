import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Image, Download, RefreshCw, Sparkles, Instagram, Facebook, Twitter, Copy } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SocialGraphic {
  id: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  platform: string;
  aspectRatio: string;
  style: string;
}

interface AutoSocialGraphicsProps {
  sermonTitle?: string;
  sermonScripture?: string;
}

export default function AutoSocialGraphics({ sermonTitle = "", sermonScripture = "" }: AutoSocialGraphicsProps) {
  const [message, setMessage] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [style, setStyle] = useState("inspirational");
  const [generatedGraphics, setGeneratedGraphics] = useState<SocialGraphic[]>([]);
  
  const { toast } = useToast();

  const generateMutation = useMutation<SocialGraphic, Error, {
    message: string;
    platform: string;
    style: string;
    sermonContext?: string;
  }>({
    mutationFn: async (params) => {
      // Generate the visual prompt for the image
      const visualPrompt = `Create an inspiring ${params.style} social media graphic with the message: "${params.message}". Style: Clean, modern church graphics with warm colors, scripture-inspired design, and readable typography. No people in the image, focus on abstract inspirational elements, soft gradients, and spiritual symbolism.`;

      // First generate the image
      const imageRes = await apiRequest(
        'POST',
        '/api/generate-image',
        {
          prompt: visualPrompt,
          style: params.style,
          aspectRatio: getAspectRatio(params.platform)
        }
      );

      const imageData = await imageRes.json();

      // Then generate optimized caption and hashtags
      const captionPrompt = `Create an engaging social media caption for ${params.platform} about: "${params.message}". Include relevant hashtags for church/faith content. Keep it concise and inspiring.`;
      
      const captionRes = await apiRequest(
        'POST',
        '/api/chat',
        {
          message: captionPrompt,
          type: 'default'
        }
      );

      const captionData = await captionRes.json();

      // Parse hashtags from the response
      const hashtags = extractHashtags(captionData.response);

      const graphic: SocialGraphic = {
        id: `graphic-${Date.now()}`,
        imageUrl: imageData.imageUrl || '/placeholder-social.png',
        caption: captionData.response.replace(/#\w+/g, '').trim(),
        hashtags: hashtags,
        platform: params.platform,
        aspectRatio: getAspectRatio(params.platform),
        style: params.style
      };

      return graphic;
    },
    onSuccess: (graphic) => {
      setGeneratedGraphics(prev => [graphic, ...prev]);
      toast({
        title: "🎨 Graphic Generated!",
        description: `Created ${platform} post with AI-generated image`,
      });
    },
    onError: (error) => {
      // Create fallback graphic on error
      const fallbackGraphic = createFallbackGraphic(message, platform, style);
      setGeneratedGraphics(prev => [fallbackGraphic, ...prev]);
      toast({
        title: "Graphic Created",
        description: "Generated social media content with fallback image",
      });
    },
  });

  const handleGenerate = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your social media post",
        variant: "destructive",
      });
      return;
    }

    const contextMessage = sermonTitle ? 
      `${message} (Context: Sermon "${sermonTitle}" - ${sermonScripture})` : 
      message;

    generateMutation.mutate({
      message: message.trim(),
      platform,
      style,
      sermonContext: contextMessage
    });
  };

  const handleCopyCaption = async (caption: string, hashtags: string[]) => {
    const fullCaption = `${caption}\n\n${hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullCaption);
    toast({
      title: "Copied!",
      description: "Caption and hashtags copied to clipboard",
    });
  };

  const platformOptions = [
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "facebook", label: "Facebook", icon: Facebook },
    { value: "twitter", label: "Twitter/X", icon: Twitter },
  ];

  const styleOptions = [
    { value: "inspirational", label: "Inspirational" },
    { value: "modern", label: "Modern Minimalist" },
    { value: "warm", label: "Warm & Welcoming" },
    { value: "bold", label: "Bold & Vibrant" },
    { value: "peaceful", label: "Peaceful & Serene" },
    { value: "celebration", label: "Celebration" }
  ];

  const quickMessages = [
    "Join us this Sunday for worship!",
    "God's love never fails",
    "Finding hope in His promises", 
    "You are fearfully and wonderfully made",
    "Prayer changes everything",
    "Walking in faith, not fear"
  ];

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-sacred-500 to-divine-500 p-3 rounded-full mr-3">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Auto Social Media Graphics</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Generate beautiful church social media posts with AI-created visuals and optimized captions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Creation Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Image className="w-4 h-4 inline mr-2" />
              Message or Theme *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message, Bible verse, or announcement..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          {/* Quick Messages */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Message Ideas
            </label>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((quickMsg) => (
                <Button
                  key={quickMsg}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(quickMsg)}
                  className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visual Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-fill from Sermon */}
          {(sermonTitle || sermonScripture) && (
            <div className="bg-sacred-600/10 border border-sacred-600/30 rounded-lg p-4">
              <h4 className="font-medium text-sacred-300 mb-2">Use Current Sermon Content</h4>
              <div className="space-y-2">
                {sermonTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(`Join us for "${sermonTitle}"`)}
                    className="border-sacred-500/50 text-sacred-300 hover:bg-sacred-500/10"
                  >
                    Use Sermon Title
                  </Button>
                )}
                {sermonScripture && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(`Studying ${sermonScripture} this Sunday`)}
                    className="border-sacred-500/50 text-sacred-300 hover:bg-sacred-500/10"
                  >
                    Use Scripture
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !message.trim()}
            className="w-full bg-gradient-to-r from-sacred-600 to-divine-600 hover:from-sacred-700 hover:to-divine-700 text-white font-semibold py-4 text-lg"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Graphic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Social Post
              </>
            )}
          </Button>
        </div>

        {/* Right Column - Generated Graphics */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Generated Graphics</h3>
          
          {generatedGraphics.length > 0 ? (
            <div className="space-y-4">
              {generatedGraphics.map((graphic) => (
                <div
                  key={graphic.id}
                  className="bg-gradient-to-br from-sacred-800/20 to-divine-800/20 border border-sacred-500/20 rounded-lg overflow-hidden"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-800 flex items-center justify-center">
                    {graphic.imageUrl !== '/placeholder-social.png' ? (
                      <img
                        src={graphic.imageUrl}
                        alt="Generated social media graphic"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <Image className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">AI-Generated Image</p>
                        <p className="text-gray-500 text-xs">{graphic.style} style</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {platform === 'instagram' && <Instagram className="w-4 h-4 text-purple-400" />}
                        {platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                        {platform === 'twitter' && <Twitter className="w-4 h-4 text-sky-400" />}
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {graphic.platform}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCaption(graphic.caption, graphic.hashtags)}
                          className="border-gray-600 text-gray-300 hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-white/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-100 text-sm mb-2">{graphic.caption}</p>
                    <div className="flex flex-wrap gap-1">
                      {graphic.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-sacred-500/20 text-sacred-300 px-2 py-1 rounded"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
              <Share2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Ready to Create Graphics
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter your message and click generate to create beautiful social media graphics for your church.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-sacred-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              🚀 Pro Social Features
            </h3>
            <p className="text-gray-300 text-sm">
              • Multi-platform posting • Brand kit integration • Advanced scheduling • Analytics tracking
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

function getAspectRatio(platform: string): string {
  switch (platform) {
    case 'instagram':
      return '1:1';
    case 'facebook':
      return '16:9';
    case 'twitter':
      return '16:9';
    default:
      return '1:1';
  }
}

function extractHashtags(text: string): string[] {
  const hashtags = text.match(/#\w+/g) || [];
  if (hashtags.length === 0) {
    // Fallback hashtags for church content
    return ['#faith', '#church', '#blessed', '#worship', '#community', '#love'];
  }
  return hashtags;
}

function createFallbackGraphic(message: string, platform: string, style: string): SocialGraphic {
  return {
    id: `fallback-${Date.now()}`,
    imageUrl: '/placeholder-social.png',
    caption: message,
    hashtags: ['#faith', '#church', '#blessed', '#worship', '#community'],
    platform,
    aspectRatio: getAspectRatio(platform),
    style
  };
}