import AIPodcastGenerator from "@/components/ai-podcast-generator";
import AIPrayerResponder from "@/components/ai-prayer-responder";
import AISermonGenerator from "@/components/ai-sermon-generator";
import AutoSocialGraphics from "@/components/auto-social-graphics";
import ChurchAnalytics from "@/components/church-analytics";
import SermonHighlights from "@/components/sermon-highlights";
import SermonRepurposer from "@/components/sermon-repurposer";
import SmartScriptureSuggestions from "@/components/smart-scripture-suggestions";
import SocialAutomation from "@/components/social-automation";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Sermon, VoiceRecording } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronLeft, Clipboard, Copy, Download, FileText, Lightbulb, List, Mic, Play, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

interface SermonSection {
  title: string;
  content: string;
  notes: string;
}

export default function SermonPrepWorkspace() {
  const [title, setTitle] = useState("Finding Hope in the Storm");
  const [scripture, setScripture] = useState("Psalm 42:11");
  const [topic, setTopic] = useState("Hope in difficult times");
  const [sections, setSections] = useState<SermonSection[]>([
    {
      title: "I. Introduction: The Reality of Life's Storms",
      content: "",
      notes: "Every believer faces storms in life. Psalm 42 shows us David's honest struggle with depression and doubt, yet points us toward hope.",
    },
    {
      title: "II. The Question of the Soul (v. 5)",
      content: "",
      notes: '"Why are you downcast, O my soul?" - Learning to dialogue with our emotions rather than be ruled by them.',
    },
    {
      title: "III. The Answer of Faith (v. 11)",
      content: "",
      notes: '"Put your hope in God, for I will yet praise him" - Moving from despair to declaration of faith.',
    },
  ]);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedIllustration, setExpandedIllustration] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const fullIllustration = `Consider the story of the lighthouse keeper who maintained hope through every storm. For decades, Thomas stood watch on the rocky coastline, his beacon cutting through the darkness to guide ships safely to shore. 

Night after night, through howling winds and crashing waves, he tended his light. When storms threatened to extinguish his flame, he shielded it with his own body. When supply ships couldn't reach him for weeks, he rationed his oil and trimmed his wick with meticulous care.

The ships that passed in calm seas never knew his name, but those caught in tempests blessed him as their salvation. Thomas understood that hope isn't the absence of storms—it's the unwavering commitment to keep the light burning when darkness seems overwhelming.

Like Thomas, we are called to be bearers of light in a world that often feels lost at sea. Our faith may flicker, our circumstances may howl like wind, but the Light of the World burns within us, and through us, others find their way home.

Application: When you face your darkest moments, remember that you are a lighthouse keeper. Your hope doesn't just sustain you—it guides others to safety. Keep your light burning, not just for yourself, but for the countless souls navigating their storms, looking for a beacon of hope.`;

  // Load any autosaved draft and Scripture Engine additions on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Load autosaved draft first
      const draft = localStorage.getItem('sermonWorkspaceDraft');
      if (draft) {
        const parsed = JSON.parse(draft) as { title?: string; scripture?: string; topic?: string; sections?: SermonSection[] };
        if (parsed.title) setTitle(parsed.title);
        if (parsed.scripture) setScripture(parsed.scripture);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length) setSections(parsed.sections);
      }

      // Import verses saved in Scripture Engine (one-time)
      const key = 'sermonDraftAdditions';
      const additions = JSON.parse(localStorage.getItem(key) || '[]') as Array<{ reference: string; text: string; version: string }>;
      if (additions.length) {
        const mapped = additions.map((v, i) => ({
          title: `${sections.length + i + 1}. ${v.reference}`,
          content: v.text,
          notes: `Version: ${v.version}`,
        }));
        if (mapped.length) {
          setSections((prev) => [...prev, ...mapped]);
          localStorage.removeItem(key);
          toast({ title: 'Added verses from Scripture Engine', description: `${mapped.length} verse(s) appended to your outline.` });
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({ title, scripture, topic, sections });
    try {
      localStorage.setItem('sermonWorkspaceDraft', payload);
    } catch {}
  }, [title, scripture, topic, sections]);

  const { data: sermons = [] } = useQuery<Sermon[]>({
    queryKey: ['/api/sermons'],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sermonData = {
        title,
        scripture,
        outline: { sections },
        status: 'draft',
      };
      const response = await apiRequest('POST', '/api/sermons', sermonData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sermons'] });
      toast({
        title: "Sermon saved!",
        description: "Your sermon has been saved successfully.",
      });
    },
  });

  // Advanced OpenAI Features
  const advancedAIMutation = useMutation({
    mutationFn: async (type: string) => {
      const prompt = `${topic}: ${title} - ${scripture}`;
      const response = await apiRequest('POST', '/api/chat', {
        message: prompt,
        type: type,
        context: JSON.stringify({ topic, scripture, title })
      });
      return response.json();
    },
    onSuccess: (data, type) => {
      if (type === 'theological_analysis') {
        toast({
          title: "🧠 Theological Analysis Complete",
          description: "Advanced AI analysis has been generated. Check the response below."
        });
      } else if (type === 'live_prayer') {
        toast({
          title: "🙏 Prayer Session Ready",
          description: "Your voice-interactive prayer session is ready to begin."
        });
      } else if (type === 'pastoral_counseling') {
        toast({
          title: "💝 Counseling Available", 
          description: "AI pastoral guidance has been prepared for you."
        });
      } else if (type === 'worship_creation') {
        toast({
          title: "🎵 Worship Experience Created",
          description: "Multi-modal worship service has been generated."
        });
      }
      
      // You could display the results in a modal or dedicated section
      console.log('Advanced AI Response:', data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process AI request. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAdvancedAI = (type: string) => {
    advancedAIMutation.mutate(type);
  };

  const generateOutlineMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/generate-sermon-outline', {
        topic: topic || title,
        scripture,
        audienceType: 'general congregation',
        sermonLength: '25-30 minutes',
        style: 'expository',
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.outline && data.outline.sections) {
        const newSections = data.outline.sections.map((section: any) => ({
          title: section.title,
          content: section.content,
          notes: section.notes,
        }));
        setSections(newSections);
        toast({
          title: "✨ AI Outline Generated!",
          description: "Your sermon outline has been created with Gemini AI.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Unable to generate outline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: crossReferences = [] } = useQuery<Array<{ reference: string; text: string; relevance: number }>>({
    queryKey: ['/api/scripture/cross-references', encodeURIComponent(scripture)],
    enabled: !!scripture,
  });

  const { data: voiceRecordings = [] } = useQuery<VoiceRecording[]>({
    queryKey: ['/api/voice-recordings'],
  });

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `${sections.length + 1}. New Section`,
        content: "",
        notes: "",
      },
    ]);
  };

  const updateSection = (index: number, field: keyof SermonSection, value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setSections(updatedSections);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setSections(updated);
  };

  const deleteSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const duplicateSection = (index: number) => {
    const copy = { ...sections[index] };
    const updated = [...sections];
    updated.splice(index + 1, 0, copy);
    setSections(updated);
  };

  const exportMarkdown = () => {
    const md = [
      `# ${title}`,
      scripture ? `\n> ${scripture}\n` : '',
      ...sections.map((s, i) => `\n## ${s.title || `Section ${i + 1}`}\n\n${s.content || ''}\n\n${s.notes ? `_Notes:_ ${s.notes}` : ''}`),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase() || 'sermon'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Sermon outline exported to Markdown.' });
  };

  const exportTXT = () => {
    const text = [
      title,
      scripture ? `\nScripture: ${scripture}\n` : '\n',
      ...sections.map((s, i) => {
        let sectionText = `\n${s.title || `Section ${i + 1}`}\n${'='.repeat((s.title || `Section ${i + 1}`).length)}\n\n`;
        if (s.content) {
          sectionText += `${s.content}\n\n`;
        }
        if (s.notes) {
          sectionText += `Notes: ${s.notes}\n\n`;
        }
        return sectionText;
      }),
    ].join('');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase() || 'sermon'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Sermon outline exported to TXT.' });
  };

  const exportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 30);
      
      // Scripture
      if (scripture) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'italic');
        doc.text(`Scripture: ${scripture}`, 20, 45);
      }
      
      let yPosition = scripture ? 65 : 50;
      const pageHeight = doc.internal.pageSize.height;
      const lineHeight = 7;
      const margin = 20;
      const maxWidth = doc.internal.pageSize.width - 2 * margin;
      
      sections.forEach((section, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const sectionTitle = section.title || `Section ${index + 1}`;
        doc.text(sectionTitle, margin, yPosition);
        yPosition += lineHeight + 5;
        
        // Section content
        if (section.content) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          const contentLines = doc.splitTextToSize(section.content, maxWidth);
          contentLines.forEach((line: string) => {
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = 30;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 5;
        }
        
        // Section notes
        if (section.notes) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          const notesText = `Notes: ${section.notes}`;
          const notesLines = doc.splitTextToSize(notesText, maxWidth);
          notesLines.forEach((line: string) => {
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = 30;
            }
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += 10;
        }
      });
      
      doc.save(`${title.replace(/\s+/g, '_').toLowerCase() || 'sermon'}.pdf`);
      toast({ title: 'Exported', description: 'Sermon outline exported to PDF.' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Unable to export PDF. Please try again.', variant: 'destructive' });
    }
  };

  const exportDOC = () => {
    // Create DOC content using HTML format that can be opened by Word
    const docContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2d3748; margin-bottom: 10px; }
            h2 { color: #4a5568; margin-top: 30px; margin-bottom: 15px; }
            .scripture { font-style: italic; margin-bottom: 30px; color: #666; }
            .notes { background-color: #f7fafc; padding: 15px; margin-top: 15px; border-left: 4px solid #4299e1; }
            .content { margin-bottom: 15px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${scripture ? `<p class="scripture">Scripture: ${scripture}</p>` : ''}
          ${sections.map((section, index) => `
            <h2>${section.title || `Section ${index + 1}`}</h2>
            ${section.content ? `<div class="content">${section.content.replace(/\n/g, '<br>')}</div>` : ''}
            ${section.notes ? `<div class="notes"><strong>Notes:</strong> ${section.notes.replace(/\n/g, '<br>')}</div>` : ''}
          `).join('')}
        </body>
      </html>
    `;
    
    const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase() || 'sermon'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Sermon outline exported to DOC.' });
  };

  const copyOutline = async () => {
    const text = `${title}\n${scripture ? `(${scripture})\n` : ''}\n${sections
      .map((s, i) => `${i + 1}. ${s.title}\n${s.content ? `   ${s.content}\n` : ''}${s.notes ? `   (${s.notes})` : ''}`)
      .join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Outline copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Unable to copy to clipboard.', variant: 'destructive' });
    }
  };

  const handleSermonGenerated = (sermon: any) => {
    // Update the sermon with AI-generated content
    setTitle(sermon.title);
    setScripture(sermon.scripture);
    setTopic(sermon.theme);
    
    // Convert AI sermon structure to existing sections format
    const newSections = sermon.mainPoints?.map((point: any, index: number) => ({
      title: `${index + 1}. ${point.title}`,
      content: point.explanation,
      notes: `${point.application}\n\nIllustration: ${point.illustration}\n\nScripture: ${point.scripture}`,
    })) || [];
    
    setSections(newSections);
    
    toast({
      title: "🎯 Sermon Generated Successfully!",
      description: `AI has created a complete sermon outline for "${sermon.title}". Scroll down to see your outline!`,
    });
    
    // Scroll to the sermon outline section
    setTimeout(() => {
      const outlineSection = document.querySelector('[data-testid="sermon-outline"]');
      if (outlineSection) {
        outlineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  const handleScriptureSelected = (reference: string, text: string) => {
    // Auto-fill the scripture field when a verse is selected
    setScripture(reference);
    toast({
      title: "Scripture Added!",
      description: `${reference} has been added to your sermon`,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, `voice-note-${Date.now()}.wav`);
        
        try {
          const response = await apiRequest('POST', '/api/voice-recordings', formData);
          const result = await response.json();
          
          // Refresh voice recordings
          queryClient.invalidateQueries({ queryKey: ['/api/voice-recordings'] });
          
          toast({
            title: "Voice Note Saved!",
            description: "Your voice recording has been saved successfully",
          });
        } catch (error) {
          toast({
            title: "Save Failed",
            description: "Unable to save voice recording. Please try again.",
            variant: "destructive",
          });
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
        setIsRecording(false);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Tap the button again to stop recording",
      });
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <section id="sermon-prep" className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 relative z-10" data-testid="sermon-prep-workspace">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors group glass-card px-4 py-2 rounded-xl">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </button>
          </Link>
        </div>
        
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-divine-500 to-sacred-500 bg-clip-text text-transparent">
            Sermon Preparation Workspace
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto px-4">Create compelling, biblically-grounded sermons with AI assistance</p>
        </div>
        
        {/* AI Sermon Generator - KILLER FEATURE */}
        <AISermonGenerator onSermonGenerated={handleSermonGenerated} />
        
        {/* Smart Scripture Suggestions - KILLER FEATURE #2 */}
        <SmartScriptureSuggestions onScriptureSelected={handleScriptureSelected} />
        
        {/* Auto Social Media Graphics - KILLER FEATURE #3 */}
        <AutoSocialGraphics sermonTitle={title} sermonScripture={scripture} />
        
        {/* AI Prayer Request Responder - KILLER FEATURE #4 */}
        <AIPrayerResponder />
        
        {/* AI Sermon Repurposer - KILLER FEATURE #5 */}
        <SermonRepurposer />
        
        {/* AI Church Analytics - KILLER FEATURE #6 */}
        <ChurchAnalytics />
        
        {/* Social Media Automation - KILLER FEATURE #7 */}
        <SocialAutomation />
        
        {/* Sermon Highlights Extractor - KILLER FEATURE #8 */}
        <SermonHighlights />
        
        {/* AI Podcast Generator - KILLER FEATURE #9 */}
        <AIPodcastGenerator />
        
        {/* NEW: Advanced OpenAI Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {/* Theological AI Analysis */}
          <GlassCard className="p-4 premium-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">Theological AI</h4>
              <p className="text-xs text-gray-600 mb-3">Deep analysis with GPT-5</p>
              <Button 
                onClick={() => handleAdvancedAI('theological_analysis')}
                size="sm" 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Analyze
              </Button>
            </div>
          </GlassCard>

          {/* Live Prayer Session */}
          <GlassCard className="p-4 premium-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🙏</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">Live Prayer AI</h4>
              <p className="text-xs text-gray-600 mb-3">Voice prayer companion</p>
              <Button 
                onClick={() => handleAdvancedAI('live_prayer')}
                size="sm" 
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                Start Prayer
              </Button>
            </div>
          </GlassCard>

          {/* AI Pastoral Counseling */}
          <GlassCard className="p-4 premium-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">💝</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">AI Counselor</h4>
              <p className="text-xs text-gray-600 mb-3">Pastoral guidance with AI</p>
              <Button 
                onClick={() => handleAdvancedAI('pastoral_counseling')}
                size="sm" 
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              >
                Get Guidance
              </Button>
            </div>
          </GlassCard>

          {/* Worship Experience Creator */}
          <GlassCard className="p-4 premium-shadow">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">🎵</span>
              </div>
              <h4 className="font-semibold text-sm mb-2">Worship Creator</h4>
              <p className="text-xs text-gray-600 mb-3">Multi-modal worship</p>
              <Button 
                onClick={() => handleAdvancedAI('worship_creation')}
                size="sm" 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Create
              </Button>
            </div>
          </GlassCard>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sermon Outline */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6 premium-shadow" data-testid="sermon-outline">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <List className="text-divine-500 mr-3" />
                  Sermon Outline
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    className="bg-divine-600 hover:bg-divine-500"
                    onClick={() => generateOutlineMutation.mutate()}
                    disabled={generateOutlineMutation.isPending}
                    data-testid="generate-outline-button"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateOutlineMutation.isPending ? "Generating..." : "AI Generate"}
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-celestial-700 hover:bg-celestial-600"
                    data-testid="save-outline-button"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={exportPDF}
                      data-testid="export-pdf-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={exportDOC}
                      data-testid="export-doc-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      DOC
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={exportTXT}
                      data-testid="export-txt-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      TXT
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-celestial-800 hover:bg-celestial-700"
                      onClick={exportMarkdown}
                      data-testid="export-markdown-button"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      MD
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-celestial-800 hover:bg-celestial-700"
                      onClick={copyOutline}
                      data-testid="copy-outline-button"
                    >
                      <Clipboard className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-celestial-800/30 rounded-lg p-4">
                  <Input
                    type="text"
                    placeholder="Sermon Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-xl font-semibold border-none outline-none mb-2"
                    data-testid="sermon-title-input"
                  />
                  <Input
                    type="text"
                    placeholder="Main Scripture"
                    value={scripture}
                    onChange={(e) => setScripture(e.target.value)}
                    className="w-full bg-transparent text-divine-400 border-none outline-none mb-2"
                    data-testid="sermon-scripture-input"
                  />
                  <Input
                    type="text"
                    placeholder="Sermon Topic (for AI generation)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-transparent text-gray-300 border-none outline-none"
                    data-testid="sermon-topic-input"
                  />
                </div>
                
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div
                      key={index}
                      className={`bg-celestial-800/30 rounded-lg p-4 border-l-4 ${
                        index % 3 === 0 ? 'border-divine-500' :
                        index % 3 === 1 ? 'border-sacred-500' : 'border-divine-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        className="font-semibold mb-2 bg-transparent border-none"
                        data-testid={`section-title-${index}`}
                      />
                        <div className="flex items-center gap-1 ml-2">
                          <Button size="icon" variant="ghost" onClick={() => moveSection(index, 'up')} aria-label="Move up">
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => moveSection(index, 'down')} aria-label="Move down">
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => duplicateSection(index)} aria-label="Duplicate">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteSection(index)} aria-label="Delete" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        rows={4}
                        value={section.content}
                        onChange={(e) => updateSection(index, 'content', e.target.value)}
                        placeholder="Draft your main content for this section..."
                        className="w-full bg-transparent resize-y border-none outline-none text-gray-300 mb-2"
                        data-testid={`section-content-${index}`}
                      />
                      <Textarea
                        rows={3}
                        value={section.notes}
                        onChange={(e) => updateSection(index, 'notes', e.target.value)}
                        placeholder="Add notes and talking points..."
                        className="w-full bg-transparent resize-none border-none outline-none text-gray-300"
                        data-testid={`section-notes-${index}`}
                      />
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={addSection}
                  className="w-full bg-gradient-to-r from-divine-600 to-sacred-600 hover:from-divine-500 hover:to-sacred-500"
                  data-testid="add-section-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </GlassCard>
          </div>
          
          {/* AI Insights Panel */}
          <div className="space-y-6">
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Lightbulb className="text-divine-500 mr-3" />
                AI Insights
              </h3>
              
              <div className="space-y-4">
                <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-3">
                  <h5 className="font-medium mb-2 text-divine-400">Cross References</h5>
                  <div className="space-y-1 text-sm">
                    {crossReferences.length > 0 ? (
                      crossReferences.map((ref: any, index: number) => (
                        <div
                          key={index}
                          className="cursor-pointer hover:text-divine-400 transition-colors"
                          data-testid={`cross-reference-${index}`}
                          onClick={() => handleScriptureSelected(ref.reference, ref.text || '')}
                        >
                          {ref.reference}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="cursor-pointer hover:text-divine-400 transition-colors">Romans 8:28</div>
                        <div className="cursor-pointer hover:text-divine-400 transition-colors">2 Corinthians 4:17</div>
                        <div className="cursor-pointer hover:text-divine-400 transition-colors">Isaiah 43:2</div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-sacred-600/10 border border-sacred-600/30 rounded-lg p-3">
                  <h5 className="font-medium mb-2 text-sacred-400">Illustrations</h5>
                  <div className="text-sm text-gray-300">
                    {!expandedIllustration ? (
                      <>
                        <p>Consider the story of the lighthouse keeper who maintained hope through every storm...</p>
                        <button 
                          onClick={() => setExpandedIllustration(true)}
                          className="text-sacred-400 hover:text-sacred-300 mt-1 underline transition-colors"
                        >
                          Read more
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="whitespace-pre-line">{fullIllustration}</div>
                        <button 
                          onClick={() => setExpandedIllustration(false)}
                          className="text-sacred-400 hover:text-sacred-300 mt-3 underline transition-colors"
                        >
                          Show less
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-celestial-600/10 border border-celestial-600/30 rounded-lg p-3">
                  <h5 className="font-medium mb-2 text-celestial-400">Application Points</h5>
                  <div className="text-sm space-y-1">
                    <div>• Practice gratitude daily</div>
                    <div>• Build spiritual disciplines</div>
                    <div>• Surround yourself with faith community</div>
                  </div>
                </div>
              </div>
            </GlassCard>
            
            {/* Voice Recording */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mic className="text-sacred-500 mr-3" />
                Voice Notes
              </h3>
              
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleVoiceRecording}
                  className={`w-16 h-16 rounded-full hover:scale-110 transition-all mx-auto mb-4 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-sacred-600 to-divine-600'
                  }`}
                  data-testid="record-voice-button"
                >
                  <Mic className="w-6 h-6" />
                </Button>
                <p className="text-sm text-gray-400">
                  {isRecording ? 'Recording... Tap to stop' : 'Tap to record voice notes'}
                </p>
                
                <div className="mt-4 space-y-2">
                  {voiceRecordings.slice(0, 2).map((recording: any) => (
                    <div
                      key={recording.id}
                      className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-divine-500"
                          data-testid={`play-recording-${recording.id}`}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">{recording.title || 'Untitled Recording'}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {recording.duration ? `${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}` : '2:34'}
                      </span>
                    </div>
                  ))}
                  
                  {voiceRecordings.length === 0 && (
                    <div className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-divine-500"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">Introduction thoughts</span>
                      </div>
                      <span className="text-xs text-gray-400">2:34</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
