import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Instagram, Facebook, Twitter, Calendar, Clock, Share2, Sparkles, Settings, CheckCircle } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  username: string;
  connected: boolean;
  followers: number;
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  imageUrl?: string;
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'failed';
  type: 'verse' | 'prayer' | 'inspiration' | 'sermon-clip';
}

interface AutomationSettings {
  dailyVerse: {
    enabled: boolean;
    time: string;
    platforms: string[];
    style: 'simple' | 'graphic' | 'video';
  };
  weeklyInspiration: {
    enabled: boolean;
    day: string;
    time: string;
    platforms: string[];
  };
  sermonPromotion: {
    enabled: boolean;
    daysBefore: number;
    platforms: string[];
  };
  prayerReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    platforms: string[];
  };
}

export default function SocialAutomation() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'scheduler' | 'automation'>('accounts');
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [postType, setPostType] = useState<'verse' | 'prayer' | 'inspiration' | 'sermon-clip'>('verse');
  
  const { toast } = useToast();

  // Mock data - in real app this would come from API
  const mockAccounts: SocialAccount[] = [
    { id: '1', platform: 'instagram', username: '@mychurch', connected: true, followers: 2400 },
    { id: '2', platform: 'facebook', username: 'My Church Page', connected: true, followers: 1800 },
    { id: '3', platform: 'twitter', username: '@mychurch', connected: false, followers: 0 },
    { id: '4', platform: 'linkedin', username: 'My Church', connected: false, followers: 0 }
  ];

  const mockScheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      platform: 'instagram',
      content: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." - Joshua 1:9 #faith #strength #courage',
      scheduledTime: '2024-01-15T08:00:00Z',
      status: 'scheduled',
      type: 'verse'
    },
    {
      id: '2',
      platform: 'facebook',
      content: 'Join us this Sunday as we explore "Finding Hope in Difficult Times" - a message of encouragement for all seasons of life. 🙏✨',
      scheduledTime: '2024-01-14T10:00:00Z',
      status: 'posted',
      type: 'sermon-clip'
    }
  ];

  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    dailyVerse: {
      enabled: true,
      time: '08:00',
      platforms: ['instagram', 'facebook'],
      style: 'graphic'
    },
    weeklyInspiration: {
      enabled: true,
      day: 'wednesday',
      time: '12:00',
      platforms: ['instagram', 'facebook', 'twitter']
    },
    sermonPromotion: {
      enabled: true,
      daysBefore: 2,
      platforms: ['facebook', 'instagram']
    },
    prayerReminders: {
      enabled: false,
      frequency: 'weekly',
      platforms: ['facebook']
    }
  });

  const connectAccountMutation = useMutation({
    mutationFn: async (platform: string) => {
      // In real app, this would initiate OAuth flow
      const response = await apiRequest('POST', '/api/social/connect', { platform });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Connected! 🎉",
        description: "Your social media account has been connected successfully"
      });
    }
  });

  const schedulePostMutation = useMutation({
    mutationFn: async (postData: {
      content: string;
      platforms: string[];
      scheduleTime: string;
      type: string;
    }) => {
      const response = await apiRequest('POST', '/api/social/schedule', postData);
      return response.json();
    },
    onSuccess: () => {
      setNewPostContent("");
      setScheduleTime("");
      setSelectedPlatforms([]);
      toast({
        title: "Post Scheduled! 📅",
        description: "Your content will be automatically posted to selected platforms"
      });
    }
  });

  const generateContentMutation = useMutation({
    mutationFn: async (type: string) => {
      let prompt = "";
      switch (type) {
        case 'verse':
          prompt = "Generate an inspirational Bible verse post with relevant hashtags for social media";
          break;
        case 'prayer':
          prompt = "Create a short, heartfelt prayer for social media that encourages community";
          break;
        case 'inspiration':
          prompt = "Write an uplifting, faith-based inspirational message for social media";
          break;
        case 'sermon-clip':
          prompt = "Create an engaging social media post promoting an upcoming sermon";
          break;
      }

      const response = await apiRequest('POST', '/api/chat', {
        message: prompt,
        type: 'default'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setNewPostContent(data.response);
      toast({
        title: "Content Generated! ✨",
        description: "AI has created engaging social media content for you"
      });
    }
  });

  const handleSchedulePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter content for your post",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform Required", 
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }

    schedulePostMutation.mutate({
      content: newPostContent,
      platforms: selectedPlatforms,
      scheduleTime: scheduleTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      type: postType
    });
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'twitter': return <Twitter className="w-5 h-5 text-sky-500" />;
      default: return <Share2 className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-pink-500 to-blue-500 p-3 rounded-full mr-3">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Social Media Automation</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Connect accounts, schedule content, and automate daily inspirational posts across all platforms
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-600">
        {[
          { id: 'accounts', label: 'Connected Accounts', icon: Settings },
          { id: 'scheduler', label: 'Content Scheduler', icon: Calendar },
          { id: 'automation', label: 'Automation Rules', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "ghost"}
            onClick={() => setActiveTab(id as any)}
            className={`${activeTab === id 
              ? 'bg-gradient-to-r from-pink-600 to-blue-600 text-white' 
              : 'text-gray-300 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Connected Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white mb-4">Social Media Accounts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-6 rounded-lg border ${
                  account.connected 
                    ? 'bg-green-800/20 border-green-500/30' 
                    : 'bg-gray-800/20 border-gray-600/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <PlatformIcon platform={account.platform} />
                    <div>
                      <h4 className="font-semibold text-white capitalize">{account.platform}</h4>
                      <p className="text-sm text-gray-400">{account.username || 'Not connected'}</p>
                    </div>
                  </div>
                  {account.connected ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => connectAccountMutation.mutate(account.platform)}
                      disabled={connectAccountMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Connect
                    </Button>
                  )}
                </div>
                
                {account.connected && (
                  <div className="text-sm text-gray-300">
                    <p>{account.followers.toLocaleString()} followers</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-800/20 border border-blue-500/20 rounded-lg p-6">
            <h4 className="font-semibold text-blue-300 mb-2">🚀 Pro Social Features</h4>
            <p className="text-gray-300 text-sm mb-4">
              Connect unlimited accounts, advanced analytics, team collaboration, and white-label posting
            </p>
            <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}

      {/* Content Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Post */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Schedule New Post</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verse">📖 Daily Bible Verse</SelectItem>
                    <SelectItem value="prayer">🙏 Prayer & Reflection</SelectItem>
                    <SelectItem value="inspiration">✨ Inspirational Message</SelectItem>
                    <SelectItem value="sermon-clip">🎤 Sermon Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Post Content</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateContentMutation.mutate(postType)}
                    disabled={generateContentMutation.isPending}
                    className="border-purple-500/50 text-purple-400"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post content or click AI Generate..."
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {mockAccounts.filter(acc => acc.connected).map((account) => (
                    <Button
                      key={account.platform}
                      size="sm"
                      variant={selectedPlatforms.includes(account.platform) ? "default" : "outline"}
                      onClick={() => {
                        if (selectedPlatforms.includes(account.platform)) {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== account.platform));
                        } else {
                          setSelectedPlatforms([...selectedPlatforms, account.platform]);
                        }
                      }}
                      className="flex items-center"
                    >
                      <PlatformIcon platform={account.platform} />
                      <span className="ml-2 capitalize">{account.platform}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Time (Optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <Button
                onClick={handleSchedulePost}
                disabled={schedulePostMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 text-white font-semibold py-3"
              >
                {scheduleTime ? 'Schedule Post' : 'Post Now'}
              </Button>
            </div>

            {/* Scheduled Posts */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Scheduled Posts</h3>
              
              {mockScheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <PlatformIcon platform={post.platform} />
                      <span className="text-sm text-gray-400 capitalize">{post.platform}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        post.status === 'posted' ? 'bg-green-500/20 text-green-300' :
                        post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{post.type}</span>
                  </div>
                  
                  <p className="text-sm text-gray-200 mb-2 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.scheduledTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Automation Rules Tab */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white mb-4">Automated Content Rules</h3>
          
          <div className="space-y-6">
            {/* Daily Verse */}
            <div className="bg-purple-800/20 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-purple-300">📖 Daily Bible Verse</h4>
                  <p className="text-sm text-gray-400">Automatically post inspirational verses every day</p>
                </div>
                <Switch 
                  checked={automationSettings.dailyVerse.enabled}
                  onCheckedChange={(checked) => 
                    setAutomationSettings(prev => ({
                      ...prev,
                      dailyVerse: { ...prev.dailyVerse, enabled: checked }
                    }))
                  }
                />
              </div>
              
              {automationSettings.dailyVerse.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">Post Time</label>
                    <Input
                      type="time"
                      value={automationSettings.dailyVerse.time}
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Style</label>
                    <Select value={automationSettings.dailyVerse.style} onValueChange={() => {}}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple Text</SelectItem>
                        <SelectItem value="graphic">With Graphics</SelectItem>
                        <SelectItem value="video">Video Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Inspiration */}
            <div className="bg-blue-800/20 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-blue-300">✨ Weekly Inspiration</h4>
                  <p className="text-sm text-gray-400">Motivational messages to encourage your community</p>
                </div>
                <Switch 
                  checked={automationSettings.weeklyInspiration.enabled}
                  onCheckedChange={(checked) => 
                    setAutomationSettings(prev => ({
                      ...prev,
                      weeklyInspiration: { ...prev.weeklyInspiration, enabled: checked }
                    }))
                  }
                />
              </div>
            </div>

            {/* Sermon Promotion */}
            <div className="bg-green-800/20 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-green-300">🎤 Sermon Promotion</h4>
                  <p className="text-sm text-gray-400">Automatically promote upcoming sermons</p>
                </div>
                <Switch 
                  checked={automationSettings.sermonPromotion.enabled}
                  onCheckedChange={(checked) => 
                    setAutomationSettings(prev => ({
                      ...prev,
                      sermonPromotion: { ...prev.sermonPromotion, enabled: checked }
                    }))
                  }
                />
              </div>
            </div>

            {/* Prayer Reminders */}
            <div className="bg-indigo-800/20 border border-indigo-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-indigo-300">🙏 Prayer Reminders</h4>
                  <p className="text-sm text-gray-400">Encourage community prayer and reflection</p>
                </div>
                <Switch 
                  checked={automationSettings.prayerReminders.enabled}
                  onCheckedChange={(checked) => 
                    setAutomationSettings(prev => ({
                      ...prev,
                      prayerReminders: { ...prev.prayerReminders, enabled: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gold-500/10 to-pink-500/10 border border-gold-500/20 rounded-lg p-6">
            <h4 className="font-semibold text-gold-400 mb-2">🎯 Advanced Automation</h4>
            <p className="text-gray-300 text-sm mb-4">
              Smart scheduling, A/B testing, engagement optimization, and cross-platform analytics
            </p>
            <Button variant="outline" className="border-gold-500/50 text-gold-400 hover:bg-gold-500/10">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}