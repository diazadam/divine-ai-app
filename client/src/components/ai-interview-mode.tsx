import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Brain,
  MessageSquare,
  Send,
  RefreshCw,
  Settings,
  Users,
  Sparkles,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Save,
  Play
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface InterviewQuestion {
  id: string;
  question: string;
  followUps: string[];
  category: 'opening' | 'personal' | 'expertise' | 'controversial' | 'closing';
  tone: 'friendly' | 'serious' | 'challenging' | 'empathetic';
  expectedDuration: number;
}

interface InterviewSettings {
  topic: string;
  guestName: string;
  guestExpertise: string;
  interviewStyle: 'conversational' | 'formal' | 'debate' | 'storytelling';
  duration: number;
  hostVoiceId: string;
  guestVoiceId: string;
  autoFollowUp: boolean;
  adaptiveTone: boolean;
}

interface AIInterviewModeProps {
  availableVoices: Array<{ id: string; name: string; description: string }>;
  onGenerate?: (interview: any) => void;
}

const INTERVIEW_TEMPLATES = [
  {
    id: 'pastoral',
    name: '🙏 Pastoral Journey',
    description: 'Explore calling, ministry challenges, and spiritual insights',
    questions: [
      'Tell us about your calling to ministry',
      'What has been your greatest challenge in pastoral work?',
      'How do you maintain spiritual health while serving others?'
    ]
  },
  {
    id: 'testimony',
    name: '✨ Personal Testimony',
    description: 'Share transformation stories and faith experiences',
    questions: [
      'Can you share your faith journey with us?',
      'What was the turning point in your spiritual life?',
      'How has faith changed your daily life?'
    ]
  },
  {
    id: 'expertise',
    name: '📚 Expert Interview',
    description: 'Deep dive into theological or ministry expertise',
    questions: [
      'What led you to specialize in this area?',
      'What are the biggest misconceptions about your field?',
      'What practical advice would you give to churches?'
    ]
  },
  {
    id: 'current',
    name: '🌍 Current Events',
    description: 'Discuss faith perspectives on contemporary issues',
    questions: [
      'How should Christians respond to current events?',
      'What biblical principles apply to this situation?',
      'How can the church be a positive influence?'
    ]
  }
];

