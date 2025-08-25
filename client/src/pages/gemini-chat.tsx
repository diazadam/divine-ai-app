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
    <div className="min-h-screen pt-20 pb-8 gradient-bg relative" data-testid="gemini-chat-page">
      {/* Background Blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-400 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-400 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '3s' }}></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-white floating-animation">
            Personal AI Companion
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Your space to relax, explore interests, and have meaningful conversations
          </p>
        </div>

        {/* AI Chat Interface */}
        <div className="chat-container glass-card rounded-3xl shadow-2xl mb-8">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                  <Bot className="text-white w-5 h-5" />
                </div>
                Personal Assistant
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
          <div className="p-6 border-t border-white/20">
            <div className="flex space-x-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind, ask about anything..."
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
          
          {/* Quick Topics */}
          <div className="p-6 bg-gradient-to-b from-white/30 to-white/50 rounded-b-3xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Popular Topics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { text: "Recent scientific discoveries", icon: '🔬' },
                { text: "Plan a weekend getaway", icon: '✈️' },
                { text: "Book recommendations", icon: '📚' },
                { text: "Creative writing prompts", icon: '✍️' },
                { text: "Healthy recipe ideas", icon: '🥘' },
                { text: "Photography tips", icon: '📷' },
              ].map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(topic.text)}
                  className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl text-left hover:bg-white/90 transition-all border border-white/50 group card-hover"
                  data-testid={`topic-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="text-sm font-medium text-gray-800 group-hover:text-purple-700">
                      {topic.text}
                    </div>
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