import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Sparkles, Clock, Users, Heart, BookOpen, RefreshCw } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SermonOutline {
  title: string;
  scripture: string;
  theme: string;
  introduction: {
    hook: string;
    context: string;
    thesis: string;
  };
  mainPoints: Array<{
    title: string;
    scripture: string;
    explanation: string;
    application: string;
    illustration: string;
  }>;
  conclusion: {
    summary: string;
    callToAction: string;
    closingPrayer: string;
  };
  additionalResources: {
    crossReferences: string[];
    illustrations: string[];
    quotes: string[];
  };
}

interface SermonGeneratorProps {
  onSermonGenerated: (sermon: SermonOutline) => void;
}

export default function AISermonGenerator({ onSermonGenerated }: SermonGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [sermonLength, setSermonLength] = useState("25");
  const [style, setStyle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [generateType, setGenerateType] = useState<'outline' | 'full' | 'ideas'>('outline');
  
  const { toast } = useToast();

  const generateMutation = useMutation<SermonOutline, Error, {
    topic: string;
    audience: string;
    length: string;
    style: string;
    occasion: string;
    type: string;
  }>({
    mutationFn: async (params) => {
      // Map to server endpoint expecting sermon outline generation
      const res = await apiRequest(
        'POST',
        '/api/ai/generate-sermon-outline',
        {
          topic: params.topic,
          scripture: '',
          audienceType: params.audience || 'general congregation',
          sermonLength: `${params.length} minutes` || '25-30 minutes',
          style: params.style || 'expository',
        }
      );

      const payload = await res.json();

      // Best-effort map from API response to local SermonOutline shape
      const sections = payload?.outline?.sections || [];
      const first = sections[0] || { title: '', content: '', notes: '' };
      const last = sections[sections.length - 1] || { title: '', content: '', notes: '' };

      const mapped: SermonOutline = {
        title: params.topic,
        scripture: '',
        theme: params.topic,
        introduction: {
          hook: first.title || `Intro to ${params.topic}`,
          context: first.content || '',
          thesis: first.notes || '',
        },
        mainPoints: sections.map((s: any) => ({
          title: s.title || '',
          scripture: (s.scriptureReferences && s.scriptureReferences[0]) || '',
          explanation: s.content || '',
          application: s.notes || '',
          illustration: '',
        })),
        conclusion: {
          summary: last.content || '',
          callToAction: '',
          closingPrayer: '',
        },
        additionalResources: {
          crossReferences: payload?.crossReferences || [],
          illustrations: payload?.illustrations || [],
          quotes: [],
        },
      };

      return mapped as SermonOutline;
    },
    onSuccess: (data) => {
      onSermonGenerated(data);
      toast({
        title: "Sermon Generated! ✨",
        description: `Created a powerful ${sermonLength}-minute sermon on "${topic}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Please try again with a different topic",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a sermon topic or theme",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      topic: topic.trim(),
      audience,
      length: sermonLength,
      style,
      occasion,
      type: generateType,
    });
  };

  const quickTopics = [
    "Grace and Forgiveness",
    "Finding Purpose",
    "Faith in Crisis",
    "Love and Relationships",
    "Spiritual Growth",
    "Hope and Healing",
    "Prayer and Intimacy",
    "Serving Others"
  ];

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-divine-500 to-sacred-500 p-3 rounded-full mr-3">
            <Wand2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">AI Sermon Generator</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Create compelling, biblically-sound sermons in minutes with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Sermon Topic or Theme *
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Finding Hope in Difficult Times, God's Unconditional Love..."
              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          {/* Quick Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Topic Ideas
            </label>
            <div className="flex flex-wrap gap-2">
              {quickTopics.map((quickTopic) => (
                <Button
                  key={quickTopic}
                  variant="outline"
                  size="sm"
                  onClick={() => setTopic(quickTopic)}
                  className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                >
                  {quickTopic}
                </Button>
              ))}
            </div>
          </div>

          {/* Generation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Generation Type
            </label>
            <Select value={generateType} onValueChange={(value: any) => setGenerateType(value)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outline">Detailed Outline</SelectItem>
                <SelectItem value="full">Full Sermon Script</SelectItem>
                <SelectItem value="ideas">Topic Ideas & Points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Target Audience
            </label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., Young adults, Families, New believers..."
              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Sermon Length */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Sermon Length (minutes)
            </label>
            <Select value={sermonLength} onValueChange={setSermonLength}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="25">25 minutes</SelectItem>
                <SelectItem value="35">35 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preaching Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Heart className="w-4 h-4 inline mr-2" />
              Preaching Style
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expository">Expository</SelectItem>
                <SelectItem value="topical">Topical</SelectItem>
                <SelectItem value="narrative">Narrative/Story</SelectItem>
                <SelectItem value="evangelical">Evangelical</SelectItem>
                <SelectItem value="reformed">Reformed</SelectItem>
                <SelectItem value="charismatic">Charismatic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Special Occasion */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Special Occasion
            </label>
            <Select value={occasion} onValueChange={setOccasion}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Regular Sunday (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Regular Sunday</SelectItem>
                <SelectItem value="christmas">Christmas</SelectItem>
                <SelectItem value="easter">Easter</SelectItem>
                <SelectItem value="mothers-day">Mother's Day</SelectItem>
                <SelectItem value="fathers-day">Father's Day</SelectItem>
                <SelectItem value="new-year">New Year</SelectItem>
                <SelectItem value="baptism">Baptism Service</SelectItem>
                <SelectItem value="communion">Communion</SelectItem>
                <SelectItem value="funeral">Funeral/Memorial</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic.trim()}
            className="w-full bg-gradient-to-r from-divine-600 to-sacred-600 hover:from-divine-700 hover:to-sacred-700 text-white font-semibold py-4 text-lg"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Sermon...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Sermon
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-divine-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              🔥 Pro Features Available
            </h3>
            <p className="text-gray-300 text-sm">
              • Advanced theological accuracy checking • Multiple sermon variations • Custom illustration database • Voice tone analysis
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
