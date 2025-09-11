import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Clock,
  Server
} from 'lucide-react';

interface ApiStatus {
  configured: boolean;
  status: 'operational' | 'error' | 'unknown';
  latency?: number;
}

interface HealthData {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  apis: {
    bible: ApiStatus;
    gemini: ApiStatus;
    openai: ApiStatus;
  };
  features: {
    authentication: boolean;
    database: boolean;
    email: boolean;
  };
}

export default function ApiStatusDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Failed to fetch health status');
      const data = await response.json();
      setHealth(data);
      setError(null);
      setLastChecked(new Date());
    } catch (err) {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Activity className="h-5 w-5 animate-pulse" />
            <span>Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-500">
            <WifiOff className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time API and service monitoring</CardDescription>
              </div>
            </div>
            {getStatusBadge(health.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Uptime: <strong>{formatUptime(health.uptime)}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Environment: <strong>{health.environment}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Last checked: <strong>{lastChecked.toLocaleTimeString()}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bible API Card */}
        <Card className={health.apis.bible.configured ? '' : 'opacity-60'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Bible API</CardTitle>
              {getStatusIcon(health.apis.bible.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">
                  {health.apis.bible.configured ? health.apis.bible.status : 'Not Configured'}
                </span>
              </div>
              {health.apis.bible.latency && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Latency</span>
                    <span className="font-medium">{health.apis.bible.latency}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (500 - health.apis.bible.latency) / 5)} 
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gemini API Card */}
        <Card className={health.apis.gemini.configured ? '' : 'opacity-60'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gemini AI</CardTitle>
              {getStatusIcon(health.apis.gemini.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">
                  {health.apis.gemini.configured ? health.apis.gemini.status : 'Not Configured'}
                </span>
              </div>
              {health.apis.gemini.latency && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Latency</span>
                    <span className="font-medium">{health.apis.gemini.latency}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (5000 - health.apis.gemini.latency) / 50)} 
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OpenAI API Card */}
        <Card className={health.apis.openai.configured ? '' : 'opacity-60'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">OpenAI Audio</CardTitle>
              {getStatusIcon(health.apis.openai.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">
                  {health.apis.openai.configured ? health.apis.openai.status : 'Not Configured'}
                </span>
              </div>
              {health.apis.openai.latency && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Latency</span>
                    <span className="font-medium">{health.apis.openai.latency}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (2000 - health.apis.openai.latency) / 20)} 
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm">Authentication</span>
              {health.features.authentication ? (
                <Badge className="bg-green-500/10 text-green-500">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm">Database</span>
              {health.features.database ? (
                <Badge className="bg-green-500/10 text-green-500">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className="text-sm">Email Service</span>
              {health.features.email ? (
                <Badge className="bg-green-500/10 text-green-500">Configured</Badge>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}