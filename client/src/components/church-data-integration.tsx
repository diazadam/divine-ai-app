import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, CheckCircle, AlertCircle, RefreshCw, Plus, Trash2, BarChart3 } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  setupRequired: string[];
  icon: string;
}

interface ConnectedIntegration {
  id: string;
  type: string;
  status: 'connected' | 'error' | 'syncing';
  dataTypes: string[];
  lastSync: string;
}

export default function ChurchDataIntegration() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSetup, setShowSetup] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available integrations
  const { data: availableIntegrations = [], isLoading: loadingAvailable } = useQuery<Integration[]>({
    queryKey: ['/api/integrations/available'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/available');
      return response.json();
    }
  });

  // Fetch connected integrations
  const { data: connectedIntegrations = [], isLoading: loadingConnected } = useQuery<ConnectedIntegration[]>({
    queryKey: ['/api/integrations/connected'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/connected');
      return response.json();
    }
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async ({ integrationType, credentials }: { integrationType: string; credentials: Record<string, string> }) => {
      const response = await apiRequest('POST', '/api/integrations/connect', {
        integrationType,
        credentials,
        settings: {}
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/connected'] });
      setShowSetup(false);
      setSelectedIntegration(null);
      setCredentials({});
      toast({
        title: "Integration Connected! 🎉",
        description: "Your church data source has been successfully connected."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive"
      });
    }
  });

  // Sync integration mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiRequest('POST', `/api/integrations/${integrationId}/sync`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/connected'] });
      toast({
        title: "Data Synced",
        description: "Your church data has been updated successfully."
      });
    }
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiRequest('DELETE', `/api/integrations/${integrationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/connected'] });
      toast({
        title: "Integration Removed",
        description: "The data source has been disconnected."
      });
    }
  });

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setCredentials({});
    setShowSetup(true);
  };

  const handleSubmitCredentials = () => {
    if (!selectedIntegration) return;

    // Validate required fields
    const missingFields = selectedIntegration.setupRequired.filter(field => !credentials[field]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    connectMutation.mutate({
      integrationType: selectedIntegration.id,
      credentials
    });
  };

  const isConnected = (integrationId: string) => {
    return connectedIntegrations.some(conn => conn.type === integrationId);
  };

  const getConnectedIntegration = (integrationId: string) => {
    return connectedIntegrations.find(conn => conn.type === integrationId);
  };

  if (loadingAvailable) {
    return (
      <GlassCard className="p-8 mb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading available integrations...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full mr-3">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Church Data Integration</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Connect your church management systems to get comprehensive analytics and insights
        </p>
      </div>

      {/* Setup Modal */}
      {showSetup && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Connect {selectedIntegration.name}
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              {selectedIntegration.description}
            </p>
            
            <div className="space-y-4">
              {selectedIntegration.setupRequired.map((field) => (
                <div key={field}>
                  <label className="text-gray-300 capitalize block text-sm font-medium mb-2">
                    {field.replace('_', ' ')}
                  </label>
                  <Input
                    type={field.includes('password') || field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                    value={credentials[field] || ''}
                    onChange={(e) => setCredentials(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder={`Enter your ${field.replace('_', ' ')}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleSubmitCredentials}
                disabled={connectMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {connectMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSetup(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Connected Data Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-green-800/20 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white capitalize">
                      {integration.type.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncMutation.mutate(integration.id)}
                      disabled={syncMutation.isPending}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-300">
                  <p>Data Types: {integration.dataTypes.join(', ')}</p>
                  <p className="mt-1">
                    Last Sync: {new Date(integration.lastSync).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableIntegrations.map((integration) => {
            const connected = isConnected(integration.id);
            const connectedData = getConnectedIntegration(integration.id);
            
            return (
              <div
                key={integration.id}
                className={`rounded-lg border p-6 transition-all ${
                  connected 
                    ? 'bg-green-800/10 border-green-500/30' 
                    : 'bg-gray-800/30 border-gray-600/30 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={integration.icon} 
                      alt={integration.name}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/integration-icon';
                      }}
                    />
                    <h4 className="font-semibold text-white">{integration.name}</h4>
                  </div>
                  {connected && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                <p className="text-gray-400 text-sm mb-4">
                  {integration.description}
                </p>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Data Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {integration.dataTypes.map((type) => (
                      <span
                        key={type}
                        className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded"
                      >
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                
                {connected ? (
                  <div className="text-green-400 text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Connected & Syncing
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Benefits */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="font-semibold text-blue-300 mb-2">📊 Integration Benefits</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Real-time attendance and engagement tracking</li>
          <li>• Comprehensive giving and donation analytics</li>
          <li>• Member growth and retention insights</li>
          <li>• Social media and online engagement metrics</li>
          <li>• AI-powered ministry recommendations</li>
          <li>• Automated reporting and trend analysis</li>
        </ul>
      </div>
    </GlassCard>
  );
}