import { useState, useEffect } from "react";
import { 
  Bot, 
  BrainCircuit, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Mic, 
  Music, 
  Sparkles, 
  Volume2, 
  Wand2,
  Zap 
} from "lucide-react";

interface GenerationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number;
  icon: any;
  estimatedTime: number; // seconds
  startTime?: number;
  endTime?: number;
  details?: string;
}

interface GenerationProgressProps {
  isVisible: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  steps?: GenerationStep[];
  title?: string;
  subtitle?: string;
}

const defaultSteps: GenerationStep[] = [
  {
    id: 'agents_outline',
    name: 'OpenAI Agents SDK Setup',
    description: 'Initializing director and host agents for conversation',
    status: 'pending',
    icon: BrainCircuit,
    estimatedTime: 3
  },
  {
    id: 'conversation_outline',
    name: 'Conversation Planning',
    description: 'Creating structured outline with AI director agent',
    status: 'pending',
    icon: Sparkles,
    estimatedTime: 5
  },
  {
    id: 'script_generation',
    name: 'Script Generation',
    description: 'Building natural multi-host dialogue with personality agents',
    status: 'pending',
    icon: MessageSquare,
    estimatedTime: 8
  },
  {
    id: 'voice_assignment',
    name: 'Voice Assignment',
    description: 'Mapping hosts to OpenAI voices (alloy, echo, nova, etc.)',
    status: 'pending',
    icon: Bot,
    estimatedTime: 2
  },
  {
    id: 'openai_synthesis',
    name: 'OpenAI TTS Synthesis',
    description: 'Converting dialogue to high-quality speech',
    status: 'pending',
    icon: Volume2,
    estimatedTime: 12
  },
  {
    id: 'audio_mixing',
    name: 'Audio Processing',
    description: 'Mixing segments and optimizing final audio',
    status: 'pending',
    icon: Music,
    estimatedTime: 5
  }
];

