import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Podcast as PodcastType } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronLeft,
    CloudUpload,
    Download,
    FileText,
    History,
    Play,
    Podcast,
    Users,
    Volume2,
    Wand2,
    Youtube
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// ONLY YOUR 9 ELEVENLABS VOICES - NO OTHER VOICES!
const ELEVENLABS_VOICES = [
  { id: 'QTGiyJvep6bcx4WD1qAq', name: 'Brad', description: 'Professional Documentary Narrator', gender: 'male', avatar: '👨‍💼' },
  { id: 'uYXf8XasLslADfZ2MB4u', name: 'Hope', description: 'Perfect Podcast Host Voice', gender: 'female', avatar: '✨' },
  { id: 'Dslrhjl3ZpzrctukrQSN', name: 'Will', description: 'Confident Rock & Roll Voice', gender: 'male', avatar: '💪' },
  { id: 'zGjIP4SZlMnY9m93k97r', name: 'Sarah', description: 'Clear Gentle Female Voice', gender: 'female', avatar: '👩‍🦰' },
  { id: 'Cb8NLd0sUB8jI4MW2f9M', name: 'Jedediah', description: 'Southern Pastoral Voice', gender: 'male', avatar: '📿' },
  { id: '6xPz2opT0y5qtoRh1U1Y', name: 'Christian', description: 'Confident Middle-Aged Male', gender: 'male', avatar: '🙏' },
  { id: 'wyWA56cQNU2KqUW4eCsI', name: 'Clyde', description: 'Authoritative Male Voice', gender: 'male', avatar: '🗣️' },
  { id: '4YYIPFl9wE5c4L2eu2Gb', name: 'Burt', description: 'Warm Male Narrator', gender: 'male', avatar: '🤗' },
  { id: 'xctasy8XvGp2cVO9HL9k', name: 'Allison', description: 'Fun Millennial Female Voice', gender: 'female', avatar: '💼' }
];

