import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Coffee, BookOpen, Music, Camera, Gamepad2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function GeminiChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Welcome to your personal AI companion! I'm here to chat about anything that interests you - hobbies, books, music, travel, cooking, or just life in general. What's on your mind today?",
      timestamp: new Date(),
    }
  ]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat', { 
        message, 
        context: "This is a casual conversation for relaxation and personal interests, not ministry-related." 
      });
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response,
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
    <div className="min-h-screen pt-20 pb-8 bg-white" data-testid="gemini-chat-page">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold mb-4 text-gray-900">
            Personal AI Companion
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your space to relax, explore interests, and have meaningful conversations
          </p>
        </div>

        {/* AI Chat Interface */}
        <div className="chat-container bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Bot className="text-blue-500 mr-2" />
                Personal Assistant
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
                placeholder="Share what's on your mind, ask about anything..."
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
          
          {/* Quick Topics */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Or try one of these topics:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Tell me about recent scientific discoveries",
                "Help me plan a weekend getaway",
                "What's a good book recommendation?",
                "Creative writing prompts for inspiration",
                "Healthy recipe ideas for dinner",
                "Photography tips for beginners",
              ].map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(topic)}
                  className="p-3 bg-white rounded-lg text-left hover:bg-blue-50 hover:border-blue-200 transition-all border border-gray-200 group"
                  data-testid={`topic-${index}`}
                >
                  <div className="text-sm text-gray-700 group-hover:text-blue-700">
                    {topic}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}