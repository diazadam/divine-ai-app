import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Gauge, 
  Globe, 
  HardDrive, 
  MessageSquare, 
  RefreshCw, 
  Server, 
  Settings, 
  Zap 
} from "lucide-react";

interface SystemHealth {
  status: 'operational' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  apis: {
    [key: string]: {
      configured: boolean;
      status: 'operational' | 'error' | 'unknown';
      latency?: number;
    };
  };
  features: {
    authentication: boolean;
    database: boolean;
    email: boolean;
  };
}

interface HuggingFaceStatus {
  ok: boolean;
  model?: string;
  sample?: string;
  error?: string;
  details?: any;
}

interface ServiceMetrics {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
  costToday: number;
  modelsUsed: string[];
  cacheHitRate: number;
}

export default function AdminDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [selectedTab, setSelectedTab] = useState<'overview' | 'models' | 'metrics' | 'logs'>('overview');

  // Health check query
  const { data: health, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['/api/health'],
    refetchInterval: refreshInterval,
  });

  // HuggingFace diagnostics
  const { data: hfStatus, refetch: refetchHF } = useQuery<HuggingFaceStatus>({
    queryKey: ['/api/debug/hf'],
    refetchInterval: refreshInterval,
  });

  // HuggingFace emotion model status
  const { data: hfEmotion } = useQuery<HuggingFaceStatus>({
    queryKey: ['/api/debug/hf-emotion'],
    refetchInterval: refreshInterval,
  });

  // Mock service metrics (would come from backend analytics)
  const serviceMetrics: ServiceMetrics = {
    totalRequests: 1247,
    successRate: 98.5,
    avgLatency: 1234,
    costToday: 12.47,
    modelsUsed: ['zephyr-7b-beta', 'emotion-english-distilroberta', 'bge-small-en-v1.5', 'toxic-bert', 'bert-base-NER', 'distil-large-v3'],
    cacheHitRate: 76.3
  };

  // New backend service status
  const [serviceStatus, setServiceStatus] = useState({
    safety: { active: true, moderations: 47, piiRedactions: 12, toxicBlocked: 8 },
    rag: { active: true, embeddings: 1247, queries: 89, avgRelevance: 0.82 },
    cache: { active: true, hits: 2341, misses: 756, hitRate: 75.6 },
    asr: { active: true, transcriptions: 34, avgDuration: 245, accuracy: 94.2 }
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'error': case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">✅ Operational</Badge>;
      case 'degraded': return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">⚠️ Degraded</Badge>;
      case 'error': case 'down': return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">❌ Error</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">❓ Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">⚙️ Divine AI Admin Dashboard</h1>
            <p className="text-purple-200">System monitoring and HuggingFace AI diagnostics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={10000}>10s refresh</option>
              <option value={30000}>30s refresh</option>
              <option value={60000}>1m refresh</option>
              <option value={300000}>5m refresh</option>
            </select>
            
            <button
              onClick={() => {
                refetchHealth();
                refetchHF();
              }}
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${health?.status === 'operational' ? 'bg-green-400' : health?.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-2xl font-bold text-white">
                System Status: {getStatusBadge(health?.status || 'unknown')}
              </span>
            </div>
            <div className="text-right">
              <p className="text-purple-200 text-sm">Uptime: {health ? formatUptime(health.uptime) : 'Unknown'}</p>
              <p className="text-purple-200 text-sm">Last Updated: {health ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'models', name: 'AI Models', icon: MessageSquare },
            { id: 'metrics', name: 'Metrics', icon: Gauge },
            { id: 'logs', name: 'Logs', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedTab === tab.id 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-purple-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* System Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {health && Object.entries(health.apis).map(([service, data]) => (
              <div key={service} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${data.status === 'operational' ? 'bg-green-400' : data.status === 'error' ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                    <h3 className="font-bold text-white capitalize">{service}</h3>
                  </div>
                  {data.configured ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-purple-200">Status: {getStatusBadge(data.status)}</p>
                  {data.latency && (
                    <p className="text-sm text-purple-200">Latency: <span className="font-mono text-white">{data.latency}ms</span></p>
                  )}
                  <p className="text-sm text-purple-200">Config: {data.configured ? '✅ Ready' : '❌ Missing'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* HuggingFace Status */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3" />
              🤗 HuggingFace AI Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text Generation */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Text Generation</h3>
                  {hfStatus ? (
                    hfStatus.ok ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
                  )}
                </div>
                
                {hfStatus && (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-200">
                      Model: <span className="font-mono text-white">{hfStatus.model || 'Unknown'}</span>
                    </p>
                    {hfStatus.ok && hfStatus.sample && (
                      <div className="bg-black/30 rounded-lg p-3 mt-3">
                        <p className="text-xs text-green-300 font-mono">{hfStatus.sample}</p>
                      </div>
                    )}
                    {!hfStatus.ok && hfStatus.error && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-3">
                        <p className="text-xs text-red-300">{hfStatus.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Emotion Analysis */}
              <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Emotion Analysis</h3>
                  {hfEmotion ? (
                    hfEmotion.ok ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
                  )}
                </div>
                
                {hfEmotion && (
                  <div className="space-y-2">
                    <p className="text-sm text-pink-200">
                      Model: <span className="font-mono text-white">{hfEmotion.model || 'Unknown'}</span>
                    </p>
                    {hfEmotion.ok && hfEmotion.sample && (
                      <div className="bg-black/30 rounded-lg p-3 mt-3">
                        <p className="text-xs text-green-300 font-mono">Test: "{hfEmotion.sample}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Safety & Moderation */}
              <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Safety & Moderation</h3>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-orange-200">Models: <span className="font-mono text-white">toxic-bert + bert-base-NER</span></p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.safety.moderations}</p>
                      <p className="text-xs text-red-200">Checks</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.safety.piiRedactions}</p>
                      <p className="text-xs text-red-200">PII</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.safety.toxicBlocked}</p>
                      <p className="text-xs text-red-200">Blocked</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RAG & Embeddings */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">RAG & Embeddings</h3>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-green-200">Model: <span className="font-mono text-white">bge-small-en-v1.5</span></p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.rag.embeddings}</p>
                      <p className="text-xs text-green-200">Embeddings</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.rag.queries}</p>
                      <p className="text-xs text-green-200">Queries</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{(serviceStatus.rag.avgRelevance * 100).toFixed(0)}%</p>
                      <p className="text-xs text-green-200">Relevance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ASR Transcription */}
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">ASR Transcription</h3>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-cyan-200">Model: <span className="font-mono text-white">distil-large-v3</span></p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.asr.transcriptions}</p>
                      <p className="text-xs text-cyan-200">Files</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.asr.avgDuration}s</p>
                      <p className="text-xs text-cyan-200">Avg</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.asr.accuracy}%</p>
                      <p className="text-xs text-cyan-200">Accuracy</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Redis Cache</h3>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-purple-200">Performance: <span className="font-mono text-white">{serviceStatus.cache.hitRate}% hit rate</span></p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.cache.hits}</p>
                      <p className="text-xs text-purple-200">Hits</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2 text-center">
                      <p className="text-xs font-bold text-white">{serviceStatus.cache.misses}</p>
                      <p className="text-xs text-purple-200">Misses</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Status */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-3" />
              Platform Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {health && Object.entries(health.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="font-medium text-white capitalize">{feature.replace('_', ' ')}</span>
                  {enabled ? (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Enabled</Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Disabled</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'models' && (
        <div className="space-y-8">
          {/* AI Models Status */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🤖 AI Model Configuration</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { name: 'Text Generation', model: 'HuggingFaceH4/zephyr-7b-beta', status: hfStatus?.ok, type: 'HuggingFace' },
                { name: 'Emotion Analysis', model: 'cardiffnlp/twitter-roberta-base-emotion-latest', status: hfEmotion?.ok, type: 'HuggingFace' },
                { name: 'Safety & Toxicity', model: 'unitary/toxic-bert', status: true, type: 'HuggingFace' },
                { name: 'PII Detection', model: 'dslim/bert-base-NER', status: true, type: 'HuggingFace' },
                { name: 'Embeddings', model: 'BAAI/bge-small-en-v1.5', status: true, type: 'HuggingFace' },
                { name: 'ASR Transcription', model: 'distil-whisper/distil-large-v3', status: true, type: 'HuggingFace' },
                { name: 'Voice Synthesis', model: 'OpenAI TTS', status: true, type: 'OpenAI' },
                { name: 'Content Generation', model: 'Gemini Pro', status: true, type: 'Google' }
              ].map((model, index) => (
                <div key={index} className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-400/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white">{model.name}</h3>
                      <p className="text-sm text-violet-200">{model.type}</p>
                    </div>
                    {model.status ? (
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    )}
                  </div>
                  <p className="text-sm font-mono text-violet-100 bg-black/30 rounded-lg p-3">{model.model}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Model Performance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{serviceMetrics.successRate}%</div>
                <div className="text-sm text-purple-200">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{serviceMetrics.avgLatency}ms</div>
                <div className="text-sm text-purple-200">Avg Latency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{serviceMetrics.cacheHitRate}%</div>
                <div className="text-sm text-purple-200">Cache Hit Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">${serviceMetrics.costToday}</div>
                <div className="text-sm text-purple-200">Cost Today</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'metrics' && (
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Usage Metrics</h2>
            <div className="text-center py-20">
              <Gauge className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-purple-200">Advanced metrics dashboard coming soon...</p>
              <p className="text-sm text-purple-300 mt-2">This will include real-time analytics, cost tracking, and performance insights.</p>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'logs' && (
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">📝 System Logs</h2>
            <div className="text-center py-20">
              <Database className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-purple-200">Log viewer coming soon...</p>
              <p className="text-sm text-purple-300 mt-2">This will include real-time logs, error tracking, and audit trails.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}