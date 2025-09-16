import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Brain, 
  Plus, 
  Link as LinkIcon, 
  Copy, 
  Bookmark, 
  Folder, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Eye,
  EyeOff,
  Settings,
  Quote,
  Highlighter,
  Volume2,
  Sun,
  Moon,
  Type,
  Palette,
  Navigation,
  Share2,
  Download,
  History,
  Star,
  MessageCircle,
  List,
  Grid3X3,
  Filter,
  SortAsc,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import GlassCard from "@/components/ui/glass-card";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScriptureReadingPlan from '@/components/scripture-reading-plan';
import VerseOfTheDay from '@/components/verse-of-the-day';

const CollectionsManager = lazy(() => import('@/components/collections-manager'));

interface BibleVerse {
  id?: string;
  reference: string;
  text: string;
  version: string;
}

interface SearchResult {
  verses: BibleVerse[];
  total: number;
}

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  darkMode: boolean;
  showVerseNumbers: boolean;
  showCrossRefs: boolean;
  highlightMode: boolean;
  readingMode: 'study' | 'devotional' | 'reference';
  colorScheme: 'default' | 'sepia' | 'dark' | 'contrast';
}

export default function EnhancedScriptureEngine() {
  const [searchQuery, setSearchQuery] = useState("hope in difficult times");
  const [selectedVersion, setSelectedVersion] = useState("NIV");
  const [selectedBibleId, setSelectedBibleId] = useState("de4e12af7f28f599-02");
  const [selectedBookId, setSelectedBookId] = useState<string | "All">("All");
  const [selectedChapterId, setSelectedChapterId] = useState<string | "All">("All");
  const [aiContextEnabled, setAiContextEnabled] = useState(true);
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'read' | 'study'>('search');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [searchFilters, setSearchFilters] = useState({
    testament: 'all',
    books: 'all',
    language: 'all'
  });
  
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>({
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    darkMode: true,
    showVerseNumbers: true,
    showCrossRefs: true,
    highlightMode: false,
    readingMode: 'study',
    colorScheme: 'default'
  });

  // AI-powered features state
  const [aiInsights, setAiInsights] = useState<string>("");
  const [aiCommentary, setAiCommentary] = useState<string>("");
  const [originalLanguageAnalysis, setOriginalLanguageAnalysis] = useState<string>("");
  const { toast } = useToast();

  const navigatorRef = useRef<HTMLDivElement | null>(null);
  const passageRef = useRef<HTMLDivElement | null>(null);

  // Advanced AI mutations using our new OpenAI services
  const theologicalAnalysisMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/theology/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          includeHistorical: true,
          includeCitations: true
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiInsights(data.analysis?.summary || "Analysis complete. Check the response for detailed insights.");
      toast({
        title: "🧠 Theological Analysis Complete",
        description: "Advanced AI analysis has been generated."
      });
    }
  });

  const originalLanguageMutation = useMutation({
    mutationFn: async ({ verse, word }: { verse: string; word: string }) => {
      const response = await fetch('/api/bible/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse, word })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOriginalLanguageAnalysis(data.analysis || "Language analysis complete.");
      toast({
        title: "📚 Original Language Analysis",
        description: "Hebrew/Greek analysis has been completed."
      });
    }
  });

  const aiCommentaryMutation = useMutation({
    mutationFn: async (passage: string) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Provide theological commentary on ${passage}`,
          type: 'theological_analysis',
          context: JSON.stringify({ passage })
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiCommentary(data.response || "Commentary generated successfully.");
      toast({
        title: "💬 AI Commentary Ready",
        description: "Theological commentary has been generated."
      });
    }
  });

  // Initialize from persisted settings and selections
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load reading settings
    const savedSettings = localStorage.getItem('bibleReadingSettings');
    if (savedSettings) {
      setReadingSettings(JSON.parse(savedSettings));
    }
    
    // Load Bible selection
    const savedBible = localStorage.getItem('selectedBibleId');
    if (savedBible) setSelectedBibleId(savedBible);
    
    // Load bookmarks and highlights
    const savedBookmarks = localStorage.getItem('bibleBookmarks');
    if (savedBookmarks) setBookmarks(new Set(JSON.parse(savedBookmarks)));
    
    const savedHighlights = localStorage.getItem('bibleHighlights');
    if (savedHighlights) setHighlightedVerses(new Set(JSON.parse(savedHighlights)));
    
    const savedNotes = localStorage.getItem('bibleNotes');
    if (savedNotes) setNotes(new Map(JSON.parse(savedNotes)));
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('bibleReadingSettings', JSON.stringify(readingSettings));
  }, [readingSettings]);

  useEffect(() => {
    localStorage.setItem('bibleBookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('bibleHighlights', JSON.stringify([...highlightedVerses]));
  }, [highlightedVerses]);

  useEffect(() => {
    localStorage.setItem('bibleNotes', JSON.stringify([...notes]));
  }, [notes]);

  // Bible selection persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('selectedBibleId', selectedBibleId);
    const savedBook = localStorage.getItem(`selectedBookId:${selectedBibleId}`);
    const savedChapter = localStorage.getItem(`selectedChapterId:${selectedBibleId}`);
    setSelectedBookId((savedBook as any) || 'All');
    setSelectedChapterId((savedChapter as any) || 'All');
  }, [selectedBibleId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`selectedBookId:${selectedBibleId}`, selectedBookId);
  }, [selectedBookId, selectedBibleId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedChapterId !== 'All') {
      localStorage.setItem(`selectedChapterId:${selectedBibleId}`, selectedChapterId);
    } else {
      localStorage.removeItem(`selectedChapterId:${selectedBibleId}`);
    }
  }, [selectedChapterId, selectedBibleId]);

  // Data queries
  const { data: biblesData } = useQuery<any>({
    queryKey: ['/api/bibles'],
    queryFn: () => apiClient.get('/api/bibles'),
  });

  const bibleOptions = useMemo(() => {
    const items = (biblesData?.data || []) as Array<any>;
    return items.map((b) => ({
      id: b.id,
      label: [b.abbreviation, b.name].filter(Boolean).join(' - '),
    }));
  }, [biblesData]);

  const { data: booksData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'books'],
    enabled: !!selectedBibleId,
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/books`),
  });

  const books = useMemo(() => (booksData?.data || []) as Array<any>, [booksData]);
  const bookOptions = useMemo(() => {
    return [{ id: "All", label: "All Books" }, ...books.map((b) => ({ id: b.id, label: b.name }))];
  }, [books]);

  const { data: chaptersData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'books', selectedBookId, 'chapters'],
    enabled: !!selectedBibleId && selectedBookId !== "All",
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/books/${selectedBookId}/chapters`),
  });

  const chapters = useMemo(() => (chaptersData?.data || []) as Array<any>, [chaptersData]);
  const chapterOptions = useMemo(() => {
    return [{ id: "All", label: "All Chapters" }, ...chapters.map((c) => ({ id: c.id, label: c.reference || c.id }))];
  }, [chapters]);

  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ['/api/bible-search', selectedBibleId, searchQuery, selectedVersion],
    enabled: searchQuery.length > 0,
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/search?query=${encodeURIComponent(searchQuery)}&limit=20&version=${encodeURIComponent(selectedVersion)}`),
  });

  const { data: chapterVersesData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'chapters', selectedChapterId, 'verses'],
    enabled: !!selectedBibleId && selectedChapterId !== "All",
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/chapters/${selectedChapterId}/verses`),
  });

  const [passage, setPassage] = useState<{ reference: string; content: string } | null>(null);
  
  const loadPassage = async (passageId: string) => {
    try {
      const data: any = await apiClient.get(`/api/bibles/${selectedBibleId}/passages/${encodeURIComponent(passageId)}`);
      const ref = data?.data?.reference || passageId;
      const content: string = (data?.data?.content || '').toString();
      setPassage({ reference: ref, content });
      setTimeout(() => navigatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } catch (e) {
      console.error('Failed to load passage', e);
    }
  };

  useEffect(() => {
    if (selectedChapterId && selectedChapterId !== 'All') {
      loadPassage(selectedChapterId);
    }
  }, [selectedChapterId]);

  // Navigation functions
  const navigateChapter = (direction: 'prev' | 'next') => {
    try {
      const idx = (chapters || []).findIndex((c: any) => c.id === selectedChapterId);
      if (direction === 'prev' && idx > 0) {
        setSelectedChapterId((chapters as any)[idx - 1].id);
      } else if (direction === 'next' && idx >= 0 && idx < (chapters as any).length - 1) {
        setSelectedChapterId((chapters as any)[idx + 1].id);
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const toggleHighlight = (verseId: string) => {
    const newHighlights = new Set(highlightedVerses);
    if (newHighlights.has(verseId)) {
      newHighlights.delete(verseId);
    } else {
      newHighlights.add(verseId);
    }
    setHighlightedVerses(newHighlights);
    toast({ title: newHighlights.has(verseId) ? 'Verse highlighted' : 'Highlight removed' });
  };

  const toggleBookmark = (verseId: string) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(verseId)) {
      newBookmarks.delete(verseId);
    } else {
      newBookmarks.add(verseId);
    }
    setBookmarks(newBookmarks);
    toast({ title: newBookmarks.has(verseId) ? 'Verse bookmarked' : 'Bookmark removed' });
  };

  const addNote = (verseId: string, note: string) => {
    const newNotes = new Map(notes);
    if (note.trim()) {
      newNotes.set(verseId, note);
    } else {
      newNotes.delete(verseId);
    }
    setNotes(newNotes);
    toast({ title: 'Note saved' });
  };

  // Reading settings component
  const ReadingSettingsPanel = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Reading Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Font Size</label>
          <Slider
            value={[readingSettings.fontSize]}
            onValueChange={([value]) => setReadingSettings(prev => ({ ...prev, fontSize: value }))}
            min={12}
            max={24}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>12px</span>
            <span>{readingSettings.fontSize}px</span>
            <span>24px</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Line Height</label>
          <Slider
            value={[readingSettings.lineHeight]}
            onValueChange={([value]) => setReadingSettings(prev => ({ ...prev, lineHeight: value }))}
            min={1.2}
            max={2.0}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Font Family</label>
          <Select 
            value={readingSettings.fontFamily} 
            onValueChange={(value) => setReadingSettings(prev => ({ ...prev, fontFamily: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter (Default)</SelectItem>
              <SelectItem value="Georgia">Georgia (Serif)</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Crimson Text">Crimson Text</SelectItem>
              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Verse Numbers</label>
            <Switch
              checked={readingSettings.showVerseNumbers}
              onCheckedChange={(checked) => setReadingSettings(prev => ({ ...prev, showVerseNumbers: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Cross References</label>
            <Switch
              checked={readingSettings.showCrossRefs}
              onCheckedChange={(checked) => setReadingSettings(prev => ({ ...prev, showCrossRefs: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Highlight Mode</label>
            <Switch
              checked={readingSettings.highlightMode}
              onCheckedChange={(checked) => setReadingSettings(prev => ({ ...prev, highlightMode: checked }))}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Reading Mode</label>
          <Select 
            value={readingSettings.readingMode} 
            onValueChange={(value: any) => setReadingSettings(prev => ({ ...prev, readingMode: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="study">Study Mode</SelectItem>
              <SelectItem value="devotional">Devotional</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Color Scheme</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'default', label: 'Default', color: 'bg-blue-500' },
              { value: 'sepia', label: 'Sepia', color: 'bg-yellow-600' },
              { value: 'dark', label: 'Dark', color: 'bg-gray-800' },
              { value: 'contrast', label: 'High Contrast', color: 'bg-black' }
            ].map((scheme) => (
              <Button
                key={scheme.value}
                variant={readingSettings.colorScheme === scheme.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReadingSettings(prev => ({ ...prev, colorScheme: scheme.value as any }))}
                className="justify-start"
              >
                <div className={`w-3 h-3 rounded-full ${scheme.color} mr-2`} />
                {scheme.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section id="enhanced-scripture" className="pt-16 pb-16 min-h-screen relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Premium Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-divine-500 via-sacred-500 to-celestial-500 bg-clip-text text-transparent">
            Divine Scripture
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Experience the Word of God with advanced study tools, beautiful typography, and AI-powered insights
          </p>
        </div>

        {/* Settings Panel Overlay */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(false)}
                className="absolute -top-2 -right-2 z-10"
              >
                ✕
              </Button>
              <ReadingSettingsPanel />
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="search" className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search & Discover
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Read & Study
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Study Tools
            </TabsTrigger>
          </TabsList>

          {/* Search & Discover Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Advanced Search Interface */}
              <div className="lg:col-span-2">
                <GlassCard className="p-6 premium-shadow">
                  <div className="space-y-6">
                    {/* Enhanced Search Bar */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search by keyword, topic, phrase, or reference (e.g., 'John 3:16', 'love', 'hope in trials')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gradient-to-r from-celestial-800/50 to-divine-800/50 border border-white/20 rounded-xl py-6 px-6 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-divine-500 transition-all"
                      />
                      <Button
                        size="icon"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-divine-600 hover:bg-divine-500 rounded-xl"
                      >
                        <Search className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Search Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={selectedBibleId} onValueChange={setSelectedBibleId}>
                        <SelectTrigger className="bg-celestial-800/50 border border-white/10">
                          <SelectValue placeholder="Bible Version" />
                        </SelectTrigger>
                        <SelectContent>
                          {bibleOptions.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={searchFilters.testament} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, testament: value }))}>
                        <SelectTrigger className="bg-celestial-800/50 border border-white/10">
                          <SelectValue placeholder="Testament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Testament</SelectItem>
                          <SelectItem value="old">Old Testament</SelectItem>
                          <SelectItem value="new">New Testament</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant={aiContextEnabled ? "default" : "outline"}
                          onClick={() => setAiContextEnabled(!aiContextEnabled)}
                          className="flex-1"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          AI Insights
                        </Button>
                        <Button variant="outline" size="icon">
                          <Filter className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Search Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      {['love', 'faith', 'hope', 'prayer', 'forgiveness', 'peace', 'strength', 'joy'].map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="secondary"
                          className="cursor-pointer hover:bg-divine-600/20 transition-colors"
                          onClick={() => setSearchQuery(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Enhanced Search Results */}
                <GlassCard className="p-6 premium-shadow mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Search Results</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {searchResults?.total || 0} verses found
                      </span>
                      <Button variant="ghost" size="icon">
                        <SortAsc className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gradient-to-r from-celestial-800/30 to-divine-800/30 rounded-xl p-6 animate-pulse">
                          <div className="h-5 bg-divine-600/30 rounded w-32 mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-celestial-800/50 rounded w-full"></div>
                            <div className="h-4 bg-celestial-800/50 rounded w-3/4"></div>
                          </div>
                          <div className="flex space-x-4 mt-4">
                            <div className="h-3 bg-celestial-700 rounded w-20"></div>
                            <div className="h-3 bg-celestial-700 rounded w-24"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults?.verses.map((verse, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-celestial-800/20 to-divine-800/20 rounded-xl p-6 border border-white/10 hover:border-divine-500/50 transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <Badge className="bg-divine-600 hover:bg-divine-500">
                                  {verse.reference}
                                </Badge>
                                <span className="text-xs text-gray-400">{verse.version}</span>
                                {bookmarks.has(verse.id || '') && (
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                )}
                              </div>
                              
                              <blockquote className="text-gray-200 leading-relaxed mb-4 text-lg font-medium border-l-4 border-divine-500 pl-4 italic">
                                "{verse.text}"
                              </blockquote>
                              
                              <div className="flex items-center flex-wrap gap-3 text-sm">
                                <Button variant="ghost" size="sm" className="text-divine-400 hover:text-divine-300">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add to Study
                                </Button>
                                <Button variant="ghost" size="sm" className="text-sacred-400 hover:text-sacred-300">
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Cross References
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-yellow-400 hover:text-yellow-300"
                                  onClick={() => toggleBookmark(verse.id || '')}
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  {bookmarks.has(verse.id || '') ? 'Bookmarked' : 'Bookmark'}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300">
                                  <Highlighter className="w-3 h-3 mr-1" />
                                  Highlight
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                  <Share2 className="w-3 h-3 mr-1" />
                                  Share
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) || (
                        // Default featured verses
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 text-divine-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">Start Your Scripture Search</h3>
                          <p className="text-gray-400 mb-4">Enter a keyword, topic, or reference to begin exploring God's Word</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {[
                              {
                                reference: "Psalm 42:11",
                                text: "Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.",
                                theme: "Hope in Trials"
                              },
                              {
                                reference: "Romans 15:13",
                                text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",
                                theme: "Joy & Peace"
                              }
                            ].map((verse, index) => (
                              <Card key={index} className="bg-gradient-to-br from-divine-800/30 to-sacred-800/30 border-divine-500/30">
                                <CardContent className="p-6">
                                  <Badge className="mb-3 bg-divine-600">{verse.reference}</Badge>
                                  <p className="text-gray-200 italic mb-3">"{verse.text}"</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-divine-400">{verse.theme}</span>
                                    <Button variant="ghost" size="sm">
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Search Sidebar */}
              <div className="space-y-6">
                {/* Verse of the Day */}
                <VerseOfTheDay />

                {/* Quick Bible Navigation */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-divine-500" />
                    Quick Navigation
                  </h3>
                  <div className="space-y-3">
                    <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Book" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookOptions.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedBookId !== "All" && (
                      <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapterOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </GlassCard>

                {/* Reading Plan */}
                <ScriptureReadingPlan />

                {/* AI Insights Preview */}
                {aiContextEnabled && (
                  <GlassCard className="p-6 premium-shadow">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-divine-500" />
                      AI Insights
                    </h3>
                    <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-divine-400">Context on "{searchQuery}"</h4>
                      {aiInsights ? (
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          {aiInsights}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          AI analysis will appear here based on your search query, providing theological context and cross-references.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => theologicalAnalysisMutation.mutate(searchQuery)}
                          disabled={theologicalAnalysisMutation.isPending}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          {theologicalAnalysisMutation.isPending ? "Analyzing..." : "🧠 Generate Insights"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => originalLanguageMutation.mutate({ verse: searchQuery, word: "hope" })}
                          disabled={originalLanguageMutation.isPending}
                        >
                          {originalLanguageMutation.isPending ? "Analyzing..." : "📚 Original Language"}
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Read & Study Tab */}
          <TabsContent value="read" className="space-y-6">
            {/* Reader Interface */}
            {passage && (
              <GlassCard className="premium-shadow overflow-hidden">
                {/* Reader Header */}
                <div className="bg-gradient-to-r from-divine-800/50 to-sacred-800/50 p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{passage.reference}</h2>
                      <p className="text-divine-300">{selectedVersion}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateChapter('prev')}
                        disabled={!chapters || chapters.findIndex((c: any) => c.id === selectedChapterId) <= 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateChapter('next')}
                        disabled={!chapters || chapters.findIndex((c: any) => c.id === selectedChapterId) >= chapters.length - 1}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="icon">
                        <Volume2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reader Content */}
                <div 
                  ref={passageRef} 
                  className="p-8"
                  style={{
                    fontSize: `${readingSettings.fontSize}px`,
                    lineHeight: readingSettings.lineHeight,
                    fontFamily: readingSettings.fontFamily
                  }}
                >
                  <div 
                    className={`
                      prose prose-invert max-w-none leading-relaxed
                      ${readingSettings.colorScheme === 'sepia' ? 'prose-yellow' : ''}
                      ${readingSettings.colorScheme === 'contrast' ? 'prose-white' : ''}
                    `}
                    dangerouslySetInnerHTML={{ __html: passage.content }}
                  />
                </div>
              </GlassCard>
            )}

            {/* Chapter Overview when no specific passage */}
            {!passage && selectedBookId !== "All" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <GlassCard className="p-6 premium-shadow">
                    <div className="text-center py-12">
                      <BookOpen className="w-20 h-20 text-divine-500 mx-auto mb-6" />
                      <h2 className="text-3xl font-bold mb-4">
                        {books.find((b: any) => b.id === selectedBookId)?.name || 'Scripture Reader'}
                      </h2>
                      <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Select a chapter to begin your immersive Bible reading experience with advanced study tools and beautiful typography.
                      </p>
                      
                      {/* Chapter Grid */}
                      {chapters?.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-4xl mx-auto">
                          {chapters.map((c: any) => {
                            const chapterNum = (c.reference || c.id || '').split('.').pop() || '';
                            const isActive = selectedChapterId === c.id;
                            return (
                              <Button
                                key={c.id}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                className={`
                                  h-12 w-12 rounded-xl font-semibold
                                  ${isActive 
                                    ? 'bg-gradient-to-br from-divine-600 to-sacred-600 text-white shadow-lg' 
                                    : 'bg-celestial-800/30 border-white/20 hover:bg-divine-600/20 hover:border-divine-500/50'
                                  }
                                  transition-all duration-200
                                `}
                                onClick={() => setSelectedChapterId(c.id)}
                              >
                                {chapterNum}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Reading Sidebar */}
                <div className="space-y-6">
                  <GlassCard className="p-6 premium-shadow">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Type className="w-5 h-5 mr-2 text-divine-500" />
                      Reading Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Verse Numbers</label>
                        <Switch
                          checked={readingSettings.showVerseNumbers}
                          onCheckedChange={(checked) => setReadingSettings(prev => ({ ...prev, showVerseNumbers: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Cross References</label>
                        <Switch
                          checked={readingSettings.showCrossRefs}
                          onCheckedChange={(checked) => setReadingSettings(prev => ({ ...prev, showCrossRefs: checked }))}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setIsSettingsOpen(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        More Settings
                      </Button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 premium-shadow">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Bookmark className="w-5 h-5 mr-2 text-sacred-500" />
                      Bookmarks
                    </h3>
                    <div className="text-sm text-gray-400">
                      {bookmarks.size === 0 
                        ? "No bookmarks yet. Start reading to add some!" 
                        : `${bookmarks.size} verse${bookmarks.size === 1 ? '' : 's'} bookmarked`
                      }
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Study Tools Tab */}
          <TabsContent value="study" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Study Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Collections Manager */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <Folder className="w-6 h-6 mr-3 text-celestial-500" />
                    Scripture Collections
                  </h3>
                  <Suspense fallback={<div className="text-sm text-gray-400">Loading collections...</div>}>
                    <CollectionsManager onAddToSermon={(v) => console.log('Add to sermon:', v)} />
                  </Suspense>
                </GlassCard>

                {/* Study Notes */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <MessageCircle className="w-6 h-6 mr-3 text-divine-500" />
                    Study Notes
                  </h3>
                  <div className="space-y-4">
                    {notes.size === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">No study notes yet. Start studying verses to add notes!</p>
                      </div>
                    ) : (
                      Array.from(notes.entries()).map(([verseId, note]) => (
                        <Card key={verseId} className="bg-celestial-800/30">
                          <CardContent className="p-4">
                            <div className="text-sm text-divine-400 mb-2">{verseId}</div>
                            <p className="text-gray-200">{note}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Study Tools Sidebar */}
              <div className="space-y-6">
                {/* Cross References */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-sacred-500" />
                    Cross References
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-celestial-800/30 rounded-lg p-3">
                      <div className="font-medium text-sm mb-2">Related Themes</div>
                      <div className="flex flex-wrap gap-2">
                        {['Faith', 'Hope', 'Love', 'Trust', 'Peace'].map((theme) => (
                          <Badge key={theme} variant="secondary" className="text-xs cursor-pointer hover:bg-divine-600/20">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* AI Commentary */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-divine-500" />
                    AI Commentary
                  </h3>
                  <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-4">
                    {aiCommentary ? (
                      <div>
                        <p className="text-sm text-gray-300 leading-relaxed mb-4">
                          {aiCommentary}
                        </p>
                        {originalLanguageAnalysis && (
                          <div className="mt-4 p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                            <h5 className="font-medium text-amber-400 mb-2">Original Language Analysis</h5>
                            <p className="text-xs text-gray-300">{originalLanguageAnalysis}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        Select a passage or verse to receive AI-powered theological insights and commentary.
                      </p>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => aiCommentaryMutation.mutate(searchQuery)}
                      disabled={aiCommentaryMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      {aiCommentaryMutation.isPending ? "Generating..." : "💬 Generate Commentary"}
                    </Button>
                  </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="p-6 premium-shadow">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="flex-col h-16">
                      <Plus className="w-4 h-4 mb-1" />
                      New Collection
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-16">
                      <Quote className="w-4 h-4 mb-1" />
                      Daily Verse
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-16">
                      <Download className="w-4 h-4 mb-1" />
                      Export Notes
                    </Button>
                    <Button variant="outline" size="sm" className="flex-col h-16">
                      <Share2 className="w-4 h-4 mb-1" />
                      Share Study
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}