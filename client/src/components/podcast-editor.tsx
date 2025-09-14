import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Music,
  Mic,
  Volume2,
  Move,
  Copy,
  Scissors,
  Save,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Layers,
  Clock,
  Wand2,
  FileAudio,
  Settings,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Segment {
  id: string;
  type: 'intro' | 'content' | 'ad' | 'music' | 'outro' | 'interview' | 'transition';
  title: string;
  content: string;
  voiceId: string;
  voiceName: string;
  duration: number;
  startTime: number;
  effects: {
    fadeIn?: boolean;
    fadeOut?: boolean;
    backgroundMusic?: string;
    musicVolume?: number;
    soundEffect?: string;
  };
}

interface PodcastEditorProps {
  initialSegments?: Segment[];
  availableVoices: Array<{ id: string; name: string; description: string }>;
  onSave?: (segments: Segment[]) => void;
  onGenerate?: (segments: Segment[]) => void;
}

const SEGMENT_COLORS = {
  intro: 'from-green-500 to-emerald-600',
  content: 'from-blue-500 to-cyan-600',
  ad: 'from-yellow-500 to-orange-600',
  music: 'from-purple-500 to-pink-600',
  outro: 'from-red-500 to-rose-600',
  interview: 'from-indigo-500 to-purple-600',
  transition: 'from-gray-500 to-slate-600'
};

const BACKGROUND_MUSIC = [
  { id: 'inspiring', name: '🎵 Inspiring Piano', url: '/music/inspiring.mp3' },
  { id: 'upbeat', name: '🎸 Upbeat Guitar', url: '/music/upbeat.mp3' },
  { id: 'ambient', name: '🌊 Ambient Waves', url: '/music/ambient.mp3' },
  { id: 'corporate', name: '💼 Corporate Tech', url: '/music/corporate.mp3' },
  { id: 'worship', name: '🙏 Worship Soft', url: '/music/worship.mp3' }
];

const SOUND_EFFECTS = [
  { id: 'whoosh', name: '💨 Whoosh Transition', url: '/sfx/whoosh.mp3' },
  { id: 'bell', name: '🔔 Bell Ding', url: '/sfx/bell.mp3' },
  { id: 'applause', name: '👏 Applause', url: '/sfx/applause.mp3' },
  { id: 'drumroll', name: '🥁 Drum Roll', url: '/sfx/drumroll.mp3' },
  { id: 'chime', name: '🎐 Chime', url: '/sfx/chime.mp3' }
];

