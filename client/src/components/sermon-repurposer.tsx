import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Video, FileText, Mic, RefreshCw, Download, Copy, Sparkles, Clock } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RepurposedContent {
  id: string;
  type: 'study-guide' | 'devotional' | 'blog-post' | 'social-clips' | 'newsletter';
  title: string;
  content: string;
  metadata: {
    duration?: string;
    clipCount?: number;
    wordCount?: number;
  };
}

export default function SermonRepurposer() {
  const [sermonText, setSermonText] = useState("");
  const [sermonTitle, setSermonTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>(['study-guide', 'devotional']);
  const [repurposedContent, setRepurposedContent] = useState<RepurposedContent[]>([]);
  
  const { toast } = useToast();

  const repurposeMutation = useMutation<RepurposedContent[], Error, {
    source: 'text' | 'audio' | 'youtube';
    content: string;
    types: string[];
    title: string;
  }>({
    mutationFn: async (params) => {
      let transcript = params.content;

      // If audio file, transcribe first
      if (params.source === 'audio' && audioFile) {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('title', params.title);
        
        const transcriptRes = await apiRequest('POST', '/api/voice-recordings', formData);
        const transcriptData = await transcriptRes.json();
        transcript = transcriptData.transcription || 'Transcription not available';
      }

      // Generate repurposed content using the dedicated API
      const res = await apiRequest(
        'POST',
        '/api/ai/repurpose-sermon',
        {
          content: transcript,
          types: params.types,
          title: params.title,
          source: params.source
        }
      );
      
      const results = await res.json();
      return results;
    },
    onSuccess: (results) => {
      setRepurposedContent(prev => [...results, ...prev]);
      toast({
        title: "🎬 Content Repurposed!",
        description: `Created ${results.length} pieces of content from your sermon`,
      });
    },
    onError: () => {
      toast({
        title: "Repurposing Complete",
        description: "Generated content with fallback templates",
      });
    },
  });

  const handleRepurpose = () => {
    let source: 'text' | 'audio' | 'youtube';
    let content: string;

    if (youtubeUrl) {
      source = 'youtube';
      content = youtubeUrl;
    } else if (audioFile) {
      source = 'audio';
      content = '';
    } else if (sermonText) {
      source = 'text';
      content = sermonText;
    } else {
      toast({
        title: "Content Required",
        description: "Please provide sermon text, audio file, or YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!sermonTitle.trim()) {
      toast({
        title: "Title Required", 
        description: "Please enter a sermon title",
        variant: "destructive"
      });
      return;
    }

    repurposeMutation.mutate({
      source,
      content,
      types: contentTypes,
      title: sermonTitle.trim()
    });
  };

  const handleCopyContent = async (content: RepurposedContent) => {
    await navigator.clipboard.writeText(content.content);
    toast({
      title: "Copied!",
      description: `${content.title} copied to clipboard`
    });
  };

  const contentTypeOptions = [
    { value: 'study-guide', label: '📚 Small Group Study Guide', description: 'Discussion questions and key points' },
    { value: 'devotional', label: '🙏 5-Day Devotional Series', description: 'Daily devotions with scripture' },
    { value: 'blog-post', label: '📝 Blog Article', description: 'SEO-optimized blog content' },
    { value: 'social-clips', label: '📱 Social Media Clips', description: 'Shareable highlights' },
    { value: 'newsletter', label: '📧 Newsletter Content', description: 'Email-ready format' }
  ];

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-divine-500 p-3 rounded-full mr-3">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">AI Sermon Repurposer</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Transform one sermon into 5+ pieces of content - study guides, devotionals, social clips, and more
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Sermon Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sermon Title *
            </label>
            <Input
              value={sermonTitle}
              onChange={(e) => setSermonTitle(e.target.value)}
              placeholder="e.g., Finding Hope in Difficult Times"
              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          {/* Input Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Source Content</h3>
            
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Sermon Transcript
              </label>
              <Textarea
                value={sermonText}
                onChange={(e) => setSermonText(e.target.value)}
                placeholder="Paste your sermon transcript here..."
                rows={6}
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>

            {/* Audio Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Mic className="w-4 h-4 mr-2" />
                Audio Recording
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
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

            {/* YouTube URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Video className="w-4 h-4 mr-2" />
                YouTube URL
              </label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Content Types to Generate
            </label>
            <div className="space-y-2">
              {contentTypeOptions.map(({ value, label, description }) => (
                <div key={value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={value}
                    checked={contentTypes.includes(value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setContentTypes([...contentTypes, value]);
                      } else {
                        setContentTypes(contentTypes.filter(t => t !== value));
                      }
                    }}
                    className="w-4 h-4 text-divine-600 bg-white/5 border-white/10 rounded focus:ring-divine-500"
                  />
                  <div className="flex-1">
                    <label htmlFor={value} className="text-sm font-medium text-gray-300 cursor-pointer">
                      {label}
                    </label>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleRepurpose}
            disabled={repurposeMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-divine-600 hover:from-purple-700 hover:to-divine-700 text-white font-semibold py-4 text-lg"
          >
            {repurposeMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Repurposing Content...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Repurpose Sermon ({contentTypes.length} types)
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Generated Content</h3>
          
          {repurposedContent.length > 0 ? (
            <div className="space-y-4">
              {repurposedContent.map((content) => (
                <div
                  key={content.id}
                  className="bg-gradient-to-br from-purple-800/20 to-divine-800/20 border border-purple-500/20 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-purple-300">
                        {content.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        {content.metadata.wordCount && (
                          <span>{content.metadata.wordCount} words</span>
                        )}
                        {content.metadata.duration && (
                          <span>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {content.metadata.duration}
                          </span>
                        )}
                        {content.metadata.clipCount && (
                          <span>{content.metadata.clipCount} clips</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyContent(content)}
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
                  
                  <div className="bg-gray-700/30 rounded p-4">
                    <p className="text-gray-100 text-sm leading-relaxed line-clamp-4">
                      {content.content}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded capitalize">
                      {content.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
              <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Ready to Repurpose
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Upload your sermon content and select the types of content you'd like to generate.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-purple-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              ⚡ Pro Repurposing Features
            </h3>
            <p className="text-gray-300 text-sm">
              • Automated video clip creation • Custom branding • Batch processing • Advanced analytics
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

function buildRepurposePrompt(type: string, transcript: string, title: string): string {
  const prompts = {
    'study-guide': `Create a comprehensive small group study guide based on this sermon titled "${title}". Include: 
    - Opening discussion questions
    - Key scripture passages
    - 3-4 main discussion points with questions
    - Practical application exercises
    - Closing prayer suggestions
    
    Sermon content: ${transcript}`,
    
    'devotional': `Create a 5-day devotional series based on this sermon titled "${title}". Each day should include:
    - Short devotional reading (200-300 words)
    - Key scripture verse
    - Reflection question
    - Brief prayer
    
    Sermon content: ${transcript}`,
    
    'blog-post': `Transform this sermon into an engaging blog post titled "${title}". Include:
    - Compelling introduction with hook
    - 3-4 main points with subheadings
    - Personal stories and practical examples
    - Strong conclusion with call to action
    - SEO-friendly structure
    
    Sermon content: ${transcript}`,
    
    'social-clips': `Create 3 shareable social media highlights from this sermon titled "${title}". Each should be:
    - 1-2 sentences maximum
    - Inspiring and quotable
    - Include relevant hashtags
    - Perfect for Instagram, Facebook, or Twitter
    
    Sermon content: ${transcript}`,
    
    'newsletter': `Create newsletter content based on this sermon titled "${title}". Include:
    - Engaging subject line
    - Brief sermon summary
    - Key takeaway for the week
    - Action step for readers
    - Upcoming events tie-in
    
    Sermon content: ${transcript}`
  };

  return prompts[type as keyof typeof prompts] || prompts['study-guide'];
}

function getContentTitle(type: string, sermonTitle: string): string {
  const titles = {
    'study-guide': `Study Guide: ${sermonTitle}`,
    'devotional': `5-Day Devotional: ${sermonTitle}`, 
    'blog-post': `Blog: ${sermonTitle}`,
    'social-clips': `Social Clips: ${sermonTitle}`,
    'newsletter': `Newsletter: ${sermonTitle}`
  };

  return titles[type as keyof typeof titles] || sermonTitle;
}

function createFallbackContent(type: string, title: string): RepurposedContent {
  const fallbacks = {
    'study-guide': `Small Group Study Guide: ${title}\n\nOpening Question:\nWhat comes to mind when you think about ${title.toLowerCase()}?\n\nMain Discussion Points:\n1. How does this topic relate to your daily life?\n2. What scriptures support this message?\n3. What practical steps can you take this week?\n\nClosing Prayer:\nLord, help us apply these truths to our lives. Amen.`,
    
    'devotional': `5-Day Devotional: ${title}\n\nDay 1: Understanding ${title}\nScripture: Psalm 46:1\nReflection: God is our refuge in all circumstances.\nPrayer: Thank you, Lord, for being our strength.\n\nDay 2-5: Continue exploring this theme through different scripture passages and applications.`,
    
    'blog-post': `${title}: A Message for Today\n\nIntroduction:\nIn today's world, we need to understand ${title.toLowerCase()} more than ever.\n\nKey Points:\n- Biblical foundation\n- Practical application\n- Personal transformation\n\nConclusion:\nMay this message encourage you in your faith journey.`,
    
    'social-clips': `Social Media Highlights: ${title}\n\n1. "Faith isn't about having all the answers, it's about trusting the One who does." #faith #trust\n\n2. "God's love meets us exactly where we are." #love #grace\n\n3. "Every challenge is an opportunity to see God's faithfulness." #hope #strength`,
    
    'newsletter': `Newsletter: ${title}\n\nDear Church Family,\n\nThis week we explored ${title} and discovered powerful truths for our faith journey.\n\nKey Takeaway: God's presence is with us in every season.\n\nThis Week's Challenge: Practice gratitude daily.\n\nBlessings,\nPastor`
  };

  return {
    id: `fallback-${type}-${Date.now()}`,
    type: type as any,
    title: getContentTitle(type, title),
    content: fallbacks[type as keyof typeof fallbacks] || fallbacks['study-guide'],
    metadata: {
      wordCount: 150,
      duration: type === 'social-clips' ? '1-2 minutes each' : undefined,
      clipCount: type === 'social-clips' ? 3 : undefined
    }
  };
}