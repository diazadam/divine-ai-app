import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Calendar, 
  Download, 
  Eye, 
  Headphones, 
  Heart, 
  LineChart, 
  MessageSquare, 
  Play, 
  Share2, 
  Star, 
  TrendingUp, 
  Users, 
  Volume2 
} from "lucide-react";

interface PodcastMetrics {
  id: string;
  title: string;
  totalPlays: number;
  totalDownloads: number;
  totalShares: number;
  avgRating: number;
  completionRate: number;
  createdAt: string;
  duration: number;
  listenerRetention: number[];
  demographics: {
    ageGroups: { [key: string]: number };
    locations: { [key: string]: number };
    devices: { [key: string]: number };
  };
  engagementScore: number;
  revenueGenerated?: number;
}

interface AnalyticsPeriod {
  label: string;
  value: string;
  days: number;
}

const periods: AnalyticsPeriod[] = [
  { label: '7 days', value: '7d', days: 7 },
  { label: '30 days', value: '30d', days: 30 },
  { label: '90 days', value: '90d', days: 90 },
  { label: '1 year', value: '1y', days: 365 }
];

// Mock data - in real app this would come from backend analytics
const mockMetrics: PodcastMetrics[] = [
  {
    id: '1',
    title: 'The Future of AI in Education',
    totalPlays: 1247,
    totalDownloads: 892,
    totalShares: 156,
    avgRating: 4.8,
    completionRate: 87.5,
    createdAt: '2024-01-15T10:00:00Z',
    duration: 15 * 60, // 15 minutes
    listenerRetention: [100, 95, 89, 82, 78, 75, 73, 70, 68, 65],
    demographics: {
      ageGroups: { '18-24': 15, '25-34': 35, '35-44': 30, '45-54': 15, '55+': 5 },
      locations: { 'US': 45, 'UK': 15, 'Canada': 12, 'Australia': 8, 'Other': 20 },
      devices: { 'Mobile': 65, 'Desktop': 25, 'Tablet': 10 }
    },
    engagementScore: 92,
    revenueGenerated: 145.30
  },
  {
    id: '2', 
    title: 'Climate Change Solutions',
    totalPlays: 896,
    totalDownloads: 634,
    totalShares: 89,
    avgRating: 4.6,
    completionRate: 73.2,
    createdAt: '2024-01-12T14:30:00Z',
    duration: 22 * 60, // 22 minutes
    listenerRetention: [100, 92, 85, 78, 70, 65, 60, 55, 50, 45],
    demographics: {
      ageGroups: { '18-24': 20, '25-34': 40, '35-44': 25, '45-54': 10, '55+': 5 },
      locations: { 'US': 40, 'UK': 18, 'Germany': 15, 'Canada': 10, 'Other': 17 },
      devices: { 'Mobile': 70, 'Desktop': 20, 'Tablet': 10 }
    },
    engagementScore: 78
  }
];

