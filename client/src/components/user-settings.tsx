import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  BrainCircuit, 
  Check, 
  ChevronRight, 
  Globe, 
  HardDrive, 
  Lock, 
  MessageSquare, 
  Palette, 
  Save, 
  Settings, 
  Shield, 
  Sliders, 
  User, 
  Volume2, 
  Wand2,
  X,
  Zap 
} from "lucide-react";

interface UserPreferences {
  // AI Model Preferences
  defaultTextModel: string;
  defaultEmotionModel: string;
  defaultSafetyModel: string;
  defaultEmbeddingModel: string;
  defaultASRModel: string;
  enableAdvancedDialogue: boolean;
  enableEmotionAnalysis: boolean;
  
  // Content Safety & Moderation
  contentModerationLevel: 'strict' | 'moderate' | 'minimal';
  enablePIIRedaction: boolean;
  toxicityThreshold: number;
  enableRAGEnhancement: boolean;
  moderationOverride: boolean;
  
  // Voice & Audio Preferences
  defaultConversationStyle: string;
  defaultPodcastDuration: number;
  defaultTargetAudience: string;
  enableSmartTransitions: boolean;
  
  // Quality & Performance
  preferredAudioQuality: 'standard' | 'high' | 'premium';
  enableCaching: boolean;
  maxGenerationTime: number;
  enableRedisCache: boolean;
  
  // UI Preferences
  theme: 'auto' | 'dark' | 'light';
  showAdvancedControls: boolean;
  enableNotifications: boolean;
}

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultPreferences: UserPreferences = {
  // AI Models
  defaultTextModel: 'HuggingFaceH4/zephyr-7b-beta',
  defaultEmotionModel: 'cardiffnlp/twitter-roberta-base-emotion-latest',
  defaultSafetyModel: 'unitary/toxic-bert',
  defaultEmbeddingModel: 'BAAI/bge-small-en-v1.5',
  defaultASRModel: 'distil-whisper/distil-large-v3',
  enableAdvancedDialogue: true,
  enableEmotionAnalysis: true,
  
  // Safety & Moderation
  contentModerationLevel: 'moderate',
  enablePIIRedaction: true,
  toxicityThreshold: 0.7,
  enableRAGEnhancement: true,
  moderationOverride: false,
  
  // Voice & Audio
  defaultConversationStyle: 'natural',
  defaultPodcastDuration: 15,
  defaultTargetAudience: 'general',
  enableSmartTransitions: true,
  
  // Quality & Performance
  preferredAudioQuality: 'high',
  enableCaching: true,
  maxGenerationTime: 300, // 5 minutes
  enableRedisCache: true,
  
  // UI
  theme: 'auto',
  showAdvancedControls: true,
  enableNotifications: true,
};