export default function GenerationProgress({ 
  isVisible, 
  onComplete, 
  onCancel,
  steps = defaultSteps,
  title = "Creating Your Divine Podcast",
  subtitle = "Using Advanced AI Voice Technology"
}: GenerationProgressProps) {
  const [currentSteps, setCurrentSteps] = useState<GenerationStep[]>(steps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    console.log('🎭 GenerationProgress visibility changed:', isVisible);
    if (isVisible && !isGenerating) {
      console.log('🚀 Starting generation animation');
      startGeneration();
    }
  }, [isVisible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const startGeneration = () => {
    setIsGenerating(true);
    setElapsedTime(0);
    setCurrentStepIndex(0);
    
    // Reset all steps
    const resetSteps = steps.map(step => ({ ...step, status: 'pending' as const }));
    setCurrentSteps(resetSteps);

    // Start processing steps
    processNextStep(0, resetSteps);
  };

  const processNextStep = async (stepIndex: number, stepsArray: GenerationStep[]) => {
    if (stepIndex >= stepsArray.length) {
      // All steps completed
      setTotalProgress(100);
      setIsGenerating(false);
      setTimeout(() => onComplete?.(), 1500);
      return;
    }

    const step = stepsArray[stepIndex];
    
    // Mark step as in progress
    const updatedSteps = [...stepsArray];
    updatedSteps[stepIndex] = { 
      ...step, 
      status: 'in_progress', 
      startTime: Date.now(),
      progress: 0 
    };
    setCurrentSteps(updatedSteps);
    setCurrentStepIndex(stepIndex);

    // Simulate step progress
    await simulateStepProgress(stepIndex, updatedSteps);

    // Mark step as completed
    const completedSteps = [...updatedSteps];
    completedSteps[stepIndex] = { 
      ...completedSteps[stepIndex], 
      status: 'completed', 
      progress: 100,
      endTime: Date.now()
    };
    setCurrentSteps(completedSteps);

    // Update total progress
    const progressPercent = ((stepIndex + 1) / stepsArray.length) * 100;
    setTotalProgress(progressPercent);

    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Process next step
    processNextStep(stepIndex + 1, completedSteps);
  };

  const simulateStepProgress = async (stepIndex: number, stepsArray: GenerationStep[]) => {
    const step = stepsArray[stepIndex];
    const duration = step.estimatedTime * 1000; // Convert to milliseconds
    const intervals = 20; // Number of progress updates
    const intervalDuration = duration / intervals;

    for (let i = 0; i <= intervals; i++) {
      const progress = (i / intervals) * 100;
      
      const updatedSteps = [...stepsArray];
      updatedSteps[stepIndex] = { 
        ...updatedSteps[stepIndex], 
        progress,
        details: getStepDetails(stepIndex, progress)
      };
      setCurrentSteps(updatedSteps);

      if (i < intervals) {
        await new Promise(resolve => setTimeout(resolve, intervalDuration));
      }
    }
  };

  const getStepDetails = (stepIndex: number, progress: number): string => {
    const stepId = steps[stepIndex]?.id;
    
    switch (stepId) {
      case 'agents_outline':
        if (progress < 30) return 'Connecting to OpenAI Agents SDK...';
        if (progress < 70) return 'Creating director and host agents...';
        return 'Configuring agent personalities...';
        
      case 'conversation_outline':
        if (progress < 25) return 'Analyzing topic and requirements...';
        if (progress < 60) return 'Generating conversation structure...';
        return 'Planning host interactions and flow...';
        
      case 'script_generation':
        if (progress < 20) return 'Orchestrating multi-agent conversation...';
        if (progress < 50) return 'Generating natural dialogue exchanges...';
        if (progress < 80) return 'Adding host personalities and reactions...';
        return 'Finalizing script with proper timing...';
        
      case 'voice_assignment':
        if (progress < 40) return 'Mapping hosts to OpenAI voices...';
        if (progress < 80) return 'Optimizing voice-personality matching...';
        return 'Preparing voice synthesis parameters...';
        
      case 'openai_synthesis':
        if (progress < 30) return 'Processing dialogue segments...';
        if (progress < 70) return 'Converting text to OpenAI TTS audio...';
        return 'Applying voice modulation and timing...';
        
      case 'audio_mixing':
        if (progress < 50) return 'Combining audio segments...';
        if (progress < 90) return 'Applying audio effects and normalization...';
        return 'Finalizing podcast audio...';
        
      default:
        return `Processing... ${Math.round(progress)}%`;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
  const remainingTime = Math.max(0, totalEstimatedTime - elapsedTime);

  if (!isVisible) {
    console.log('🚫 GenerationProgress not visible, returning null');
    return null;
  }

  console.log('✅ GenerationProgress rendering with steps:', currentSteps.length);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ zIndex: 99999 }}>
      <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-violet-900/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4 shadow-2xl">
            <Wand2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-purple-200">{subtitle}</p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-bold">Overall Progress</span>
            <span className="text-purple-200">{Math.round(totalProgress)}%</span>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-purple-500/30"
              style={{ width: `${totalProgress}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>

          <div className="flex justify-between text-sm text-purple-200">
            <span>⏱️ Elapsed: {formatTime(elapsedTime)}</span>
            <span>⏳ Remaining: ~{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
          {currentSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = step.status === 'completed';
            const isPending = step.status === 'pending';

            return (
              <div 
                key={step.id}
                className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40 shadow-lg shadow-purple-500/20" 
                    : isCompleted 
                      ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/20"
                      : "bg-white/5 border-white/10"
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? "bg-green-500 shadow-lg shadow-green-500/30" 
                    : isActive 
                      ? "bg-purple-500 shadow-lg shadow-purple-500/30 animate-pulse" 
                      : "bg-white/20"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : isActive ? (
                    <Icon className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-white/60" />
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold transition-colors duration-300 ${
                      isCompleted ? "text-green-300" : isActive ? "text-white" : "text-white/60"
                    }`}>
                      {step.name}
                    </h3>
                    {step.status === 'in_progress' && (
                      <span className="text-sm font-mono text-purple-300">
                        {Math.round(step.progress || 0)}%
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm mb-2 transition-colors duration-300 ${
                    isActive ? "text-purple-200" : "text-white/50"
                  }`}>
                    {step.description}
                  </p>

                  {step.status === 'in_progress' && (
                    <>
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress || 0}%` }}
                        />
                      </div>
                      {step.details && (
                        <p className="text-xs text-purple-300 animate-pulse">{step.details}</p>
                      )}
                    </>
                  )}

                  {isCompleted && step.startTime && step.endTime && (
                    <p className="text-xs text-green-400">
                      ✅ Completed in {Math.round((step.endTime - step.startTime) / 1000)}s
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onCancel}
            className="text-purple-300 hover:text-white transition-colors duration-300"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-2 text-purple-200">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Powered by OpenAI Agents SDK</span>
          </div>
        </div>
      </div>
    </div>
  );
}