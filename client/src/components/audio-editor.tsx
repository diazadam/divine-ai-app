import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Scissors,
  Volume2,
  Download,
  FileAudio,
  Mic,
  RefreshCw,
  Loader2,
  FileText,
  Wand2,
  Save,
  Brain,
  Sparkles,
  MessageCircle,
  Edit3
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";

interface AudioEditorProps {
  className?: string;
}

interface TranscriptionResult {
  text: string;
  timestamp: string;
  confidence?: number;
}

interface AudioSegment {
  id: string;
  startTime: number;
  endTime: number;
  transcription?: string;
  voiceId?: string;
}

export default function AudioEditor({ className = '' }: AudioEditorProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [aiEnhancement, setAiEnhancement] = useState<string>("");
  const [theologicalAnalysis, setTheologicalAnalysis] = useState<string>("");

  // Advanced OpenAI Features
  const aiContentAnalysisMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/theology/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Analyze this audio transcription for theological content: ${text}`,
          includeHistorical: true,
          includeCitations: true
        })
      });
      return response.json();
    }
  });

  const aiTranscriptionEnhancementMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Enhance and improve this transcription for clarity and accuracy: ${text}`,
          type: 'pastoral_guidance',
          context: JSON.stringify({ purpose: 'audio_enhancement' })
        })
      });
      return response.json();
    }
  });

  const mcpAudioProcessingMutation = useMutation({
    mutationFn: async (audioFile: File) => {
      const formData = new FormData();
      formData.append('audio', audioFile);
      const response = await fetch('/api/mcp/audio-analysis', {
        method: 'POST',
        body: formData
      });
      return response.json();
    }
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  // Transcribe audio using the new ASR endpoint
  const transcribeAudio = async () => {
    if (!audioFile) {
      alert('Please select an audio file first');
      return;
    }

    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      console.log('🎤 Sending audio for transcription:', audioFile.name);
      
      const response = await fetch('/api/openai/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      const transcriptionResult: TranscriptionResult = {
        text: result.text || result.transcription || 'No transcription available',
        timestamp: new Date().toISOString(),
        confidence: result.confidence
      };

      setTranscription(transcriptionResult);
      
      // Create an initial segment with the full transcription
      const newSegment: AudioSegment = {
        id: 'segment-1',
        startTime: 0,
        endTime: duration || 300, // fallback to 5 minutes if duration not loaded
        transcription: transcriptionResult.text
      };
      
      setSegments([newSegment]);
      
    } catch (err) {
      console.error('Transcription error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Transcription failed: ${msg}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Audio player controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / canvas.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simple waveform drawing
  useEffect(() => {
    if (!canvasRef.current || !duration) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple waveform bars
    const barCount = 100;
    const barWidth = canvas.width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.random() * canvas.height * 0.8;
      
      // Gradient for bars
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#9333ea');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
    }

    // Draw progress line
    const progress = currentTime / duration;
    const progressX = progress * canvas.width;
    
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, canvas.height);
    ctx.stroke();

    // Draw segments
    segments.forEach((segment, index) => {
      const startX = (segment.startTime / duration) * canvas.width;
      const endX = (segment.endTime / duration) * canvas.width;
      
      ctx.fillStyle = selectedSegment === segment.id ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, canvas.height);
      
      // Segment borders
      ctx.strokeStyle = selectedSegment === segment.id ? '#22c55e' : '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, canvas.height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, canvas.height);
      ctx.stroke();
    });

  }, [currentTime, duration, segments, selectedSegment]);

  return (
    <div className={`bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6 rounded-3xl shadow-2xl border border-white/20 ${className}`}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <FileAudio className="w-8 h-8 mr-3 text-purple-400" />
          🎧 Audio Editor & Transcription
        </h2>
        <p className="text-purple-200">Upload audio, transcribe with OpenAI Whisper, and edit with advanced AI</p>
      </div>

      {/* File Upload Area */}
      {!audioFile && (
        <div 
          className="border-2 border-dashed border-purple-400/50 rounded-3xl p-12 text-center hover:border-purple-400 transition-all duration-300 bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-white">Upload Audio File</h3>
          <p className="text-purple-200 mb-6 text-lg">Supports MP3, WAV, M4A, and other audio formats</p>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg">
            <Upload className="w-5 h-5 mr-2" />
            Choose Audio File
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Audio Editor Interface */}
      {audioFile && (
        <div className="space-y-8">
          {/* Audio Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{audioFile.name}</h3>
                <p className="text-purple-200 text-sm">Size: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Duration: {formatTime(duration)}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  ✅ Loaded
                </Badge>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="text-purple-300 border-purple-400/30 hover:bg-purple-500/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Replace
                </Button>
              </div>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Waveform Timeline</h3>
              <div className="flex items-center space-x-2 text-sm text-purple-200">
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              width={800}
              height={120}
              className="w-full h-24 bg-black/30 rounded-xl cursor-pointer border border-white/10"
              onClick={handleSeek}
            />
            
            <div className="flex items-center justify-center space-x-4 mt-6">
              <Button
                onClick={togglePlayPause}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* ASR Transcription */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Mic className="w-6 h-6 mr-3 text-green-400" />
                🤖 OpenAI Whisper Transcription
              </h3>
              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Start Transcription
                  </>
                )}
              </Button>
            </div>

            {isTranscribing && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-white font-bold">Processing with OpenAI Whisper-1</p>
                    <p className="text-blue-200 text-sm">Converting speech to text using OpenAI's most advanced ASR...</p>
                  </div>
                </div>
              </div>
            )}

            {transcription && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white">Transcription Result</h4>
                    <p className="text-green-200 text-sm">
                      Generated: {new Date(transcription.timestamp).toLocaleString()}
                      {transcription.confidence && ` • Confidence: ${(transcription.confidence * 100).toFixed(1)}%`}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    ✅ Complete
                  </Badge>
                </div>
                
                <Textarea
                  value={transcription.text}
                  onChange={(e) => setTranscription({ ...transcription, text: e.target.value })}
                  rows={6}
                  className="text-base p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-green-200/70 rounded-xl shadow-lg focus:shadow-green-500/30 focus:border-green-400 transition-all duration-300"
                  placeholder="Your transcription will appear here..."
                />
                
                <div className="flex items-center space-x-3 mt-4">
                  <Button
                    onClick={() => navigator.clipboard.writeText(transcription.text)}
                    variant="outline"
                    className="text-green-300 border-green-400/30 hover:bg-green-500/20"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const blob = new Blob([transcription.text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${audioFile.name}-transcription.txt`;
                      a.click();
                    }}
                    variant="outline"
                    className="text-green-300 border-green-400/30 hover:bg-green-500/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Audio Segments */}
          {segments.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Scissors className="w-6 h-6 mr-3 text-orange-400" />
                  Audio Segments
                </h3>
                <Button
                  onClick={() => {
                    // Add logic to create new segment at current time
                    const newSegment: AudioSegment = {
                      id: `segment-${segments.length + 1}`,
                      startTime: currentTime,
                      endTime: Math.min(currentTime + 30, duration),
                      transcription: ''
                    };
                    setSegments([...segments, newSegment]);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg"
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  Split Here
                </Button>
              </div>

              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedSegment === segment.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white">Segment {index + 1}</h4>
                        <p className="text-sm text-purple-200">
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                          {' '}({formatTime(segment.endTime - segment.startTime)} duration)
                        </p>
                      </div>
                      {selectedSegment === segment.id && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    {segment.transcription && (
                      <p className="text-sm text-white/80 mt-2 bg-black/20 rounded-lg p-3">
                        "{segment.transcription}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced OpenAI Features */}
          {transcription && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-purple-400" />
                🤖 OpenAI Enhanced Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Theological Analysis */}
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">📜</span>
                    </div>
                    <h4 className="font-bold text-white mb-2">Theological Analysis</h4>
                    <p className="text-purple-200 text-sm mb-4">GPT-4 powered biblical insights from your audio content</p>
                    <Button 
                      onClick={() => aiContentAnalysisMutation.mutate(transcription.text)}
                      disabled={aiContentAnalysisMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/30"
                    >
                      {aiContentAnalysisMutation.isPending ? 'Analyzing...' : 'Analyze Content'}
                    </Button>
                  </div>
                </div>

                {/* Transcription Enhancement */}
                <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">✨</span>
                    </div>
                    <h4 className="font-bold text-white mb-2">AI Enhancement</h4>
                    <p className="text-green-200 text-sm mb-4">Improve transcription clarity and accuracy with AI</p>
                    <Button 
                      onClick={() => aiTranscriptionEnhancementMutation.mutate(transcription.text)}
                      disabled={aiTranscriptionEnhancementMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/30"
                    >
                      {aiTranscriptionEnhancementMutation.isPending ? 'Enhancing...' : 'Enhance Text'}
                    </Button>
                  </div>
                </div>

                {/* MCP Audio Processing */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <span className="text-white text-2xl">🎙️</span>
                    </div>
                    <h4 className="font-bold text-white mb-2">Audio Analysis</h4>
                    <p className="text-amber-200 text-sm mb-4">Advanced MCP audio processing and insights</p>
                    <Button 
                      onClick={() => mcpAudioProcessingMutation.mutate(audioFile!)}
                      disabled={mcpAudioProcessingMutation.isPending}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-amber-500/30"
                    >
                      {mcpAudioProcessingMutation.isPending ? 'Processing...' : 'Analyze Audio'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* AI Results Display */}
              {(aiContentAnalysisMutation.data || aiTranscriptionEnhancementMutation.data) && (
                <div className="mt-6 space-y-4">
                  {aiContentAnalysisMutation.data && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-xl p-6">
                      <h5 className="font-bold text-white mb-3 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-purple-400" />
                        Theological Analysis Results
                      </h5>
                      <Textarea
                        value={JSON.stringify(aiContentAnalysisMutation.data, null, 2)}
                        readOnly
                        rows={6}
                        className="text-sm p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white rounded-xl"
                      />
                    </div>
                  )}
                  
                  {aiTranscriptionEnhancementMutation.data && (
                    <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-400/30 rounded-xl p-6">
                      <h5 className="font-bold text-white mb-3 flex items-center">
                        <Edit3 className="w-5 h-5 mr-2 text-green-400" />
                        Enhanced Transcription
                      </h5>
                      <Textarea
                        value={aiTranscriptionEnhancementMutation.data.response || ''}
                        onChange={(e) => setTranscription({ ...transcription, text: e.target.value })}
                        rows={6}
                        className="text-base p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white rounded-xl"
                      />
                      <Button
                        onClick={() => setTranscription({ ...transcription, text: aiTranscriptionEnhancementMutation.data.response || transcription.text })}
                        className="mt-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white px-4 py-2 rounded-xl"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Apply Enhancement
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export Options */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Save className="w-6 h-6 mr-3 text-yellow-400" />
              Export Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/20 p-4 h-auto flex-col"
              >
                <FileText className="w-6 h-6 mb-2" />
                <span className="font-bold">Export SRT</span>
                <span className="text-xs opacity-70">Subtitle file</span>
              </Button>
              
              <Button
                variant="outline"
                className="text-purple-300 border-purple-400/30 hover:bg-purple-500/20 p-4 h-auto flex-col"
              >
                <FileAudio className="w-6 h-6 mb-2" />
                <span className="font-bold">Export Audio</span>
                <span className="text-xs opacity-70">Processed MP3</span>
              </Button>
              
              <Button
                variant="outline"
                className="text-green-300 border-green-400/30 hover:bg-green-500/20 p-4 h-auto flex-col"
              >
                <Download className="w-6 h-6 mb-2" />
                <span className="font-bold">Export JSON</span>
                <span className="text-xs opacity-70">Project file</span>
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
