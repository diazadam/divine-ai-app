import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Podcast, 
  CloudUpload, 
  Wand2, 
  History, 
  Play, 
  Pause, 
  Edit, 
  Download, 
  BarChart3,
  ChevronLeft 
} from "lucide-react";
import { Link } from "wouter";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import type { Podcast as PodcastType } from "@shared/schema";

export default function PodcastStudio() {
  const [title, setTitle] = useState("Finding Hope in the Storm - Part 1");
  const [description, setDescription] = useState("In this powerful message, Pastor explores how we can find hope even in life's most challenging storms. Drawing from Psalm 42, we discover practical ways to move from despair to declaration of faith.");
  const [processingOptions, setProcessingOptions] = useState({
    noiseReduction: true,
    introOutro: true,
    backgroundMusic: false,
    chapterMarkers: true,
  });

  const queryClient = useQueryClient();

  const { data: podcasts = [] } = useQuery<PodcastType[]>({
    queryKey: ['/api/podcasts'],
  });

  const generatePodcastMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate podcast');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/podcasts'] });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('noiseReduction', processingOptions.noiseReduction.toString());
    formData.append('introOutro', processingOptions.introOutro.toString());
    formData.append('backgroundMusic', processingOptions.backgroundMusic.toString());
    formData.append('chapterMarkers', processingOptions.chapterMarkers.toString());

    generatePodcastMutation.mutate(formData);
  };

  return (
    <section id="podcasts" className="pt-24 pb-16 min-h-screen relative z-10" data-testid="podcast-studio">
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-sacred-500 to-divine-500 bg-clip-text text-transparent">
            Podcast Creation Studio
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">Transform your sermons into professional podcasts with AI enhancement</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Podcast Creation */}
          <GlassCard className="p-6 premium-shadow">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Podcast className="text-sacred-500 mr-3" />
              Create New Podcast
            </h3>
            
            <div className="space-y-6">
              {/* Upload Audio */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-sacred-500 transition-colors">
                <CloudUpload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Upload Sermon Audio</h4>
                <p className="text-gray-400 mb-4">Drag and drop your sermon recording or click to browse</p>
                <div className="mt-4">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio-upload"
                    data-testid="audio-upload-input"
                  />
                  <label
                    htmlFor="audio-upload"
                    className="bg-sacred-600 hover:bg-sacred-500 px-4 py-2 rounded-lg transition-colors cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                </div>
              </div>
              
              {/* Processing Options */}
              <div className="bg-celestial-800/30 rounded-lg p-4">
                <h4 className="font-semibold mb-3">AI Enhancement Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="noise-reduction"
                      checked={processingOptions.noiseReduction}
                      onCheckedChange={(checked) => 
                        setProcessingOptions(prev => ({ ...prev, noiseReduction: !!checked }))
                      }
                      data-testid="noise-reduction-checkbox"
                    />
                    <label htmlFor="noise-reduction" className="text-sm">Noise reduction and audio cleanup</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="intro-outro"
                      checked={processingOptions.introOutro}
                      onCheckedChange={(checked) => 
                        setProcessingOptions(prev => ({ ...prev, introOutro: !!checked }))
                      }
                      data-testid="intro-outro-checkbox"
                    />
                    <label htmlFor="intro-outro" className="text-sm">Automatic intro/outro generation</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="background-music"
                      checked={processingOptions.backgroundMusic}
                      onCheckedChange={(checked) => 
                        setProcessingOptions(prev => ({ ...prev, backgroundMusic: !!checked }))
                      }
                      data-testid="background-music-checkbox"
                    />
                    <label htmlFor="background-music" className="text-sm">Background music integration</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="chapter-markers"
                      checked={processingOptions.chapterMarkers}
                      onCheckedChange={(checked) => 
                        setProcessingOptions(prev => ({ ...prev, chapterMarkers: !!checked }))
                      }
                      data-testid="chapter-markers-checkbox"
                    />
                    <label htmlFor="chapter-markers" className="text-sm">Chapter markers and timestamps</label>
                  </div>
                </div>
              </div>
              
              {/* Podcast Details */}
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Podcast Episode Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-celestial-800/50 border border-white/10 rounded-lg"
                  data-testid="podcast-title-input"
                />
                <Textarea
                  rows={4}
                  placeholder="Episode description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-celestial-800/50 border border-white/10 rounded-lg resize-none"
                  data-testid="podcast-description-input"
                />
              </div>
              
              <Button
                disabled={generatePodcastMutation.isPending}
                className="w-full bg-gradient-to-r from-sacred-600 to-divine-600 hover:from-sacred-500 hover:to-divine-500"
                data-testid="generate-podcast-button"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generatePodcastMutation.isPending ? 'Generating...' : 'Generate Podcast'}
              </Button>
            </div>
          </GlassCard>
          
          {/* Recent Podcasts & Analytics */}
          <div className="space-y-6">
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <History className="text-divine-500 mr-3" />
                Recent Podcasts
              </h3>
              
              <div className="space-y-4">
                {podcasts.length > 0 ? (
                  podcasts.slice(0, 3).map((podcast) => (
                    <div
                      key={podcast.id}
                      className="bg-celestial-800/30 rounded-lg p-4 flex items-center space-x-4"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-sacred-600 to-divine-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        {podcast.status === 'completed' ? (
                          <Play className="w-6 h-6" />
                        ) : (
                          <Pause className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{podcast.title}</h4>
                        <p className="text-sm text-gray-400">
                          Episode • {podcast.duration ? `${Math.floor(podcast.duration / 60)}:${(podcast.duration % 60).toString().padStart(2, '0')}` : 'Processing...'}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            podcast.status === 'completed' 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {podcast.status === 'completed' ? 'Published' : 'Processing'}
                          </span>
                          {podcast.status === 'completed' && (
                            <span className="text-xs text-gray-500">{podcast.playCount || 0} plays</span>
                          )}
                        </div>
                        {podcast.status === 'processing' && (
                          <Progress value={75} className="w-full mt-2" />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          data-testid={`edit-podcast-${podcast.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2 hover:bg-white/10 rounded transition-colors"
                          data-testid={`download-podcast-${podcast.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Default podcast examples */}
                    <div className="bg-celestial-800/30 rounded-lg p-4 flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-sacred-600 to-divine-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">The Power of Prayer</h4>
                        <p className="text-sm text-gray-400">Episode 12 • 42:15</p>
                        <div className="flex space-x-2 mt-2">
                          <span className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded">Published</span>
                          <span className="text-xs text-gray-500">2.1K plays</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="icon" variant="ghost" className="p-2 hover:bg-white/10 rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="p-2 hover:bg-white/10 rounded transition-colors">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-celestial-800/30 rounded-lg p-4 flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-divine-600 to-sacred-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Pause className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">Walking in Faith</h4>
                        <p className="text-sm text-gray-400">Episode 11 • Processing...</p>
                        <Progress value={75} className="w-full mt-2" />
                      </div>
                      <div className="flex space-x-2">
                        <span className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1 rounded">Processing</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>
            
            {/* Analytics Preview */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="text-divine-500 mr-3" />
                Podcast Analytics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-divine-400">12.5K</div>
                  <div className="text-xs text-gray-400">Total Plays</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sacred-400">45</div>
                  <div className="text-xs text-gray-400">Episodes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">1.2K</div>
                  <div className="text-xs text-gray-400">Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">4.8</div>
                  <div className="text-xs text-gray-400">Avg Rating</div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
