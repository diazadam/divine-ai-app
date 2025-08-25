import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function HeroSection() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome to the Divine AI Ministry Platform. This advanced theological AI system provides comprehensive ministry support through:\n\n• **Advanced Sermon Architecture** - Multi-layered outlines with exegetical depth and theological precision\n• **Semantic Scripture Analysis** - Intelligent verse discovery based on thematic and conceptual relevance\n• **Narrative Construction** - Professional illustration development for maximum congregational impact\n• **Audio Content Transformation** - Sophisticated podcast script generation with delivery optimization\n• **Visual Media Engineering** - Professional-grade visual prompt development for sermon graphics\n• **Pastoral Intelligence** - Context-aware guidance grounded in biblical scholarship\n\nInitiate your ministry enhancement protocol. What theological or creative challenge requires assistance?",
      timestamp: new Date(),
    }
  ]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Intelligent AI type detection based on message content
      let type = '';
      let context = '';
      
      if (message.toLowerCase().includes('sermon') && (message.toLowerCase().includes('outline') || message.toLowerCase().includes('structure'))) {
        type = 'sermon_outline';
        context = JSON.stringify({ topic: message, scripture: '' });
      } else if (message.toLowerCase().includes('scripture') || message.toLowerCase().includes('verse') || message.toLowerCase().includes('bible')) {
        type = 'semantic_search';
      } else if (message.toLowerCase().includes('illustration') || message.toLowerCase().includes('story') || message.toLowerCase().includes('example')) {
        type = 'illustrations';
        context = JSON.stringify({ theme: message, audience: 'general' });
      } else if (message.toLowerCase().includes('podcast') || message.toLowerCase().includes('audio')) {
        type = 'podcast_script';
      } else if (message.toLowerCase().includes('image') || message.toLowerCase().includes('visual') || message.toLowerCase().includes('graphic')) {
        type = 'visual_prompts';
        context = JSON.stringify({ style: 'inspirational' });
      } else if (message.toLowerCase().includes('guidance') || message.toLowerCase().includes('help') || message.toLowerCase().includes('advice')) {
        type = 'pastoral_guidance';
      }

      const response = await apiRequest('POST', '/api/chat', { 
        message, 
        context: context || 'This is a pastoral ministry context for sermon preparation and biblical study.',
        type 
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: typeof data.response === 'object' ? JSON.stringify(data.response, null, 2) : data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section id="dashboard" className="pt-24 pb-16 relative" data-testid="hero-section">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="hero-title font-bold mb-6 bg-gradient-to-r from-divine-500 to-sacred-500 bg-clip-text text-transparent floating-animation">
            Revolutionary Pastoral AI
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your ministry with cutting-edge AI technology. Create compelling sermons, generate stunning visuals, and engage your congregation like never before.
          </p>
          
          {/* AI Chat Interface */}
          <GlassCard className="max-w-4xl mx-auto p-8 premium-shadow">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Bot className="text-divine-500 mr-2" />
                  Ministry Intelligence System
                </h3>
                <div className="flex space-x-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm text-gray-400">OPERATIONAL</span>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="space-y-4 mb-6 h-64 overflow-y-auto" data-testid="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${
                      msg.type === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 bg-divine-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg p-3 max-w-md ${
                        msg.type === 'user'
                          ? 'bg-sacred-600/50'
                          : 'bg-celestial-800/50'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.type === 'ai' && msg.id === '3' && (
                        <div className="mt-2 space-y-1">
                          <span className="inline-block bg-divine-600/30 text-xs px-2 py-1 rounded">Romans 15:13</span>
                          <span className="inline-block bg-divine-600/30 text-xs px-2 py-1 rounded ml-1">Jeremiah 29:11</span>
                          <span className="inline-block bg-divine-600/30 text-xs px-2 py-1 rounded ml-1">Psalm 42:11</span>
                        </div>
                      )}
                    </div>
                    
                    {msg.type === 'user' && (
                      <div className="w-8 h-8 bg-divine-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-divine-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-celestial-800/50 rounded-lg p-3 max-w-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Professional Action Commands */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {[
                  { text: "Generate comprehensive sermon architecture for faith resilience", category: "SERMON DEVELOPMENT", type: "sermon" },
                  { text: "Execute semantic scripture analysis for hope-based themes", category: "BIBLICAL RESEARCH", type: "scripture" },
                  { text: "Construct narrative illustrations for grace-centered messaging", category: "CONTENT CREATION", type: "illustration" },
                  { text: "Process sermon content into optimized podcast format", category: "MEDIA PRODUCTION", type: "podcast" },
                  { text: "Engineer visual prompts for high-impact sermon graphics", category: "DESIGN SYSTEMS", type: "visual" },
                  { text: "Access pastoral intelligence for leadership strategies", category: "STRATEGIC GUIDANCE", type: "guidance" },
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(action.text)}
                    className="glass-effect p-4 rounded-lg text-left hover:bg-white/10 transition-all group border border-white/5 hover:border-divine-500/30"
                    data-testid={`action-${action.type}`}
                  >
                    <div className="text-xs text-divine-400 font-bold mb-1 tracking-wide uppercase">
                      {action.category}
                    </div>
                    <div className="text-sm text-gray-100 leading-tight font-medium">
                      {action.text.length > 60 ? action.text.substring(0, 57) + '...' : action.text}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Chat Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Specify your ministry enhancement requirements: sermon architecture, biblical analysis, content development, or strategic guidance..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-celestial-900/50 border border-white/10 rounded-xl py-4 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-divine-500 transition-all"
                  data-testid="chat-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || chatMutation.isPending}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-divine-600 hover:bg-divine-500 rounded-lg p-2 transition-colors"
                  size="icon"
                  data-testid="send-message-button"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