export default function PodcastStudio() {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [numHosts, setNumHosts] = useState(1);
  
  // Initialize with ONLY ElevenLabs voices
  const [hosts, setHosts] = useState([
    { name: "Pastor", voice: ELEVENLABS_VOICES[0], gender: ELEVENLABS_VOICES[0].gender },
    { name: "Guest", voice: ELEVENLABS_VOICES[1], gender: ELEVENLABS_VOICES[1].gender },
    { name: "Narrator", voice: ELEVENLABS_VOICES[2], gender: ELEVENLABS_VOICES[2].gender }
  ]);
  
  const [showLibrary, setShowLibrary] = useState(false);

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery<PodcastType[]>({
    queryKey: ['/api/podcasts'],
  });

  const generatePodcastMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🎙️ Generating podcast with data:', data);
      const response = await fetch('/api/podcasts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate podcast');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/podcasts'] });
      setShowLibrary(true);
      setStep(1);
      setContentType("");
    },
  });

  const handleGenerate = () => {
    const selectedHosts = hosts.slice(0, numHosts);
    
    let data: any = {
      title,
      description,
      useElevenLabs: true,
      hosts: selectedHosts.map(h => ({
        name: h.name,
        voice: h.voice.id,
        voiceName: h.voice.name,
        gender: h.voice.gender
      }))
    };

    console.log('🎙️ ElevenLabs voices being sent:', selectedHosts.map(h => `${h.name}: ${h.voice.name} (${h.voice.id})`));

    switch (contentType) {
      case 'youtube':
        data.type = 'youtube';
        data.youtubeUrl = youtubeUrl;
        break;
      case 'script':
        data.type = 'script';
        data.script = scriptContent;
        break;
      case 'ai':
        data.type = 'ai-generate';
        data.prompt = aiPrompt;
        break;
      default:
        return;
    }

    generatePodcastMutation.mutate(data);
  };

  const canGenerate = () => {
    if (!title.trim()) return false;
    switch (contentType) {
      case 'youtube': return youtubeUrl.trim().length > 0;
      case 'script': return scriptContent.trim().length > 0;
      case 'ai': return aiPrompt.trim().length > 0;
      default: return false;
    }
  };

  const selectVoice = (hostIndex: number, voice: any) => {
    const newHosts = [...hosts];
    newHosts[hostIndex] = {
      ...newHosts[hostIndex],
      voice: voice,
      gender: voice.gender
    };
    setHosts(newHosts);
    console.log(`✅ Host ${hostIndex + 1} voice set to: ${voice.name} (${voice.id})`);
  };

  const playVoicePreview = (voice: any) => {
    console.log(`🔊 Playing preview for ElevenLabs voice: ${voice.name} (${voice.id})`);
    
    // Enhanced browser speech synthesis preview
    const utterance = new SpeechSynthesisUtterance(`Hello, I'm ${voice.name}. This is a preview of your premium ElevenLabs voice for podcast creation!`);
    
    const voices = speechSynthesis.getVoices();
    let selectedVoice;
    
    if (voice.gender === 'female') {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('alex') ||
        v.name.toLowerCase().includes('female')
      );
    } else {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('male')
      );
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = voice.gender === 'female' ? 1.1 : 0.9;
    
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  return (
    <section className="pt-24 pb-16 min-h-screen relative overflow-hidden">
      {/* Stunning Pink Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-rose-500/25 rounded-full blur-lg animate-pulse"></div>
        
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-pink-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center space-x-2 text-pink-100 hover:text-white transition-all duration-300 mb-6 group">
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="font-medium">Back to Home</span>
            </button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-200 via-rose-300 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl">
              ✨ AI Podcast Studio ✨
            </h1>
            <p className="text-pink-100 text-xl font-medium mb-4 drop-shadow-lg">Create breathtaking podcasts with premium ElevenLabs voices</p>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto rounded-full shadow-lg shadow-pink-500/50"></div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl shadow-pink-500/20">
            <button 
              onClick={() => setShowLibrary(false)}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                !showLibrary 
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30" 
                  : "text-pink-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <Wand2 className="w-4 h-4 mr-2 inline" />
              ✨ Create Podcast
            </button>
            <button 
              onClick={() => setShowLibrary(true)}
              className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                showLibrary 
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30" 
                  : "text-pink-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <History className="w-4 h-4 mr-2 inline" />
              🎧 My Podcasts
            </button>
          </div>
        </div>

        {/* LIBRARY VIEW */}
        {showLibrary && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">🎧 Your Podcast Library</h2>
              <button 
                onClick={() => {
                  setShowLibrary(false);
                  setStep(1);
                  setContentType("");
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-6 py-3 font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 rounded-2xl border border-white/20 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                ✨ Create New
              </button>
            </div>

            {podcasts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {podcasts.map((podcast) => (
                  <div key={podcast.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 border-none text-white font-bold">
                        ✅ Ready
                      </Badge>
                      <div className="flex space-x-2">
                        <button className="bg-white/10 hover:bg-green-500/20 text-pink-100 hover:text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-green-500/30 p-2">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="bg-white/10 hover:bg-blue-500/20 text-pink-100 hover:text-white transition-all duration-300 rounded-xl shadow-lg hover:shadow-blue-500/30 p-2">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 drop-shadow-lg">{podcast.title}</h3>
                    <p className="text-pink-100/80 mb-4">🕒 20:00</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                  <Podcast className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">🎙️ No podcasts yet</h3>
                <p className="text-pink-100/90 mb-10 text-lg">Create your first AI-powered podcast!</p>
                <button
                  onClick={() => {
                    setShowLibrary(false);
                    setStep(1);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-12 py-4 text-xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-2xl border border-white/20 text-white"
                >
                  <Wand2 className="w-6 h-6 mr-3" />
                  ✨ Create Your First Podcast
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREATE VIEW */}
        {!showLibrary && (
          <div className="space-y-8">
            {/* Step 1: Choose Content Type */}
            {step === 1 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-5xl mx-auto shadow-2xl shadow-pink-500/20">
                <h2 className="text-3xl font-bold mb-8 text-center text-white drop-shadow-lg">
                  🎙️ How do you want to create your podcast?
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Upload Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "upload" 
                        ? "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border-2 border-emerald-400 shadow-xl shadow-emerald-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-400/50"
                    }`}
                    onClick={() => setContentType("upload")}
                  >
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CloudUpload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">📁 Upload File</h3>
                    <p className="text-sm text-pink-100/80">Upload audio or video file</p>
                  </button>

                  {/* YouTube Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "youtube" 
                        ? "bg-gradient-to-br from-red-400/20 to-rose-500/20 border-2 border-red-400 shadow-xl shadow-red-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-400/50"
                    }`}
                    onClick={() => setContentType("youtube")}
                  >
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Youtube className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">🎥 YouTube Video</h3>
                    <p className="text-sm text-pink-100/80">Convert YouTube content</p>
                  </button>

                  {/* Script Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "script" 
                        ? "bg-gradient-to-br from-blue-400/20 to-cyan-500/20 border-2 border-blue-400 shadow-xl shadow-blue-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-400/50"
                    }`}
                    onClick={() => setContentType("script")}
                  >
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">✍️ Write Script</h3>
                    <p className="text-sm text-pink-100/80">Type your own content</p>
                  </button>

                  {/* AI Generate Option */}
                  <button 
                    className={`cursor-pointer transition-all duration-300 hover:scale-110 hover:-translate-y-2 p-6 text-center backdrop-blur-sm rounded-2xl ${
                      contentType === "ai" 
                        ? "bg-gradient-to-br from-purple-400/20 to-fuchsia-500/20 border-2 border-purple-400 shadow-xl shadow-purple-500/30" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50"
                    }`}
                    onClick={() => setContentType("ai")}
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                      <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold mb-2 text-white text-lg">🤖 AI Generate</h3>
                    <p className="text-sm text-pink-100/80">Describe your idea</p>
                  </button>
                </div>

                {contentType && (
                  <div className="mt-10 text-center">
                    <button 
                      onClick={() => setStep(2)}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-12 py-4 text-lg font-bold shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 transition-all duration-300 hover:scale-105 rounded-2xl border border-white/20 text-white"
                    >
                      ✨ Continue to Content ✨
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Add Content */}
            {step === 2 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-5xl mx-auto shadow-2xl shadow-pink-500/20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-pink-100 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                  </button>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">✨ Add Your Content ✨</h2>
                  <div></div>
                </div>

                <div className="space-y-8">
                  {contentType === "upload" && (
                    <div className="border-2 border-dashed border-emerald-400/50 rounded-3xl p-16 text-center hover:border-emerald-400 transition-all duration-300 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm">
                      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                        <CloudUpload className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">📁 Upload Your Audio or Video</h3>
                      <p className="text-pink-100/90 mb-8 text-lg">Supports MP3, MP4, WAV, and more formats</p>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTitle(file.name.replace(/\.[^/.]+$/, ""));
                            setStep(3);
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-12 py-4 rounded-2xl cursor-pointer inline-block font-bold transition-all duration-300 hover:scale-105 shadow-2xl shadow-emerald-500/40 border border-white/20"
                      >
                        🚀 Choose File
                      </label>
                    </div>
                  )}

                  {contentType === "youtube" && (
                    <div className="space-y-6 bg-gradient-to-br from-red-500/5 to-rose-500/5 backdrop-blur-sm rounded-3xl p-8 border border-red-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Youtube className="w-6 h-6 text-white" />
                        </div>
                        🎥 YouTube Video URL
                      </h3>
                      <Input
                        type="url"
                        placeholder="🔗 Paste YouTube URL here: https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="text-lg p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-red-500/30 focus:border-red-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {contentType === "script" && (
                    <div className="space-y-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        ✍️ Podcast Script
                      </h3>
                      <Textarea
                        rows={12}
                        placeholder="✨ Write your podcast script here..."
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        className="text-base p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-blue-500/30 focus:border-blue-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {contentType === "ai" && (
                    <div className="space-y-6 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/20">
                      <h3 className="text-2xl font-bold flex items-center text-white drop-shadow-lg">
                        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-pulse">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        🤖 Describe Your Podcast
                      </h3>
                      <Textarea
                        rows={10}
                        placeholder="🎙️ Tell the AI what kind of podcast you want to create..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="text-base p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-2xl shadow-lg focus:shadow-purple-500/30 focus:border-purple-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div>
                      <label className="block text-lg font-bold mb-3 text-white drop-shadow-lg">🎵 Episode Title</label>
                      <Input
                        placeholder="Enter your amazing podcast title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-bold mb-3 text-white drop-shadow-lg">📝 Description (Optional)</label>
                      <Input
                        placeholder="Brief description of your episode..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-lg p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-10">
                    <button 
                      onClick={() => setStep(3)}
                      disabled={!title.trim() || (contentType !== "upload" && !canGenerate())}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 px-16 py-5 text-xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-2xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      🎙️ Next: Choose ElevenLabs Voices ✨
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Choose ONLY ElevenLabs Voices */}
            {step === 3 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-6xl mx-auto shadow-2xl shadow-pink-500/20">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setStep(2)}
                    className="text-pink-100 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                  </button>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">🎙️ Choose Your ElevenLabs Voices ✨</h2>
                  <div></div>
                </div>

                {/* Number of Hosts */}
                <div className="mb-10">
                  <h3 className="text-2xl font-bold mb-6 text-center text-white drop-shadow-lg">👥 How many hosts do you want?</h3>
                  <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        className={`cursor-pointer transition-all duration-300 hover:scale-110 p-6 text-center backdrop-blur-sm rounded-2xl ${
                          numHosts === num 
                            ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-400 shadow-xl shadow-pink-500/30" 
                            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-400/50"
                        }`}
                        onClick={() => setNumHosts(num)}
                      >
                        <div className="bg-gradient-to-br from-pink-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">{num} Host{num > 1 ? 's' : ''}</span>
                        <p className="text-sm text-pink-100/80 mt-2">
                          {num === 1 ? "Solo narrator" : num === 2 ? "Conversation" : "Panel discussion"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Host Configuration with ElevenLabs Voice Selection */}
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-center text-white drop-shadow-lg">🎤 Choose ElevenLabs Voices for Each Host</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: numHosts }, (_, hostIndex) => (
                      <div key={hostIndex} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                        <div className="text-center mb-6">
                          <div className="text-6xl mb-4">{hosts[hostIndex]?.voice?.avatar || '🎙️'}</div>
                          <h4 className="text-xl font-bold text-white drop-shadow-lg">Host {hostIndex + 1}</h4>
                          <p className="text-pink-200 font-bold">{hosts[hostIndex]?.voice?.name || 'Select Voice'}</p>
                          <p className="text-xs text-green-300">✅ ElevenLabs Premium</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold mb-2 text-pink-200">✨ Host Name</label>
                            <Input
                              placeholder="Enter host name..."
                              value={hosts[hostIndex]?.name || ''}
                              onChange={(e) => {
                                const newHosts = [...hosts];
                                newHosts[hostIndex] = { ...newHosts[hostIndex], name: e.target.value };
                                setHosts(newHosts);
                              }}
                              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-pink-200/70 rounded-xl shadow-lg focus:shadow-pink-500/30 focus:border-pink-400 transition-all duration-300"
                            />
                          </div>

                          {/* ElevenLabs Voice Selection Grid */}
                          <div>
                            <label className="block text-sm font-bold mb-3 text-pink-200">🎵 Choose ElevenLabs Voice</label>
                            
                            {/* Current Selection Display */}
                            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-4 mb-4 text-center">
                              <div className="text-4xl mb-2">{hosts[hostIndex]?.voice?.avatar}</div>
                              <h5 className="font-bold text-white text-lg">{hosts[hostIndex]?.voice?.name}</h5>
                              <p className="text-pink-200 text-sm">{hosts[hostIndex]?.voice?.description}</p>
                              <p className="text-green-300 text-xs mt-2">✅ ElevenLabs ID: {hosts[hostIndex]?.voice?.id}</p>
                            </div>

                            {/* Voice Selection Grid - All 9 ElevenLabs Voices */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              {ELEVENLABS_VOICES.map((voice) => {
                                const isSelected = hosts[hostIndex]?.voice?.id === voice.id;
                                return (
                                  <button
                                    key={voice.id}
                                    onClick={() => selectVoice(hostIndex, voice)}
                                    className={`p-3 rounded-xl text-center transition-all duration-300 border ${
                                      isSelected 
                                        ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 shadow-lg shadow-green-500/30" 
                                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50"
                                    }`}
                                  >
                                    <div className="text-2xl mb-1">{voice.avatar}</div>
                                    <p className="text-white text-xs font-bold">{voice.name}</p>
                                    <p className="text-pink-200 text-xs">{voice.gender}</p>
                                    {isSelected && (
                                      <div className="text-green-400 text-xs mt-1">✅ Selected</div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button 
                              className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 rounded-xl shadow-lg hover:shadow-purple-500/30 p-3 font-bold"
                              onClick={() => playVoicePreview(hosts[hostIndex]?.voice)}
                            >
                              <Volume2 className="w-4 h-4 mr-2 inline" />
                              🔊 Preview {hosts[hostIndex]?.voice?.name}'s Voice
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mt-12">
                  <button 
                    onClick={handleGenerate}
                    disabled={generatePodcastMutation.isPending || !canGenerate()}
                    className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 px-16 py-6 text-2xl font-bold shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 rounded-3xl border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <Wand2 className="w-8 h-8 mr-4 inline" />
                    {generatePodcastMutation.isPending ? '🎧 Creating with ElevenLabs...' : '🚀 Generate Podcast with ElevenLabs! ✨'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}