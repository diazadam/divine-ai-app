import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  const quickTopics = [
    { icon: <Coffee className="w-4 h-4" />, text: "Favorite coffee recipes", topic: "Tell me about different coffee brewing methods and your favorite recipes" },
    { icon: <BookOpen className="w-4 h-4" />, text: "Book recommendations", topic: "Can you recommend some great books to read? I enjoy both fiction and non-fiction" },
    { icon: <Music className="w-4 h-4" />, text: "Music discovery", topic: "Help me discover new music genres and artists I might enjoy" },
    { icon: <Camera className="w-4 h-4" />, text: "Photography tips", topic: "I'm interested in photography. Can you give me some beginner tips?" },
    { icon: <Gamepad2 className="w-4 h-4" />, text: "Gaming chat", topic: "Let's talk about video games and what's trending lately" },
  ];

  return (
    <div className="min-h-screen bg-divine-gradient text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-celestial-900/50 via-transparent to-sacred-700/30"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 glow-text">Personal AI Companion</h1>
          <p className="text-gray-300">Your space to relax, explore interests, and have meaningful conversations</p>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto p-6 h-[calc(100vh-200px)] flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4" data-testid="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.type === 'user' ? 'bg-sacred-600' : 'bg-divine-600'
              }`}>
                {msg.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`max-w-md lg:max-w-2xl rounded-2xl p-4 ${
                msg.type === 'user'
                  ? 'bg-gradient-to-r from-sacred-600/50 to-sacred-700/50 border border-sacred-500/30'
                  : 'glass-effect'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-divine-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="glass-effect rounded-2xl p-4 max-w-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-divine-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Topics */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Or try one of these topics:</p>
            <div className="flex flex-wrap gap-2">
              {quickTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(topic.topic)}
                  className="glass-effect px-3 py-2 rounded-lg text-sm flex items-center space-x-2 hover:bg-white/10 transition-colors"
                  data-testid={`quick-topic-${index}`}
                >
                  {topic.icon}
                  <span>{topic.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0">
          <div className="glass-effect rounded-2xl p-4">
            <div className="flex space-x-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind, ask about hobbies, or just chat..."
                className="flex-1 bg-transparent border-none resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-0"
                rows={1}
                data-testid="chat-input"
                style={{ minHeight: '20px', maxHeight: '120px' }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || chatMutation.isPending}
                className="bg-gradient-to-r from-divine-600 to-sacred-600 hover:from-divine-500 hover:to-sacred-500 rounded-xl px-4"
                data-testid="send-message-button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}