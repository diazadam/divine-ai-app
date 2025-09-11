import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Heart, MessageSquare, Target, Calendar, Award } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";

interface AnalyticData {
  sermonEngagement: {
    title: string;
    views: number;
    engagement: number;
    topTopics: string[];
  }[];
  congregationInsights: {
    demographics: {
      ageGroups: { range: string; percentage: number }[];
      attendance: { month: string; count: number }[];
    };
    spiritualGrowth: {
      baptisms: number;
      newMembers: number;
      smallGroups: number;
    };
  };
  contentPerformance: {
    sermonTopics: { topic: string; resonance: number }[];
    socialMedia: { platform: string; reach: number; engagement: number }[];
  };
  aiInsights: {
    recommendations: string[];
    trends: string[];
    opportunities: string[];
  };
}

export default function ChurchAnalytics() {
  const [timeRange, setTimeRange] = useState("3months");
  const [view, setView] = useState("overview");

  // Mock data for demonstration - in real app this would come from API
  const mockAnalytics: AnalyticData = {
    sermonEngagement: [
      { title: "Hope in Difficult Times", views: 1250, engagement: 89, topTopics: ["hope", "faith", "perseverance"] },
      { title: "God's Unconditional Love", views: 1100, engagement: 92, topTopics: ["love", "grace", "forgiveness"] },
      { title: "Walking by Faith", views: 980, engagement: 85, topTopics: ["faith", "trust", "guidance"] }
    ],
    congregationInsights: {
      demographics: {
        ageGroups: [
          { range: "18-25", percentage: 15 },
          { range: "26-35", percentage: 25 },
          { range: "36-50", percentage: 30 },
          { range: "51-65", percentage: 20 },
          { range: "65+", percentage: 10 }
        ],
        attendance: [
          { month: "Jan", count: 320 },
          { month: "Feb", count: 340 },
          { month: "Mar", count: 380 },
          { month: "Apr", count: 360 },
          { month: "May", count: 390 },
          { month: "Jun", count: 420 }
        ]
      },
      spiritualGrowth: {
        baptisms: 12,
        newMembers: 28,
        smallGroups: 15
      }
    },
    contentPerformance: {
      sermonTopics: [
        { topic: "Hope & Encouragement", resonance: 94 },
        { topic: "Love & Relationships", resonance: 91 },
        { topic: "Faith & Trust", resonance: 88 },
        { topic: "Purpose & Calling", resonance: 85 },
        { topic: "Prayer & Worship", resonance: 83 }
      ],
      socialMedia: [
        { platform: "Instagram", reach: 2400, engagement: 180 },
        { platform: "Facebook", reach: 1800, engagement: 145 },
        { platform: "YouTube", reach: 3200, engagement: 230 }
      ]
    },
    aiInsights: {
      recommendations: [
        "Consider more interactive Q&A sessions - engagement peaks during discussion segments",
        "Young adult attendance increases with contemporary worship music integration",
        "Prayer request topics show high community care needs - consider support groups",
        "Social media posts with scripture graphics get 3x more engagement"
      ],
      trends: [
        "📈 Hope-themed content shows 23% higher retention",
        "🎯 Sunday evening services see growing attendance (+15%)",
        "💬 Prayer requests about anxiety/mental health increasing (32%)",
        "📱 Mobile engagement up 45% - optimize for mobile experience"
      ],
      opportunities: [
        "🚀 Launch young adult ministry based on demographic growth",
        "💡 Create mental health support ministry based on prayer trends", 
        "🎬 Develop video podcast from top-performing sermons",
        "🤝 Partner with other churches for community outreach"
      ]
    }
  };

  const { data: analytics } = useQuery({
    queryKey: ['church-analytics', timeRange],
    queryFn: async () => {
      // In real app, fetch from API
      // const response = await apiRequest('GET', `/api/analytics?range=${timeRange}`);
      // return response.json();
      return mockAnalytics;
    }
  });

  const StatCard = ({ icon: Icon, title, value, trend, color }: {
    icon: any;
    title: string;
    value: string | number;
    trend?: string;
    color: string;
  }) => (
    <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6 text-white" />
        {trend && (
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-300">{title}</p>
    </div>
  );

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-3">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">AI Church Analytics & Insights</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Data-driven insights to grow your ministry and better serve your congregation
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="sermons">Sermon Analytics</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="growth">Growth Metrics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {analytics && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              title="Average Attendance"
              value="385"
              trend="+12%"
              color="from-blue-600/20 to-blue-800/20"
            />
            <StatCard
              icon={Heart}
              title="Baptisms (YTD)"
              value={analytics.congregationInsights.spiritualGrowth.baptisms}
              trend="+8%"
              color="from-green-600/20 to-green-800/20"
            />
            <StatCard
              icon={MessageSquare}
              title="Prayer Requests"
              value="127"
              trend="+23%"
              color="from-purple-600/20 to-purple-800/20"
            />
            <StatCard
              icon={TrendingUp}
              title="Social Engagement"
              value="555"
              trend="+45%"
              color="from-orange-600/20 to-orange-800/20"
            />
          </div>

          {/* Content Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-800/20 border border-blue-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Top Performing Sermon Topics
              </h3>
              <div className="space-y-3">
                {analytics.contentPerformance.sermonTopics.slice(0, 5).map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        {index + 1}
                      </div>
                      <span className="text-gray-100">{topic.topic}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-blue-900/50 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-400 h-2 rounded-full" 
                          style={{ width: `${topic.resonance}%` }}
                        />
                      </div>
                      <span className="text-blue-300 text-sm">{topic.resonance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-800/20 border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Social Media Performance
              </h3>
              <div className="space-y-4">
                {analytics.contentPerformance.socialMedia.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <span className="text-gray-100 font-medium">{platform.platform}</span>
                    <div className="text-right">
                      <div className="text-purple-300 font-semibold">{platform.reach.toLocaleString()} reach</div>
                      <div className="text-sm text-gray-400">{platform.engagement} engagements</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-800/20 to-purple-800/20 border border-indigo-500/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-indigo-300 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              AI-Powered Ministry Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recommendations */}
              <div>
                <h4 className="text-lg font-medium text-indigo-200 mb-3">📋 Recommendations</h4>
                <div className="space-y-3">
                  {analytics.aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="bg-indigo-900/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends */}
              <div>
                <h4 className="text-lg font-medium text-purple-200 mb-3">📈 Trends</h4>
                <div className="space-y-3">
                  {analytics.aiInsights.trends.map((trend, index) => (
                    <div key={index} className="bg-purple-900/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">{trend}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div>
                <h4 className="text-lg font-medium text-pink-200 mb-3">🚀 Opportunities</h4>
                <div className="space-y-3">
                  {analytics.aiInsights.opportunities.map((opp, index) => (
                    <div key={index} className="bg-pink-900/30 rounded-lg p-3">
                      <p className="text-sm text-gray-200">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-green-800/20 to-blue-800/20 border border-green-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recommended Actions This Week
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30">
                Schedule Young Adult Event
              </Button>
              <Button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30">
                Create Hope-Themed Series
              </Button>
              <Button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30">
                Launch Mental Health Support
              </Button>
              <Button className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30">
                Optimize Mobile Experience
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-blue-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              📊 Pro Analytics Features
            </h3>
            <p className="text-gray-300 text-sm">
              • Predictive attendance modeling • Custom dashboards • Advanced segmentation • Export reports
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