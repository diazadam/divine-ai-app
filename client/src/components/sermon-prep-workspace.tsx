import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { List, Wand2, Save, Plus, Lightbulb, Mic, Play, ChevronLeft, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Sermon } from "@shared/schema";

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

  const { data: crossReferences = [] } = useQuery({
    queryKey: ['/api/scripture/cross-references', scripture],
    enabled: !!scripture,
  });

  const { data: voiceRecordings = [] } = useQuery({
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

  return (
    <section id="sermon-prep" className="pt-24 pb-16 min-h-screen relative z-10" data-testid="sermon-prep-workspace">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sermon Outline */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6 premium-shadow">
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
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        className="font-semibold mb-2 bg-transparent border-none"
                        data-testid={`section-title-${index}`}
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
                    <p>Consider the story of the lighthouse keeper who maintained hope through every storm...</p>
                    <button className="text-sacred-400 hover:text-sacred-300 mt-1">Read more</button>
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
                  className="w-16 h-16 bg-gradient-to-r from-sacred-600 to-divine-600 rounded-full hover:scale-110 transition-transform mx-auto mb-4"
                  data-testid="record-voice-button"
                >
                  <Mic className="w-6 h-6" />
                </Button>
                <p className="text-sm text-gray-400">Tap to record voice notes</p>
                
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
