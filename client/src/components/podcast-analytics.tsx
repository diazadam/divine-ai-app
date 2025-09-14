import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Download,
  Play,
  Share2,
  Clock,
  Globe,
  Headphones,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  Star,
  MessageCircle,
  ThumbsUp,
  Eye,
  Activity,
  Radio,
  Podcast,
  Zap,
  Award,
  Target,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PodcastMetrics {
  totalPlays: number;
  totalDownloads: number;
  totalShares: number;
  totalDuration: number;
  totalEpisodes: number;
  avgRating: number;
  completionRate: number;
  subscriberGrowth: number;
}

interface EpisodeAnalytics {
  id: string;
  title: string;
  plays: number;
  downloads: number;
  shares: number;
  avgListenTime: number;
  completionRate: number;
  rating: number;
  publishDate: string;
  peakListeningTime: string;
  dropOffPoints: number[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface GeographicData {
  country: string;
  listeners: number;
  percentage: number;
  flag: string;
}

interface PlatformData {
  platform: string;
  listeners: number;
  percentage: number;
  icon: string;
  growth: number;
}

interface PodcastAnalyticsProps {
  podcastId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export default function PodcastAnalytics({ podcastId, timeRange = '30d' }: PodcastAnalyticsProps) {
  const [metrics, setMetrics] = useState<PodcastMetrics>({
    totalPlays: 15847,
    totalDownloads: 12453,
    totalShares: 892,
    totalDuration: 45.2,
    totalEpisodes: 3,
    avgRating: 4.8,
    completionRate: 78.5,
    subscriberGrowth: 15.3
  });

  const [episodes, setEpisodes] = useState<EpisodeAnalytics[]>([
    {
      id: 'ep1',
      title: 'Kingdom AI',
      plays: 8947,
      downloads: 6234,
      shares: 456,
      avgListenTime: 95.2,
      completionRate: 82.1,
      rating: 4.9,
      publishDate: '2025-09-11',
      peakListeningTime: '8:00 PM',
      dropOffPoints: [15, 35, 78],
      engagement: { likes: 234, comments: 67, shares: 456 }
    },
    {
      id: 'ep2',
      title: 'Kingdom AI (Extended)',
      plays: 5234,
      downloads: 4123,
      shares: 289,
      avgListenTime: 87.6,
      completionRate: 75.3,
      rating: 4.7,
      publishDate: '2025-09-11',
      peakListeningTime: '6:30 PM',
      dropOffPoints: [22, 45, 68],
      engagement: { likes: 187, comments: 43, shares: 289 }
    },
    {
      id: 'ep3',
      title: 'Heat Press Power',
      plays: 1666,
      downloads: 2096,
      shares: 147,
      avgListenTime: 16.8,
      completionRate: 93.3,
      rating: 4.8,
      publishDate: '2025-09-11',
      peakListeningTime: '7:15 PM',
      dropOffPoints: [8, 14],
      engagement: { likes: 98, comments: 21, shares: 147 }
    }
  ]);

  const [geographic, setGeographic] = useState<GeographicData[]>([
    { country: 'United States', listeners: 6234, percentage: 39.3, flag: '🇺🇸' },
    { country: 'Canada', listeners: 2341, percentage: 14.8, flag: '🇨🇦' },
    { country: 'United Kingdom', listeners: 1876, percentage: 11.8, flag: '🇬🇧' },
    { country: 'Australia', listeners: 1234, percentage: 7.8, flag: '🇦🇺' },
    { country: 'Germany', listeners: 987, percentage: 6.2, flag: '🇩🇪' },
    { country: 'Netherlands', listeners: 654, percentage: 4.1, flag: '🇳🇱' },
    { country: 'Other', listeners: 2521, percentage: 15.9, flag: '🌍' }
  ]);

  const [platforms, setPlatforms] = useState<PlatformData[]>([
    { platform: 'Apple Podcasts', listeners: 5234, percentage: 33.0, icon: '🎵', growth: 12.3 },
    { platform: 'Spotify', listeners: 4321, percentage: 27.3, icon: '🎧', growth: 18.7 },
    { platform: 'Google Podcasts', listeners: 2876, percentage: 18.1, icon: '📻', growth: -2.1 },
    { platform: 'YouTube', listeners: 1987, percentage: 12.5, icon: '📺', growth: 25.4 },
    { platform: 'Other', listeners: 1429, percentage: 9.0, icon: '📱', growth: 8.9 }
  ]);

  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedMetric, setSelectedMetric] = useState<'plays' | 'downloads' | 'engagement'>('plays');

  // Mock data for time series
  const generateTimeSeriesData = () => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      plays: Math.floor(Math.random() * 500) + 200,
      downloads: Math.floor(Math.random() * 300) + 100,
      engagement: Math.floor(Math.random() * 50) + 10
    }));
  };

  const timeSeriesData = generateTimeSeriesData();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-zinc-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-400" />
            Podcast Analytics
          </h2>
          <p className="text-gray-100/80">Track performance and audience insights</p>
        </div>
        
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range as any)}
              className={`px-4 py-2 rounded-xl transition-all font-bold ${
                selectedTimeRange === range
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
          <div className="flex items-center justify-between mb-2">
            <Play className="w-6 h-6 text-blue-400" />
            <div className="flex items-center space-x-1">
              {getGrowthIcon(12.3)}
              <span className={`text-sm font-bold ${getGrowthColor(12.3)}`}>12.3%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatNumber(metrics.totalPlays)}</div>
          <div className="text-blue-200/80 text-sm">Total Plays</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
          <div className="flex items-center justify-between mb-2">
            <Download className="w-6 h-6 text-green-400" />
            <div className="flex items-center space-x-1">
              {getGrowthIcon(8.7)}
              <span className={`text-sm font-bold ${getGrowthColor(8.7)}`}>8.7%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatNumber(metrics.totalDownloads)}</div>
          <div className="text-green-200/80 text-sm">Downloads</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-400" />
            <div className="flex items-center space-x-1">
              {getGrowthIcon(metrics.subscriberGrowth)}
              <span className={`text-sm font-bold ${getGrowthColor(metrics.subscriberGrowth)}`}>{metrics.subscriberGrowth}%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formatNumber(12847)}</div>
          <div className="text-purple-200/80 text-sm">Subscribers</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-400/30">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-6 h-6 text-orange-400" />
            <div className="text-orange-300 text-sm font-bold">{metrics.avgRating}/5</div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{metrics.completionRate}%</div>
          <div className="text-orange-200/80 text-sm">Completion Rate</div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Time Series Chart */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Performance Trends</h3>
            <div className="flex space-x-2">
              {(['plays', 'downloads', 'engagement'] as const).map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 rounded-lg transition-all text-sm font-bold capitalize ${
                    selectedMetric === metric
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mock Chart Visualization */}
          <div className="h-48 bg-black/30 rounded-xl p-4 flex items-end space-x-1">
            {timeSeriesData.slice(-20).map((data, index) => {
              const value = data[selectedMetric];
              const maxValue = Math.max(...timeSeriesData.map(d => d[selectedMetric]));
              const height = (value / maxValue) * 160;
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t opacity-70 hover:opacity-100 transition-all cursor-pointer"
                  style={{ height: `${height}px` }}
                  title={`${data.date}: ${value}`}
                />
              );
            })}
          </div>
          
          <div className="mt-4 text-center text-gray-300 text-sm">
            {selectedMetric === 'plays' ? 'Daily Plays' : 
             selectedMetric === 'downloads' ? 'Daily Downloads' : 
             'Daily Engagement'} over {selectedTimeRange}
          </div>
        </div>

        {/* Top Episodes */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Top Episodes</h3>
          
          <div className="space-y-4">
            {episodes.map((episode, index) => (
              <div key={episode.id} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-blue-400">#{index + 1}</div>
                    <div>
                      <h4 className="font-bold text-white">{episode.title}</h4>
                      <div className="text-gray-300/60 text-sm">{episode.publishDate}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-300 text-sm font-bold">{episode.rating}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{formatNumber(episode.plays)}</div>
                    <div className="text-gray-300/60 text-xs">Plays</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{formatNumber(episode.downloads)}</div>
                    <div className="text-gray-300/60 text-xs">Downloads</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{episode.completionRate}%</div>
                    <div className="text-gray-300/60 text-xs">Completion</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic and Platform Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Geographic Distribution */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Geographic Distribution
          </h3>
          
          <div className="space-y-3">
            {geographic.map((geo) => (
              <div key={geo.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{geo.flag}</span>
                  <div>
                    <div className="text-white font-bold">{geo.country}</div>
                    <div className="text-gray-300/60 text-sm">{formatNumber(geo.listeners)} listeners</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                      style={{ width: `${geo.percentage}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm w-10 text-right">{geo.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Radio className="w-5 h-5 mr-2" />
            Platform Distribution
          </h3>
          
          <div className="space-y-3">
            {platforms.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <div className="text-white font-bold">{platform.platform}</div>
                    <div className="text-gray-300/60 text-sm">{formatNumber(platform.listeners)} listeners</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(platform.growth)}
                    <span className={`text-sm font-bold ${getGrowthColor(platform.growth)}`}>
                      {Math.abs(platform.growth)}%
                    </span>
                  </div>
                  <span className="text-white font-bold text-sm w-10 text-right">{platform.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Engagement Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Peak Listening Times */}
          <div className="bg-white/10 rounded-xl p-4">
            <h4 className="font-bold text-white mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Peak Times
            </h4>
            <div className="space-y-2">
              <div className="text-blue-300">📅 Weekdays: 7-9 AM</div>
              <div className="text-green-300">🌅 Mornings: 6-8 AM</div>
              <div className="text-purple-300">🌙 Evenings: 8-10 PM</div>
            </div>
          </div>

          {/* Audience Retention */}
          <div className="bg-white/10 rounded-xl p-4">
            <h4 className="font-bold text-white mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Retention
            </h4>
            <div className="space-y-2">
              <div className="text-green-300">✅ First 30s: 95%</div>
              <div className="text-yellow-300">⚠️ Mid-point: 78%</div>
              <div className="text-red-300">🔄 Drop-off: 15%</div>
            </div>
          </div>

          {/* Social Engagement */}
          <div className="bg-white/10 rounded-xl p-4">
            <h4 className="font-bold text-white mb-4 flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              Social
            </h4>
            <div className="space-y-2">
              <div className="text-pink-300">❤️ Total Likes: 519</div>
              <div className="text-blue-300">💬 Comments: 131</div>
              <div className="text-green-300">📤 Shares: 892</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Sparkles className="w-5 h-5 mr-2" />
          AI Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-purple-300 mb-2">Growth Opportunities</h4>
            <ul className="space-y-1 text-gray-100/80 text-sm">
              <li>• Consider shorter episodes (15-20min) for higher completion rates</li>
              <li>• Post at 8 PM for maximum engagement</li>
              <li>• Target Canadian audience for 40% growth potential</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-pink-300 mb-2">Content Insights</h4>
            <ul className="space-y-1 text-gray-100/80 text-sm">
              <li>• "Kingdom AI" format performs 3x better</li>
              <li>• Interview segments show 85% retention</li>
              <li>• Add transcripts to boost accessibility by 25%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}