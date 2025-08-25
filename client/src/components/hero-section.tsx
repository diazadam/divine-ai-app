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
    <section id="dashboard" className="pt-24 pb-16 bg-white min-h-screen" data-testid="hero-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-semibold mb-4 text-gray-900 floating-animation">
            Divine AI
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Your AI-powered pastoral assistant for sermon preparation, scripture study, and ministry enhancement.
          </p>
        </div>

        {/* AI Chat Interface */}
        <div className="chat-container bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bot className="text-blue-500 mr-2" />
                Divine AI Assistant
              </h3>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-4 h-80 overflow-y-auto" data-testid="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.type === 'user' ? 'justify-end' : ''
                }`}
              >
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
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
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="ai-message p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message Divine AI..."
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !message.trim()}
                className="px-6 bg-blue-500 hover:bg-blue-600"
                data-testid="send-button"
              >
                {chatMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Quick Suggestions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Try asking about:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { type: 'sermon_outline', text: 'Create a sermon outline on faith and perseverance' },
                { type: 'semantic_search', text: 'Find verses about hope and strength' },
                { type: 'illustrations', text: 'Generate sermon illustrations about overcoming adversity' },
                { type: 'pastoral_guidance', text: 'Provide guidance for supporting congregation members' }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(action.text)}
                  className="p-3 bg-white rounded-lg text-left hover:bg-blue-50 hover:border-blue-200 transition-all border border-gray-200 group"
                  data-testid={`action-${action.type}`}
                >
                  <div className="text-sm text-gray-700 group-hover:text-blue-700">
                    {action.text.length > 55 ? action.text.substring(0, 52) + '...' : action.text}
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