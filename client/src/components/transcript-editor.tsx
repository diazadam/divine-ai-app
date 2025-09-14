import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Edit3,
  Save,
  Download,
  Upload,
  Search,
  Replace,
  Clock,
  Mic,
  Speaker,
  Volume2,
  Settings,
  Copy,
  FileText,
  Zap,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Tag,
  Users,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  speaker: string;
  text: string;
  confidence?: number;
  isEditing?: boolean;
  tags?: string[];
  notes?: string;
}

interface TranscriptEditorProps {
  audioUrl: string;
  initialTranscript?: TranscriptSegment[];
  onSave?: (transcript: TranscriptSegment[]) => void;
  onExport?: (format: 'txt' | 'srt' | 'vtt' | 'json') => void;
}

const SPEAKER_COLORS = [
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600', 
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
  'from-indigo-500 to-purple-600'
];

export default function TranscriptEditor({
  audioUrl,
  initialTranscript = [],
  onSave,
  onExport
}: TranscriptEditorProps) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(initialTranscript);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [speakers, setSpeakers] = useState<string[]>(['Host', 'Guest']);
  const [currentSpeaker, setCurrentSpeaker] = useState('Host');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to current segment
  useEffect(() => {
    if (isAutoScroll && isPlaying) {
      const currentSegment = transcript.find(seg => 
        currentTime >= seg.startTime && currentTime <= seg.endTime
      );
      
      if (currentSegment && segmentRefs.current[currentSegment.id]) {
        segmentRefs.current[currentSegment.id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentTime, isAutoScroll, isPlaying, transcript]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const jumpToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const changePlaybackSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  // Generate transcript using AI (mock implementation)
  const generateTranscript = async () => {
    setIsGeneratingTranscript(true);
    
    // Simulate AI transcription
    setTimeout(() => {
      const mockTranscript: TranscriptSegment[] = [
        {
          id: 'seg1',
          startTime: 0,
          endTime: 5,
          speaker: 'Host',
          text: 'Welcome to today\'s podcast. I\'m excited to have our special guest with us.',
          confidence: 0.95
        },
        {
          id: 'seg2',
          startTime: 5,
          endTime: 12,
          speaker: 'Guest',
          text: 'Thank you for having me. I\'m thrilled to be here to discuss this important topic.',
          confidence: 0.92
        },
        {
          id: 'seg3',
          startTime: 12,
          endTime: 20,
          speaker: 'Host',
          text: 'Let\'s dive right in. Can you tell our listeners about your background and expertise?',
          confidence: 0.88
        }
      ];
      
      setTranscript(mockTranscript);
      setIsGeneratingTranscript(false);
    }, 3000);
  };

  // Add new segment
  const addSegment = () => {
    const newSegment: TranscriptSegment = {
      id: `seg-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 5,
      speaker: currentSpeaker,
      text: '',
      isEditing: true
    };
    
    // Insert at correct position based on time
    const insertIndex = transcript.findIndex(seg => seg.startTime > currentTime);
    const newTranscript = [...transcript];
    
    if (insertIndex === -1) {
      newTranscript.push(newSegment);
    } else {
      newTranscript.splice(insertIndex, 0, newSegment);
    }
    
    setTranscript(newTranscript);
    setSelectedSegment(newSegment.id);
  };

  // Update segment
  const updateSegment = (id: string, updates: Partial<TranscriptSegment>) => {
    setTranscript(transcript.map(seg =>
      seg.id === id ? { ...seg, ...updates } : seg
    ));
  };

  // Delete segment
  const deleteSegment = (id: string) => {
    setTranscript(transcript.filter(seg => seg.id !== id));
    if (selectedSegment === id) {
      setSelectedSegment(null);
    }
  };

  // Merge segments
  const mergeWithNext = (id: string) => {
    const index = transcript.findIndex(seg => seg.id === id);
    if (index < transcript.length - 1) {
      const current = transcript[index];
      const next = transcript[index + 1];
      
      const merged = {
        ...current,
        endTime: next.endTime,
        text: `${current.text} ${next.text}`
      };
      
      const newTranscript = [...transcript];
      newTranscript[index] = merged;
      newTranscript.splice(index + 1, 1);
      setTranscript(newTranscript);
    }
  };

  // Split segment at current time
  const splitSegment = (id: string) => {
    const segment = transcript.find(seg => seg.id === id);
    if (!segment || currentTime < segment.startTime || currentTime > segment.endTime) return;
    
    const splitPoint = (currentTime - segment.startTime) / (segment.endTime - segment.startTime);
    const splitIndex = Math.floor(segment.text.length * splitPoint);
    
    const firstPart = {
      ...segment,
      endTime: currentTime,
      text: segment.text.substring(0, splitIndex)
    };
    
    const secondPart = {
      ...segment,
      id: `${segment.id}-split`,
      startTime: currentTime,
      text: segment.text.substring(splitIndex)
    };
    
    const index = transcript.findIndex(seg => seg.id === id);
    const newTranscript = [...transcript];
    newTranscript.splice(index, 1, firstPart, secondPart);
    setTranscript(newTranscript);
  };

  // Search and replace
  const performReplace = () => {
    if (!searchQuery || !replaceQuery) return;
    
    const newTranscript = transcript.map(seg => ({
      ...seg,
      text: seg.text.replace(new RegExp(searchQuery, 'gi'), replaceQuery)
    }));
    
    setTranscript(newTranscript);
    setSearchQuery('');
    setReplaceQuery('');
  };

  // Export functions
  const exportTranscript = (format: 'txt' | 'srt' | 'vtt' | 'json') => {
    let content = '';
    
    switch (format) {
      case 'txt':
        content = transcript.map(seg => 
          `${seg.speaker}: ${seg.text}`
        ).join('\n\n');
        break;
        
      case 'srt':
        content = transcript.map((seg, index) => 
          `${index + 1}\n${formatTime(seg.startTime)} --> ${formatTime(seg.endTime)}\n${seg.speaker}: ${seg.text}\n`
        ).join('\n');
        break;
        
      case 'vtt':
        content = 'WEBVTT\n\n' + transcript.map(seg =>
          `${formatTime(seg.startTime)} --> ${formatTime(seg.endTime)}\n${seg.speaker}: ${seg.text}\n`
        ).join('\n');
        break;
        
      case 'json':
        content = JSON.stringify(transcript, null, 2);
        break;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript.${format}`;
    a.click();
    
    onExport?.(format);
  };

  // Get current segment
  const getCurrentSegment = () => {
    return transcript.find(seg => 
      currentTime >= seg.startTime && currentTime <= seg.endTime
    );
  };

  // Get speaker color
  const getSpeakerColor = (speaker: string) => {
    const index = speakers.indexOf(speaker);
    return SPEAKER_COLORS[index % SPEAKER_COLORS.length];
  };

  // Filtered segments based on search
  const filteredSegments = transcript.filter(seg =>
    searchQuery ? seg.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-zinc-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-400" />
            Transcript Editor
          </h2>
          <p className="text-gray-100/80">Edit and sync podcast transcripts with timestamps</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={generateTranscript}
            disabled={isGeneratingTranscript}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-xl transition-all font-bold disabled:opacity-50"
          >
            {isGeneratingTranscript ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={() => onSave?.(transcript)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
        <audio ref={audioRef} src={audioUrl} />
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 rounded-full transition-all text-white"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            
            <button
              onClick={() => jumpToTime(Math.max(0, currentTime - 10))}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => jumpToTime(currentTime + 10)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            
            <button
              onClick={changePlaybackSpeed}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white font-mono text-sm"
            >
              {playbackSpeed}x
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-white font-mono">{formatTime(currentTime)}</span>
            
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={isAutoScroll}
                onChange={(e) => setIsAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-scroll</span>
            </label>
          </div>
        </div>
        
        {/* Search and Replace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white flex-1"
            />
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-white/10 border-white/20 text-white flex-1"
            />
            <button
              onClick={performReplace}
              disabled={!searchQuery || !replaceQuery}
              className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-300 disabled:opacity-50"
            >
              <Replace className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={currentSpeaker}
              onChange={(e) => setCurrentSpeaker(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
            >
              {speakers.map(speaker => (
                <option key={speaker} value={speaker}>{speaker}</option>
              ))}
            </select>
            
            <button
              onClick={addSegment}
              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Transcript</h3>
          
          <div className="flex space-x-2">
            {['txt', 'srt', 'vtt', 'json'].map(format => (
              <button
                key={format}
                onClick={() => exportTranscript(format as any)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-xs font-bold uppercase"
              >
                {format}
              </button>
            ))}
          </div>
        </div>
        
        <div
          ref={transcriptContainerRef}
          className="space-y-4 max-h-96 overflow-y-auto pr-4"
        >
          {filteredSegments.length > 0 ? (
            filteredSegments.map((segment) => {
              const isCurrentSegment = currentTime >= segment.startTime && currentTime <= segment.endTime;
              const isSelected = selectedSegment === segment.id;
              
              return (
                <div
                  key={segment.id}
                  ref={el => segmentRefs.current[segment.id] = el}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isCurrentSegment
                      ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/30'
                      : isSelected
                      ? 'bg-white/20 border-white/40'
                      : 'bg-white/10 border-white/20 hover:bg-white/15'
                  }`}
                  onClick={() => {
                    setSelectedSegment(segment.id);
                    jumpToTime(segment.startTime);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 bg-gradient-to-r ${getSpeakerColor(segment.speaker)} rounded-lg text-white text-sm font-bold`}>
                        {segment.speaker}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToTime(segment.startTime);
                        }}
                        className="text-blue-300 hover:text-blue-200 font-mono text-sm"
                      >
                        {formatTime(segment.startTime)}
                      </button>
                      
                      {segment.confidence && (
                        <Badge className={`${
                          segment.confidence > 0.9 ? 'bg-green-500/20 text-green-300' :
                          segment.confidence > 0.7 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {Math.round(segment.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSegment(segment.id, { isEditing: !segment.isEditing });
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-all text-white"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          splitSegment(segment.id);
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-all text-white"
                        title="Split at current time"
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSegment(segment.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-all text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {segment.isEditing ? (
                    <Textarea
                      value={segment.text}
                      onChange={(e) => updateSegment(segment.id, { text: e.target.value })}
                      onBlur={() => updateSegment(segment.id, { isEditing: false })}
                      className="bg-white/10 border-white/20 text-white"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-100 leading-relaxed">
                      {segment.text}
                    </p>
                  )}
                  
                  {segment.tags && segment.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {segment.tags.map(tag => (
                        <Badge key={tag} className="bg-purple-500/20 text-purple-300">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : transcript.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Transcript Yet</h3>
              <p className="text-gray-100/80 mb-4">Generate a transcript or add segments manually</p>
              <button
                onClick={generateTranscript}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-xl transition-all font-bold"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Generate Transcript
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-100/80">No segments match your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {transcript.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{transcript.length}</div>
            <div className="text-gray-100/60 text-sm">Segments</div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">{speakers.length}</div>
            <div className="text-gray-100/60 text-sm">Speakers</div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {transcript.reduce((acc, seg) => acc + seg.text.split(' ').length, 0)}
            </div>
            <div className="text-gray-100/60 text-sm">Words</div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round((transcript.reduce((acc, seg) => acc + (seg.confidence || 0), 0) / transcript.length) * 100) || 0}%
            </div>
            <div className="text-gray-100/60 text-sm">Avg Confidence</div>
          </div>
        </div>
      )}
    </div>
  );
}