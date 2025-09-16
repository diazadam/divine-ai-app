import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Maximize2,
  Repeat,
  Shuffle
} from 'lucide-react';
// import { Slider } from './slider';

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
  showWaveform?: boolean;
  hosts?: Array<{ name: string; voiceName: string }>;
}

export function AudioPlayer({
  audioUrl,
  title,
  description,
  duration: totalDuration = 0,
  onClose,
  className = '',
  showWaveform = true,
  hosts
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(totalDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Simplified waveform visualization
  useEffect(() => {
    if (!showWaveform || !canvasRef.current || !audioRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple animated bars without Web Audio API for now
    const draw = () => {
      if (!isPlaying) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barCount = 50;
      const barWidth = canvas.width / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#6366f1');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
      }
    };
    
    if (isPlaying) {
      draw();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, showWaveform]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      // Try to reload the audio
      setTimeout(() => {
        if (audio) {
          audio.load();
        }
      }, 1000);
    };
    const handleCanPlay = () => {
      console.log('Audio can play - format supported');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback failed:', error);
      setIsPlaying(false);
      // Show user-friendly error message
      alert('Audio playback failed. The file may be corrupted or in an unsupported format.');
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const changePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    audioRef.current.loop = !isLooping;
    setIsLooping(!isLooping);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const shareEpisode = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description || `Check out this podcast: ${title}`,
        url: window.location.href
      });
    }
  };

  return (
    <div className={`bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-indigo-900/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 ${className} ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          {description && (
            <p className="text-pink-100/80 text-sm mb-2">{description}</p>
          )}
          {hosts && hosts.length > 0 && (
            <p className="text-green-300 text-xs">
              🎙️ Featuring: {hosts.map(h => `${h.name} (${h.voiceName})`).join(', ')}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      {showWaveform && (
        <div className="mb-6 relative h-32 bg-black/30 rounded-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width={800}
            height={128}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/50 text-sm">Waveform visualization</div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-pink-100/80 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          value={currentTime}
          max={duration || 100}
          step={0.1}
          onChange={(e) => handleSeek([parseFloat(e.target.value)])}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={() => skip(-30)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110 text-white"
          title="Rewind 30s"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => skip(-10)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
          title="Rewind 10s"
        >
          -10
        </button>
        
        <button
          onClick={togglePlayPause}
          className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-full transition-all hover:scale-110 shadow-lg shadow-pink-500/50 text-white"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
        
        <button
          onClick={() => skip(10)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
          title="Forward 10s"
        >
          +10
        </button>
        
        <button
          onClick={() => skip(30)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110 text-white"
          title="Forward 30s"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <input
            type="range"
            value={isMuted ? 0 : volume}
            max={1}
            step={0.01}
            onChange={(e) => handleVolumeChange([parseFloat(e.target.value)])}
            className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={changePlaybackRate}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white text-sm font-mono"
          >
            {playbackRate}x
          </button>
          
          <button
            onClick={toggleLoop}
            className={`p-2 ${isLooping ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-white'} hover:bg-white/20 rounded-xl transition-all`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={shareEpisode}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
          >
            <Share2 className="w-4 h-4" />
          </button>
          
          <a
            href={audioUrl}
            download={`${title}.mp3`}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white inline-block"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-4 text-center text-xs text-pink-200/60">
        Space: Play/Pause • ← →: Skip 10s • Shift + ← →: Skip 30s
      </div>
    </div>
  );
}