export default function AIInterviewMode({ availableVoices, onGenerate }: AIInterviewModeProps) {
  const [settings, setSettings] = useState<InterviewSettings>({
    topic: '',
    guestName: '',
    guestExpertise: '',
    interviewStyle: 'conversational',
    duration: 15,
    hostVoiceId: availableVoices[0]?.id || '',
    guestVoiceId: availableVoices[1]?.id || '',
    autoFollowUp: true,
    adaptiveTone: true
  });

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewScript, setInterviewScript] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate AI questions based on settings
  const generateQuestions = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in real app, this would call your API)
    setTimeout(() => {
      const generatedQuestions: InterviewQuestion[] = [
        {
          id: 'q1',
          question: `${settings.guestName}, thank you for joining us today. Could you start by telling our listeners about your background in ${settings.guestExpertise}?`,
          followUps: [
            'What initially drew you to this field?',
            'How has your perspective evolved over time?'
          ],
          category: 'opening',
          tone: 'friendly',
          expectedDuration: 90
        },
        {
          id: 'q2',
          question: `Let's dive into ${settings.topic}. What's your unique perspective on this?`,
          followUps: [
            'Can you give us a specific example?',
            'How does this differ from traditional views?'
          ],
          category: 'expertise',
          tone: 'serious',
          expectedDuration: 120
        },
        {
          id: 'q3',
          question: `What challenges have you faced in this area, and how did you overcome them?`,
          followUps: [
            'What did you learn from that experience?',
            'How would you advise others facing similar challenges?'
          ],
          category: 'personal',
          tone: 'empathetic',
          expectedDuration: 120
        },
        {
          id: 'q4',
          question: `Some people might argue differently about ${settings.topic}. How would you respond to critics?`,
          followUps: [
            'What evidence supports your position?',
            'Where do you think the disagreement stems from?'
          ],
          category: 'controversial',
          tone: 'challenging',
          expectedDuration: 90
        },
        {
          id: 'q5',
          question: `As we wrap up, what's the one key takeaway you want our listeners to remember?`,
          followUps: [
            'How can they apply this in their daily lives?',
            'Where can people learn more about your work?'
          ],
          category: 'closing',
          tone: 'friendly',
          expectedDuration: 60
        }
      ];
      
      setQuestions(generatedQuestions);
      setIsGenerating(false);
    }, 2000);
  };

  // Generate follow-up question based on context
  const generateFollowUp = (currentQuestion: InterviewQuestion) => {
    const followUp = currentQuestion.followUps[Math.floor(Math.random() * currentQuestion.followUps.length)];
    return {
      ...currentQuestion,
      id: `${currentQuestion.id}-followup`,
      question: followUp,
      followUps: [],
      expectedDuration: 45
    };
  };

  // Add custom question
  const addCustomQuestion = () => {
    const newQuestion: InterviewQuestion = {
      id: `custom-${Date.now()}`,
      question: '',
      followUps: [],
      category: 'expertise',
      tone: 'friendly',
      expectedDuration: 60
    };
    setQuestions([...questions, newQuestion]);
  };

  // Update question
  const updateQuestion = (id: string, updates: Partial<InterviewQuestion>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  // Delete question
  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Reorder questions
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    setQuestions(newQuestions);
  };

  // Generate full interview script
  const generateInterviewScript = () => {
    let script = `HOST: Welcome to our AI-powered interview series! Today we have ${settings.guestName}, an expert in ${settings.guestExpertise}, joining us to discuss ${settings.topic}.\n\n`;
    
    questions.forEach((q, index) => {
      script += `HOST: ${q.question}\n\n`;
      script += `${settings.guestName.toUpperCase()}: [AI will generate response based on expertise and context]\n\n`;
      
      if (settings.autoFollowUp && q.followUps.length > 0 && Math.random() > 0.5) {
        const followUp = q.followUps[0];
        script += `HOST: That's fascinating! ${followUp}\n\n`;
        script += `${settings.guestName.toUpperCase()}: [AI will generate follow-up response]\n\n`;
      }
    });
    
    script += `HOST: ${settings.guestName}, thank you so much for sharing your insights with us today. This has been an enlightening conversation!\n\n`;
    script += `${settings.guestName.toUpperCase()}: Thank you for having me! It's been a pleasure discussing ${settings.topic} with you and your listeners.`;
    
    setInterviewScript(script);
  };

  // Calculate total duration
  const calculateDuration = () => {
    return questions.reduce((total, q) => total + q.expectedDuration, 0);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-400" />
            AI Interview Mode
          </h2>
          <p className="text-pink-100/80">Create dynamic interviews with AI-powered Q&A</p>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold"
        >
          <Settings className="w-4 h-4 inline mr-2" />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      {/* Interview Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Basic Settings */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Interview Setup</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Topic</label>
              <Input
                value={settings.topic}
                onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
                placeholder="What's the interview about?"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Guest Name</label>
              <Input
                value={settings.guestName}
                onChange={(e) => setSettings({ ...settings, guestName: e.target.value })}
                placeholder="Who are we interviewing?"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Guest Expertise</label>
              <Input
                value={settings.guestExpertise}
                onChange={(e) => setSettings({ ...settings, guestExpertise: e.target.value })}
                placeholder="What's their area of expertise?"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Interview Style</label>
              <select
                value={settings.interviewStyle}
                onChange={(e) => setSettings({ ...settings, interviewStyle: e.target.value as any })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="conversational">💬 Conversational</option>
                <option value="formal">👔 Formal</option>
                <option value="debate">⚔️ Debate</option>
                <option value="storytelling">📖 Storytelling</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">
                Duration: {settings.duration} minutes
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={settings.duration}
                onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Voice Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Host Voice</label>
              <select
                value={settings.hostVoiceId}
                onChange={(e) => setSettings({ ...settings, hostVoiceId: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {availableVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Guest Voice</label>
              <select
                value={settings.guestVoiceId}
                onChange={(e) => setSettings({ ...settings, guestVoiceId: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {availableVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
            
            {showAdvanced && (
              <>
                <div>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={settings.autoFollowUp}
                      onChange={(e) => setSettings({ ...settings, autoFollowUp: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Enable Auto Follow-ups</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={settings.adaptiveTone}
                      onChange={(e) => setSettings({ ...settings, adaptiveTone: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Adaptive Tone (AI adjusts based on responses)</span>
                  </label>
                </div>
              </>
            )}
            
            {/* Templates */}
            <div>
              <label className="block text-sm font-bold text-pink-200 mb-2">Quick Templates</label>
              <div className="grid grid-cols-2 gap-2">
                {INTERVIEW_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setSettings({ ...settings, topic: template.name });
                    }}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'bg-purple-500/30 border border-purple-400'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-white font-bold text-sm">{template.name}</div>
                    <div className="text-pink-200/60 text-xs">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Questions Button */}
      <div className="text-center mb-8">
        <button
          onClick={generateQuestions}
          disabled={!settings.topic || !settings.guestName || isGenerating}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 inline mr-2 animate-spin" />
              Generating AI Questions...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 inline mr-2" />
              Generate Interview Questions
            </>
          )}
        </button>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Interview Questions</h3>
            <div className="flex items-center space-x-4">
              <div className="text-pink-100/80">
                <Clock className="w-4 h-4 inline mr-1" />
                {Math.floor(calculateDuration() / 60)} min
              </div>
              <button
                onClick={addCustomQuestion}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all text-sm font-bold"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Add Question
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white/10 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-300 font-bold">Q{index + 1}</span>
                    <Badge className={`
                      ${question.category === 'opening' ? 'bg-green-500/20 text-green-300' : ''}
                      ${question.category === 'personal' ? 'bg-blue-500/20 text-blue-300' : ''}
                      ${question.category === 'expertise' ? 'bg-purple-500/20 text-purple-300' : ''}
                      ${question.category === 'controversial' ? 'bg-orange-500/20 text-orange-300' : ''}
                      ${question.category === 'closing' ? 'bg-red-500/20 text-red-300' : ''}
                    `}>
                      {question.category}
                    </Badge>
                    <Badge className="bg-white/10 text-pink-200">
                      {question.tone}
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      className="p-1 hover:bg-white/10 rounded transition-all"
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      className="p-1 hover:bg-white/10 rounded transition-all"
                      disabled={index === questions.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-all text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mb-2"
                  rows={2}
                />
                
                {question.followUps.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-purple-500/30">
                    <div className="text-xs text-pink-200/60 mb-1">Follow-ups:</div>
                    {question.followUps.map((followUp, fIndex) => (
                      <div key={fIndex} className="text-sm text-pink-100/80 mb-1">
                        • {followUp}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 text-xs text-pink-200/60">
                  Expected duration: {question.expectedDuration}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Interview Button */}
      {questions.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={generateInterviewScript}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold"
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Preview Script
          </button>
          
          <button
            onClick={() => {
              generateInterviewScript();
              onGenerate?.({
                settings,
                questions,
                script: interviewScript
              });
            }}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-pink-500/30"
          >
            <Play className="w-4 h-4 inline mr-2" />
            Generate Interview Podcast
          </button>
        </div>
      )}

      {/* Script Preview */}
      {interviewScript && (
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Interview Script Preview</h3>
          <div className="bg-black/30 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="text-pink-100/80 whitespace-pre-wrap text-sm font-mono">
              {interviewScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}