export default function PodcastEditor({
  initialSegments = [],
  availableVoices,
  onSave,
  onGenerate
}: PodcastEditorProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSegment, setDraggedSegment] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate total duration whenever segments change
  useEffect(() => {
    const total = segments.reduce((acc, seg) => acc + seg.duration, 0);
    setTotalDuration(total);
  }, [segments]);

  const addSegment = (type: Segment['type']) => {
    const newSegment: Segment = {
      id: `seg-${Date.now()}`,
      type,
      title: `New ${type} segment`,
      content: '',
      voiceId: availableVoices[0]?.id || '',
      voiceName: availableVoices[0]?.name || '',
      duration: 30, // Default 30 seconds
      startTime: totalDuration,
      effects: {}
    };
    setSegments([...segments, newSegment]);
    setSelectedSegment(newSegment.id);
  };

  const updateSegment = (id: string, updates: Partial<Segment>) => {
    setSegments(segments.map(seg => 
      seg.id === id ? { ...seg, ...updates } : seg
    ));
  };

  const deleteSegment = (id: string) => {
    setSegments(segments.filter(seg => seg.id !== id));
    if (selectedSegment === id) {
      setSelectedSegment(null);
    }
  };

  const duplicateSegment = (id: string) => {
    const segmentToDuplicate = segments.find(seg => seg.id === id);
    if (segmentToDuplicate) {
      const newSegment = {
        ...segmentToDuplicate,
        id: `seg-${Date.now()}`,
        title: `${segmentToDuplicate.title} (Copy)`,
        startTime: totalDuration
      };
      setSegments([...segments, newSegment]);
    }
  };

  const moveSegment = (id: string, direction: 'up' | 'down') => {
    const index = segments.findIndex(seg => seg.id === id);
    if (index === -1) return;
    
    const newSegments = [...segments];
    if (direction === 'up' && index > 0) {
      [newSegments[index], newSegments[index - 1]] = [newSegments[index - 1], newSegments[index]];
    } else if (direction === 'down' && index < segments.length - 1) {
      [newSegments[index], newSegments[index + 1]] = [newSegments[index + 1], newSegments[index]];
    }
    
    // Recalculate start times
    let currentStart = 0;
    newSegments.forEach(seg => {
      seg.startTime = currentStart;
      currentStart += seg.duration;
    });
    
    setSegments(newSegments);
  };

  const generateAIContent = async (segmentId: string) => {
    const segment = segments.find(seg => seg.id === segmentId);
    if (!segment) return;
    
    // Simulate AI generation (in real app, this would call your API)
    const aiPrompt = `Generate ${segment.type} content for podcast segment titled "${segment.title}"`;
    
    // Mock AI response
    setTimeout(() => {
      updateSegment(segmentId, {
        content: `AI Generated Content for ${segment.title}: This is where your amazing AI-generated content would appear based on the segment type and context.`
      });
    }, 1000);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / rect.width) * totalDuration;
    setCurrentTime(clickedTime);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-indigo-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🎙️ Advanced Podcast Editor</h2>
          <p className="text-pink-100/80">Create multi-segment podcasts with AI assistance</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => onSave?.(segments)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => onGenerate?.(segments)}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-pink-500/30 flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Podcast</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Timeline</h3>
          <div className="text-pink-100/80">
            Total Duration: {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
          </div>
        </div>
        
        <div
          ref={timelineRef}
          className="relative h-24 bg-black/30 rounded-xl overflow-hidden cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Segments on timeline */}
          {segments.map((segment) => {
            const widthPercent = (segment.duration / totalDuration) * 100;
            const leftPercent = (segment.startTime / totalDuration) * 100;
            
            return (
              <div
                key={segment.id}
                className={`absolute h-full bg-gradient-to-r ${SEGMENT_COLORS[segment.type]} opacity-80 hover:opacity-100 transition-all cursor-pointer border-r-2 border-white/30`}
                style={{
                  width: `${widthPercent}%`,
                  left: `${leftPercent}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegment(segment.id);
                }}
              >
                <div className="p-2 text-white text-xs font-bold truncate">
                  {segment.title}
                </div>
                <div className="px-2 text-white/80 text-xs">
                  {segment.duration}s
                </div>
              </div>
            );
          })}
          
          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-red-500 shadow-lg shadow-red-500/50"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments List */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Segments</h3>
            
            {/* Add Segment Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(['intro', 'content', 'interview', 'ad', 'music', 'transition', 'outro'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => addSegment(type)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-bold capitalize"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  {type}
                </button>
              ))}
            </div>
            
            {/* Segments List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedSegment === segment.id
                      ? 'bg-white/20 border-2 border-pink-400'
                      : 'bg-white/10 border border-white/10 hover:bg-white/15'
                  }`}
                  onClick={() => setSelectedSegment(segment.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`bg-gradient-to-r ${SEGMENT_COLORS[segment.type]} text-white border-none`}>
                      {segment.type}
                    </Badge>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(segment.id, 'up');
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-all"
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSegment(segment.id, 'down');
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-all"
                        disabled={index === segments.length - 1}
                      >
                        <ChevronDown className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-white mb-1">{segment.title}</h4>
                  <p className="text-pink-100/60 text-xs mb-2">{segment.voiceName}</p>
                  <div className="flex items-center justify-between text-xs text-pink-100/80">
                    <span>⏱️ {segment.duration}s</span>
                    <span>📍 {Math.floor(segment.startTime / 60)}:{String(segment.startTime % 60).padStart(2, '0')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segment Editor */}
        <div className="lg:col-span-2">
          {selectedSegment ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              {(() => {
                const segment = segments.find(s => s.id === selectedSegment);
                if (!segment) return null;
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Edit Segment</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => duplicateSegment(segment.id)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSegment(segment.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-bold text-pink-200 mb-2">Segment Title</label>
                        <Input
                          value={segment.title}
                          onChange={(e) => updateSegment(segment.id, { title: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-pink-200 mb-2">Voice</label>
                          <select
                            value={segment.voiceId}
                            onChange={(e) => {
                              const voice = availableVoices.find(v => v.id === e.target.value);
                              if (voice) {
                                updateSegment(segment.id, {
                                  voiceId: voice.id,
                                  voiceName: voice.name
                                });
                              }
                            }}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          >
                            {availableVoices.map(voice => (
                              <option key={voice.id} value={voice.id}>
                                {voice.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-pink-200 mb-2">Duration (seconds)</label>
                          <Input
                            type="number"
                            value={segment.duration}
                            onChange={(e) => updateSegment(segment.id, { duration: parseInt(e.target.value) || 30 })}
                            className="bg-white/10 border-white/20 text-white"
                            min="1"
                            max="600"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-pink-200">Content</label>
                        <button
                          onClick={() => generateAIContent(segment.id)}
                          className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all text-xs font-bold"
                        >
                          <Wand2 className="w-3 h-3 inline mr-1" />
                          Generate with AI
                        </button>
                      </div>
                      <Textarea
                        value={segment.content}
                        onChange={(e) => updateSegment(segment.id, { content: e.target.value })}
                        className="bg-white/10 border-white/20 text-white min-h-32"
                        placeholder="Enter your segment content or click 'Generate with AI'..."
                      />
                    </div>
                    
                    {/* Effects */}
                    <div>
                      <h4 className="text-sm font-bold text-pink-200 mb-3">Effects & Music</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 text-white">
                            <input
                              type="checkbox"
                              checked={segment.effects.fadeIn || false}
                              onChange={(e) => updateSegment(segment.id, {
                                effects: { ...segment.effects, fadeIn: e.target.checked }
                              })}
                              className="rounded"
                            />
                            <span className="text-sm">Fade In</span>
                          </label>
                          
                          <label className="flex items-center space-x-2 text-white">
                            <input
                              type="checkbox"
                              checked={segment.effects.fadeOut || false}
                              onChange={(e) => updateSegment(segment.id, {
                                effects: { ...segment.effects, fadeOut: e.target.checked }
                              })}
                              className="rounded"
                            />
                            <span className="text-sm">Fade Out</span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-pink-200 mb-1">Background Music</label>
                          <select
                            value={segment.effects.backgroundMusic || ''}
                            onChange={(e) => updateSegment(segment.id, {
                              effects: { ...segment.effects, backgroundMusic: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                          >
                            <option value="">None</option>
                            {BACKGROUND_MUSIC.map(music => (
                              <option key={music.id} value={music.id}>
                                {music.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {segment.effects.backgroundMusic && (
                          <div>
                            <label className="block text-xs font-bold text-pink-200 mb-1">
                              Music Volume: {Math.round((segment.effects.musicVolume || 0.3) * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={(segment.effects.musicVolume || 0.3) * 100}
                              onChange={(e) => updateSegment(segment.id, {
                                effects: { ...segment.effects, musicVolume: parseInt(e.target.value) / 100 }
                              })}
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-bold text-pink-200 mb-1">Sound Effect</label>
                          <select
                            value={segment.effects.soundEffect || ''}
                            onChange={(e) => updateSegment(segment.id, {
                              effects: { ...segment.effects, soundEffect: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                          >
                            <option value="">None</option>
                            {SOUND_EFFECTS.map(sfx => (
                              <option key={sfx.id} value={sfx.id}>
                                {sfx.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center">
              <Layers className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Segment Selected</h3>
              <p className="text-pink-100/80">Select a segment to edit or add a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-6 text-center text-xs text-pink-200/60">
        💡 Tips: Drag segments to reorder • Double-click to edit • Cmd/Ctrl+D to duplicate
      </div>
    </div>
  );
}