export default function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<'ai' | 'safety' | 'audio' | 'performance' | 'ui'>('ai');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user preferences from localStorage on component mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('divine-ai-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  }, []);

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem('divine-ai-preferences', JSON.stringify(preferences));
      
      // In a real app, you'd also send to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setHasChanges(false);
      // Show success toast
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Show error toast
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'ai', name: 'AI Models', icon: BrainCircuit, color: 'purple' },
    { id: 'safety', name: 'Safety & Moderation', icon: Shield, color: 'red' },
    { id: 'audio', name: 'Voice & Audio', icon: Volume2, color: 'blue' },
    { id: 'performance', name: 'Performance', icon: Zap, color: 'yellow' },
    { id: 'ui', name: 'Interface', icon: Palette, color: 'green' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">User Preferences</h2>
              <p className="text-purple-200">Customize your Divine AI experience</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 p-4">
            <div className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r from-${tab.color}-500/20 to-${tab.color}-600/20 border border-${tab.color}-400/30 text-white shadow-lg` 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? `text-${tab.color}-400` : ''}`} />
                    <span className="font-medium">{tab.name}</span>
                    <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </button>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={savePreferences}
                disabled={!hasChanges || saving}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-white font-bold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              
              {hasChanges && (
                <button
                  onClick={resetToDefaults}
                  className="w-full mt-2 text-sm text-purple-300 hover:text-white transition-colors"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* AI Models Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <BrainCircuit className="w-6 h-6 mr-3 text-purple-400" />
                    AI Model Configuration
                  </h3>
                  
                  {/* Text Generation Model */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">🤖 Text Generation Model</h4>
                    <select
                      value={preferences.defaultTextModel}
                      onChange={(e) => updatePreference('defaultTextModel', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="HuggingFaceH4/zephyr-7b-beta">Zephyr-7B Beta (Recommended)</option>
                      <option value="mistralai/Mistral-7B-Instruct-v0.2">Mistral-7B Instruct</option>
                      <option value="Qwen/Qwen2.5-7B-Instruct">Qwen2.5-7B Instruct</option>
                      <option value="gemini-only">Gemini Only</option>
                    </select>
                    <p className="text-sm text-purple-200 mt-2">Primary model for conversation generation and content structuring</p>
                  </div>

                  {/* Emotion Analysis Model */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">🎭 Emotion Analysis Model</h4>
                    <select
                      value={preferences.defaultEmotionModel}
                      onChange={(e) => updatePreference('defaultEmotionModel', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="cardiffnlp/twitter-roberta-base-emotion-latest">Cardiff RoBERTa Emotion (Recommended)</option>
                      <option value="j-hartmann/emotion-english-distilroberta-base">DistilRoBERTa Emotion</option>
                      <option value="SamLowe/roberta-base-go_emotions">RoBERTa Go Emotions</option>
                    </select>
                    <p className="text-sm text-purple-200 mt-2">Model for detecting emotions in text to optimize voice synthesis</p>
                  </div>

                  {/* Safety & Moderation Model */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">🛡️ Safety & Moderation Model</h4>
                    <select
                      value={preferences.defaultSafetyModel}
                      onChange={(e) => updatePreference('defaultSafetyModel', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="unitary/toxic-bert">Unitary Toxic-BERT (Recommended)</option>
                      <option value="martin-ha/toxic-comment-model">Martin-HA Toxic Comment</option>
                    </select>
                    <p className="text-sm text-purple-200 mt-2">Model for detecting toxic content and ensuring safety</p>
                  </div>

                  {/* Embeddings Model */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">🔍 RAG Embeddings Model</h4>
                    <select
                      value={preferences.defaultEmbeddingModel}
                      onChange={(e) => updatePreference('defaultEmbeddingModel', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="BAAI/bge-small-en-v1.5">BAAI BGE Small EN (Recommended)</option>
                      <option value="sentence-transformers/all-MiniLM-L6-v2">Sentence Transformers MiniLM</option>
                      <option value="microsoft/DialoGPT-medium">Microsoft DialoGPT</option>
                    </select>
                    <p className="text-sm text-purple-200 mt-2">Model for semantic search and context retrieval</p>
                  </div>

                  {/* ASR Transcription Model */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-3">🎤 ASR Transcription Model</h4>
                    <select
                      value={preferences.defaultASRModel}
                      onChange={(e) => updatePreference('defaultASRModel', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                    >
                      <option value="distil-whisper/distil-large-v3">Distil-Whisper Large v3 (Recommended)</option>
                      <option value="openai/whisper-large-v3">OpenAI Whisper Large v3</option>
                      <option value="openai/whisper-medium">OpenAI Whisper Medium</option>
                    </select>
                    <p className="text-sm text-purple-200 mt-2">Model for automatic speech recognition and transcription</p>
                  </div>

                  {/* AI Feature Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">Advanced Dialogue</h4>
                        <button
                          onClick={() => updatePreference('enableAdvancedDialogue', !preferences.enableAdvancedDialogue)}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            preferences.enableAdvancedDialogue ? 'bg-purple-500 shadow-lg shadow-purple-500/30' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                            preferences.enableAdvancedDialogue ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </div>
                      <p className="text-sm text-purple-200">Use HuggingFace models for natural conversation flow</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">Emotion Analysis</h4>
                        <button
                          onClick={() => updatePreference('enableEmotionAnalysis', !preferences.enableEmotionAnalysis)}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            preferences.enableEmotionAnalysis ? 'bg-purple-500 shadow-lg shadow-purple-500/30' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                            preferences.enableEmotionAnalysis ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </div>
                      <p className="text-sm text-purple-200">Automatically detect emotions for voice tone optimization</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Tab */}
            {activeTab === 'safety' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-red-400" />
                    Content Safety & Moderation
                  </h3>
                  
                  {/* Moderation Level */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-4">🛡️ Content Moderation Level</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'minimal', name: 'Minimal', desc: 'Basic safety checks only', color: 'green' },
                        { id: 'moderate', name: 'Moderate', desc: 'Balanced safety & creativity', color: 'yellow' },
                        { id: 'strict', name: 'Strict', desc: 'Maximum safety filtering', color: 'red' }
                      ].map(level => (
                        <button
                          key={level.id}
                          onClick={() => updatePreference('contentModerationLevel', level.id)}
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            preferences.contentModerationLevel === level.id
                              ? `bg-gradient-to-br from-${level.color}-500/20 to-${level.color}-600/20 border-${level.color}-400 shadow-lg shadow-${level.color}-500/30`
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <h5 className="font-bold text-white mb-2">{level.name}</h5>
                          <p className="text-sm text-white/70">{level.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PII Redaction */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white">🔒 PII Redaction</h4>
                        <p className="text-sm text-red-200">Automatically remove personal information from content</p>
                      </div>
                      <button
                        onClick={() => updatePreference('enablePIIRedaction', !preferences.enablePIIRedaction)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          preferences.enablePIIRedaction ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                          preferences.enablePIIRedaction ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  </div>

                  {/* RAG Enhancement */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white">🔍 RAG Enhancement</h4>
                        <p className="text-sm text-red-200">Use semantic search and pgvector for better context</p>
                      </div>
                      <button
                        onClick={() => updatePreference('enableRAGEnhancement', !preferences.enableRAGEnhancement)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          preferences.enableRAGEnhancement ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                          preferences.enableRAGEnhancement ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  </div>

                  {/* Toxicity Threshold */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
                    <h4 className="font-bold text-white mb-4">⚖️ Toxicity Threshold</h4>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="0.3"
                        max="0.9"
                        step="0.1"
                        value={preferences.toxicityThreshold}
                        onChange={(e) => updatePreference('toxicityThreshold', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">Permissive (0.3)</span>
                        <span className="text-white font-bold">Current: {preferences.toxicityThreshold}</span>
                        <span className="text-red-300">Strict (0.9)</span>
                      </div>
                      <p className="text-sm text-red-200">Lower values = more content blocked. Higher values = more content allowed.</p>
                    </div>
                  </div>

                  {/* Moderation Override */}
                  <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-white">⚠️ Moderation Override</h4>
                        <p className="text-sm text-red-200">Skip safety checks (admin only - use with caution)</p>
                      </div>
                      <button
                        onClick={() => updatePreference('moderationOverride', !preferences.moderationOverride)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          preferences.moderationOverride ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                          preferences.moderationOverride ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                    {preferences.moderationOverride && (
                      <div className="mt-4 p-3 bg-red-600/20 rounded-lg border border-red-500/30">
                        <p className="text-red-300 text-xs font-bold">⚠️ WARNING: This bypasses all safety checks including toxicity detection and PII redaction.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Volume2 className="w-6 h-6 mr-3 text-blue-400" />
                    Voice & Audio Preferences
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Duration */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="font-bold text-white mb-3">⏱️ Default Episode Duration</h4>
                      <select
                        value={preferences.defaultPodcastDuration}
                        onChange={(e) => updatePreference('defaultPodcastDuration', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                      >
                        <option value={5}>5 minutes (Quick)</option>
                        <option value={15}>15 minutes (Standard)</option>
                        <option value={30}>30 minutes (Extended)</option>
                        <option value={60}>60 minutes (Long-form)</option>
                      </select>
                    </div>

                    {/* Conversation Style */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="font-bold text-white mb-3">💬 Default Conversation Style</h4>
                      <select
                        value={preferences.defaultConversationStyle}
                        onChange={(e) => updatePreference('defaultConversationStyle', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                      >
                        <option value="natural">Natural - Everyday conversation</option>
                        <option value="energetic">Energetic - High-energy discussion</option>
                        <option value="thoughtful">Thoughtful - Deep, contemplative</option>
                        <option value="professional">Professional - Formal, expert-level</option>
                      </select>
                    </div>

                    {/* Target Audience */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="font-bold text-white mb-3">🎯 Default Target Audience</h4>
                      <select
                        value={preferences.defaultTargetAudience}
                        onChange={(e) => updatePreference('defaultTargetAudience', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                      >
                        <option value="general">General - Accessible to everyone</option>
                        <option value="technical">Technical - Industry professionals</option>
                        <option value="casual">Casual - Relaxed, informal tone</option>
                        <option value="professional">Professional - Business & corporate</option>
                      </select>
                    </div>

                    {/* Audio Quality */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="font-bold text-white mb-3">🎵 Preferred Audio Quality</h4>
                      <select
                        value={preferences.preferredAudioQuality}
                        onChange={(e) => updatePreference('preferredAudioQuality', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                      >
                        <option value="standard">Standard - Good quality, faster</option>
                        <option value="high">High - Better quality, slower</option>
                        <option value="premium">Premium - Best quality, slowest</option>
                      </select>
                    </div>
                  </div>

                  {/* Smart Transitions Toggle */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">🔄 Smart Transitions</h4>
                        <p className="text-sm text-blue-200">Generate smooth AI transitions between topics</p>
                      </div>
                      <button
                        onClick={() => updatePreference('enableSmartTransitions', !preferences.enableSmartTransitions)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          preferences.enableSmartTransitions ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                          preferences.enableSmartTransitions ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-yellow-400" />
                    Performance & Optimization
                  </h3>
                  
                  {/* Caching Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-white">Redis Caching</h4>
                          <p className="text-sm text-yellow-200/80">Cache HuggingFace API responses for faster performance</p>
                        </div>
                        <button
                          onClick={() => updatePreference('enableRedisCache', !preferences.enableRedisCache)}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            preferences.enableRedisCache ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                            preferences.enableRedisCache ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-white">Local Caching</h4>
                          <p className="text-sm text-yellow-200/80">Cache generated content locally for reuse</p>
                        </div>
                        <button
                          onClick={() => updatePreference('enableCaching', !preferences.enableCaching)}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            preferences.enableCaching ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                            preferences.enableCaching ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generation Timeout */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mt-6 border border-white/10">
                    <h4 className="font-bold text-white mb-4">⏱️ Maximum Generation Time</h4>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="60"
                        max="600"
                        step="30"
                        value={preferences.maxGenerationTime}
                        onChange={(e) => updatePreference('maxGenerationTime', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-green-300">1 minute</span>
                        <span className="text-white font-bold">Current: {Math.round(preferences.maxGenerationTime / 60)} minutes</span>
                        <span className="text-red-300">10 minutes</span>
                      </div>
                      <p className="text-sm text-yellow-200">Maximum time allowed for podcast generation before timeout</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ui' && (
              <div className="text-center py-20">
                <Palette className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Interface Settings</h3>
                <p className="text-white/60">Theme options, notifications, and UI preferences coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}