export default function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [selectedPodcast, setSelectedPodcast] = useState<string | null>(null);

  // In real app, this would fetch from API based on period
  const { data: podcasts = [] } = useQuery<any[]>({
    queryKey: ['/api/podcasts'],
  });

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    return mockMetrics.reduce((acc, podcast) => ({
      totalPodcasts: acc.totalPodcasts + 1,
      totalPlays: acc.totalPlays + podcast.totalPlays,
      totalDownloads: acc.totalDownloads + podcast.totalDownloads,
      totalShares: acc.totalShares + podcast.totalShares,
      avgRating: (acc.avgRating + podcast.avgRating) / 2,
      avgCompletionRate: (acc.avgCompletionRate + podcast.completionRate) / 2,
      totalRevenue: (acc.totalRevenue || 0) + (podcast.revenueGenerated || 0)
    }), {
      totalPodcasts: 0,
      totalPlays: 0,
      totalDownloads: 0,
      totalShares: 0,
      avgRating: 0,
      avgCompletionRate: 0,
      totalRevenue: 0
    });
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📊 Podcast Analytics</h1>
            <p className="text-purple-200">Track performance, engagement, and insights for your AI-generated podcasts</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Period Selector */}
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
            
            <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatNumber(aggregateMetrics.totalPlays)}</h3>
          <p className="text-purple-200 text-sm">Total Plays</p>
          <p className="text-green-400 text-xs mt-2">+12.5% vs last period</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatNumber(aggregateMetrics.totalDownloads)}</h3>
          <p className="text-purple-200 text-sm">Downloads</p>
          <p className="text-green-400 text-xs mt-2">+8.3% vs last period</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{aggregateMetrics.avgRating.toFixed(1)}</h3>
          <p className="text-purple-200 text-sm">Avg Rating</p>
          <p className="text-green-400 text-xs mt-2">+0.2% vs last period</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{Math.round(aggregateMetrics.avgCompletionRate)}%</h3>
          <p className="text-purple-200 text-sm">Completion Rate</p>
          <p className="text-green-400 text-xs mt-2">+5.1% vs last period</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Podcast Performance List */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BarChart className="w-6 h-6 mr-3" />
            Podcast Performance
          </h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {mockMetrics.map((podcast, index) => (
              <div 
                key={podcast.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  selectedPodcast === podcast.id
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/30"
                }`}
                onClick={() => setSelectedPodcast(selectedPodcast === podcast.id ? null : podcast.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🎙️</span>
                    <div>
                      <h3 className="font-bold text-white">{podcast.title}</h3>
                      <p className="text-sm text-purple-200">
                        {formatDuration(podcast.duration)} • {new Date(podcast.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{formatNumber(podcast.totalPlays)}</p>
                      <p className="text-xs text-purple-200">Plays</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{formatNumber(podcast.totalDownloads)}</p>
                      <p className="text-xs text-purple-200">Downloads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{podcast.avgRating.toFixed(1)} ⭐</p>
                      <p className="text-xs text-purple-200">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${getEngagementColor(podcast.engagementScore)}`}>
                        {podcast.engagementScore}
                      </p>
                      <p className="text-xs text-purple-200">Score</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2 ml-4">
                  <Badge className={`${
                    podcast.completionRate > 80 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : podcast.completionRate > 60
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {Math.round(podcast.completionRate)}% completed
                  </Badge>
                  
                  {podcast.revenueGenerated && (
                    <p className="text-green-400 text-sm font-bold">
                      ${podcast.revenueGenerated.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          
          {/* Top Performing Content */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Performer
            </h3>
            
            {mockMetrics[0] && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h4 className="font-bold text-white text-sm mb-1">{mockMetrics[0].title}</h4>
                  <p className="text-purple-200 text-xs">{formatNumber(mockMetrics[0].totalPlays)} plays</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-yellow-400 font-bold">{mockMetrics[0].avgRating}</p>
                    <p className="text-xs text-purple-200">Rating</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-green-400 font-bold">{mockMetrics[0].completionRate.toFixed(0)}%</p>
                    <p className="text-xs text-purple-200">Completion</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Model Performance */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              AI Models Used
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">🤗 HuggingFace Zephyr</span>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">85%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">💎 Gemini Pro</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">98%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">🎭 Emotion Analysis</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">92%</Badge>
              </div>
            </div>
          </div>

          {/* Voice Usage */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Voice Usage
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">👨‍💼 Brad (Male)</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">45%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">✨ Hope (Female)</span>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">35%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-200 text-sm">💪 Will (Male)</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">20%</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics for Selected Podcast */}
      {selectedPodcast && (
        <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Detailed Analytics</h2>
          
          {(() => {
            const podcast = mockMetrics.find(p => p.id === selectedPodcast);
            if (!podcast) return null;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Listener Retention */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">📈 Listener Retention</h3>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="space-y-2">
                      {podcast.listenerRetention.map((retention, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-sm text-purple-200 w-12">{index * 10}%</span>
                          <div className="flex-1 bg-white/20 rounded-full h-2">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                              style={{ width: `${retention}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-12">{retention}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">👥 Demographics</h3>
                  
                  <div className="space-y-4">
                    {/* Age Groups */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Age Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(podcast.demographics.ageGroups).map(([age, percentage]) => (
                          <div key={age} className="flex items-center justify-between">
                            <span className="text-purple-200 text-sm">{age}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-white/20 rounded-full h-2">
                                <div 
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-white text-sm font-bold w-8">{percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Devices */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Device Usage</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(podcast.demographics.devices).map(([device, percentage]) => (
                          <div key={device} className="bg-white/5 rounded-lg p-3 text-center">
                            <p className="text-white font-bold">{percentage}%</p>
                            <p className="text-purple-200 text-xs">{device}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}