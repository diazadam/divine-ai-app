import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
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
      content: "Hello! I'm Divine AI, your pastoral assistant. I can help you with sermon preparation, scripture study, podcast creation, and ministry guidance. What would you like to work on today?",
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
    <section id="dashboard" className="pt-24 pb-16 min-h-screen gradient-bg relative" data-testid="hero-section">
      {/* Animated Blob Shapes */}
      <div className="blob-shape blob-1"></div>
      <div className="blob-shape blob-2"></div>
      <div className="blob-shape blob-3"></div>
      
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white floating-animation">
            Divine AI
          </h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 font-light">
            Transform your ministry with AI-powered tools for extraordinary spiritual impact
          </p>
        </div>

        {/* AI Chat Interface */}
        <div className="chat-container glass-card rounded-3xl shadow-2xl">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                  <Bot className="text-white w-5 h-5" />
                </div>
                Divine Assistant
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-700 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-4 h-96 overflow-y-auto bg-gradient-to-b from-transparent to-white/50 rounded-2xl" data-testid="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.type === 'user' ? 'justify-end' : ''
                }`}
              >
                {msg.type === 'ai' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div
                  className={`message-bubble p-3 ${
                    msg.type === 'user'
                      ? 'user-message'
                      : 'ai-message'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                
                {msg.type === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="ai-message p-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-6 border-t border-white/20">
            <div className="flex space-x-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about ministry, sermons, or scripture..."
                className="flex-1 bg-white/50 border-white/30 backdrop-blur-sm rounded-2xl px-6 py-3 focus:bg-white/70 transition-all"
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !message.trim()}
                className="px-8 py-3 btn-gradient rounded-2xl font-semibold shadow-lg"
                data-testid="send-button"
              >
                {chatMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Quick Suggestions */}
          <div className="p-6 bg-gradient-to-b from-white/30 to-white/50 rounded-b-3xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: 'sermon_outline', text: 'Create a sermon outline on faith', icon: '📖' },
                { type: 'semantic_search', text: 'Find verses about hope', icon: '🔍' },
                { type: 'illustrations', text: 'Generate sermon illustrations', icon: '🎨' },
                { type: 'pastoral_guidance', text: 'Get pastoral guidance', icon: '💡' }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(action.text)}
                  className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl text-left hover:bg-white/90 transition-all border border-white/50 group card-hover"
                  data-testid={`action-${action.type}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="text-sm font-medium text-gray-800 group-hover:text-purple-700">
                      {action.text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}