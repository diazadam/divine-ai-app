import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ChevronLeft 
} from "lucide-react";
import { Link } from "wouter";
import GlassCard from "@/components/ui/glass-card";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { lazy, Suspense } from 'react';
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

export default function ScriptureEngine() {
  const [searchQuery, setSearchQuery] = useState("hope in difficult times");
  const [selectedVersion, setSelectedVersion] = useState("NIV");
  const [selectedBibleId, setSelectedBibleId] = useState("de4e12af7f28f599-02");
  const [selectedBookId, setSelectedBookId] = useState<string | "All">("All");
  const [selectedChapterId, setSelectedChapterId] = useState<string | "All">("All");
  const [aiContextEnabled, setAiContextEnabled] = useState(true);
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const navigatorRef = useRef<HTMLDivElement | null>(null);
  const passageRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Initialize from persisted bible selection
  // Persisted selections per Bible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedBible = localStorage.getItem('selectedBibleId');
    if (savedBible) setSelectedBibleId(savedBible);
  }, []);

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

  // Bibles list
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

  // Books for selected Bible
  const { data: booksData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'books'],
    enabled: !!selectedBibleId,
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/books`),
  });

  const books = useMemo(() => (booksData?.data || []) as Array<any>, [booksData]);
  const bookOptions = useMemo(() => {
    return [{ id: "All", label: "All Books" }, ...books.map((b) => ({ id: b.id, label: b.name }))];
  }, [books]);

  // Chapters for selected book
  const { data: chaptersData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'books', selectedBookId, 'chapters'],
    enabled: !!selectedBibleId && selectedBookId !== "All",
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/books/${selectedBookId}/chapters`),
  });

  const chapters = useMemo(() => (chaptersData?.data || []) as Array<any>, [chaptersData]);
  const chapterOptions = useMemo(() => {
    return [{ id: "All", label: "All Chapters" }, ...chapters.map((c) => ({ id: c.id, label: c.reference || c.id }))];
  }, [chapters]);

  // Deep link: parse URL hash like #JHN.3.16
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const m = hash.match(/^[A-Z0-9]+\.(\d+)(?:\.(\d+))?$/i);
    if (!m) return;
    // Require book id present
    const [bookId, chap, verse] = hash.split('.');
    if (!bookId || !chap) return;
    setSelectedBookId(bookId.toUpperCase());
    const chapterId = `${bookId.toUpperCase()}.${chap}`;
    setSelectedChapterId(chapterId);
    setSelectedVerseId(verse ? `${bookId.toUpperCase()}.${chap}.${verse}` : null);
    loadPassage(chapterId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search verses with API.Bible
  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ['/api/bible-search', selectedBibleId, searchQuery, selectedVersion],
    enabled: searchQuery.length > 0,
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/search?query=${encodeURIComponent(searchQuery)}&limit=20&version=${encodeURIComponent(selectedVersion)}`),
  });

  // Verses for selected chapter (Navigator mode)
  const { data: chapterVersesData } = useQuery<any>({
    queryKey: ['/api/bibles', selectedBibleId, 'chapters', selectedChapterId, 'verses'],
    enabled: !!selectedBibleId && selectedChapterId !== "All",
    queryFn: () => apiClient.get(`/api/bibles/${selectedBibleId}/chapters/${selectedChapterId}/verses`),
  });

  // Passage view (fetch full chapter or range via passages endpoint)
  const [passage, setPassage] = useState<{ reference: string; content: string } | null>(null);
  const loadPassage = async (passageId: string) => {
    try {
      const data: any = await apiClient.get(`/api/bibles/${selectedBibleId}/passages/${encodeURIComponent(passageId)}`);
      const ref = data?.data?.reference || passageId;
      const content: string = (data?.data?.content || '').toString();
      setPassage({ reference: ref, content });
      // scroll to navigator/passage view
      setTimeout(() => navigatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    } catch (e) {
      console.error('Failed to load passage', e);
    }
  };

  // After passage/verse changes, scroll to exact verse element if available
  useEffect(() => {
    if (!passage || !selectedVerseId) return;
    const container = passageRef.current;
    if (!container) return;
    // Try matching common API.Bible verse span ids
    const el = container.querySelector(`[id*="${selectedVerseId}"]`) as HTMLElement | null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [passage, selectedVerseId]);

  // Attach per-verse inline "Copy link" buttons to passage HTML
  useEffect(() => {
    if (!passage) return;
    const container = passageRef.current;
    if (!container) return;

    const candidates = Array.from(container.querySelectorAll('[id]')) as HTMLElement[];
    const verseEls = candidates.filter((n) => /[A-Z0-9]+\.\d+\.\d+/i.test(n.id));

    verseEls.forEach((node) => {
      // Avoid duplicating buttons
      if (node.querySelector('.verse-link-btn')) return;
      const sup = document.createElement('sup');
      sup.className = 'verse-link-btn';
      sup.style.marginLeft = '4px';
      sup.style.opacity = '0.6';
      sup.style.cursor = 'pointer';
      sup.title = 'Copy deep link';
      sup.textContent = '🔗';
      sup.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const verseId = node.id;
        const url = `${window.location.origin}${window.location.pathname}#${verseId}`;
        navigator.clipboard.writeText(url);
      });
      node.appendChild(sup);
    });
  }, [passage]);

  // Navigate from a reference string like "John 3:16"
  const handleGoToReference = async (reference: string) => {
    if (!books.length) return;
    const refLower = reference.toLowerCase();
    // Find the best matching book by longest name prefix
    let matched = null as null | { id: string; name: string };
    for (const b of books) {
      const name = (b.name || '').toLowerCase();
      if (name && refLower.startsWith(name) && (!matched || name.length > matched.name.length)) {
        matched = { id: b.id, name: b.name };
      }
    }
    if (!matched) return;
    // Extract chapter number from the remainder
    const remainder = reference.slice(matched.name.length).trim();
    const chapterMatch = remainder.match(/(\d+)/); // first number is chapter
    if (!chapterMatch) return;
    const chapterNum = chapterMatch[1];
    const verseMatch = remainder.match(/:(\d+)/);
    const verseNum = verseMatch ? verseMatch[1] : null;
    const chapterId = `${matched.id}.${chapterNum}`; // API.Bible chapter id format
    const computedVerseId = verseNum ? `${matched.id}.${chapterNum}.${verseNum}` : null;
    setSelectedBookId(matched.id);
    setSelectedChapterId(chapterId);
    setSelectedVerseId(computedVerseId);
    setPassage(null);
    // Update URL hash for deep links
    if (computedVerseId) {
      window.location.hash = computedVerseId;
    } else {
      window.location.hash = chapterId;
    }
    setTimeout(() => navigatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const { data: crossReferences = [] } = useQuery({
    queryKey: ['/api/scripture/cross-references', 'psalm 42:11'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by React Query
  };

  const copyVerse = (verse: BibleVerse) => {
    navigator.clipboard.writeText(`"${verse.text}" - ${verse.reference} (${verse.version})`);
    toast({ title: 'Copied verse' });
  };

  const computeVerseIdFromReference = (reference: string): string | null => {
    if (!books.length) return null;
    const refLower = reference.toLowerCase();
    let matched = null as null | { id: string; name: string };
    for (const b of books) {
      const name = (b.name || '').toLowerCase();
      if (name && refLower.startsWith(name) && (!matched || name.length > matched.name.length)) matched = { id: b.id, name: b.name };
    }
    if (!matched) return null;
    const remainder = reference.slice(matched.name.length).trim();
    const chapterMatch = remainder.match(/(\d+)/);
    if (!chapterMatch) return null;
    const chapterNum = chapterMatch[1];
    const verseMatch = remainder.match(/:(\d+)/);
    const verseNum = verseMatch ? verseMatch[1] : null;
    return verseNum ? `${matched.id}.${chapterNum}.${verseNum}` : `${matched.id}.${chapterNum}`;
  };

  const copyDeepLink = (reference: string, id?: string) => {
    const verseId = id || computeVerseIdFromReference(reference);
    if (!verseId) return;
    const url = `${window.location.origin}${window.location.pathname}#${verseId}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied' });
  };

  // Add to Sermon Draft (local, read by Sermon Prep Workspace)
  const addVerseToSermonDraft = (verse: BibleVerse) => {
    try {
      const key = 'sermonDraftAdditions';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push({ reference: verse.reference, text: verse.text, version: verse.version });
      localStorage.setItem(key, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to cache verse for sermon draft', e);
    }
  };

  // Bookmark verse in default collection "My Verses"
  const bookmarkVerse = async (verse: BibleVerse) => {
    try {
      // Ensure default collection exists
      const collections: any[] = await apiClient.get('/api/scripture-collections');
      let collection = collections.find((c) => (c.name || '').toLowerCase() === 'my verses');
      if (!collection) {
        collection = await apiClient.post('/api/scripture-collections', {
          name: 'My Verses',
          description: 'Saved verses',
          verses: [],
        });
      }
      await apiClient.patch(`/api/scripture-collections/${collection.id}/add-verse`, {
        reference: verse.reference,
        text: verse.text,
        version: verse.version,
      });
    } catch (e) {
      console.error('Failed to bookmark verse', e);
    }
  };

  return (
    <section id="scripture" className="pt-24 pb-16 min-h-screen relative z-10" data-testid="scripture-engine">
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-divine-500 to-celestial-500 bg-clip-text text-transparent">
            Scripture Search Engine
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto px-4">Intelligent biblical cross-reference with AI-powered interpretation</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Interface */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6 premium-shadow">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search scripture by topic, keyword, or reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-celestial-800/50 border border-white/10 rounded-xl py-4 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-divine-500 transition-all"
                    data-testid="scripture-search-input"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-divine-600 hover:bg-divine-500 rounded-lg"
                    data-testid="search-scripture-button"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Search Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Select value={selectedBibleId} onValueChange={setSelectedBibleId}>
                    <SelectTrigger className="w-56 bg-celestial-800/50 border border-white/10">
                      <SelectValue placeholder="Select Bible" />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.label || b.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedBookId} onValueChange={(v) => { setSelectedBookId(v); setSelectedChapterId("All"); window.location.hash = ''; }}>
                    <SelectTrigger className="w-48 bg-celestial-800/50 border border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bookOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedBookId !== "All" && (
                    <Select value={selectedChapterId} onValueChange={(v) => { setSelectedChapterId(v); setSelectedVerseId(null); window.location.hash = v; }}>
                      <SelectTrigger className="w-56 bg-celestial-800/50 border border-white/10">
                        <SelectValue placeholder="Select Chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapterOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button
                    variant={aiContextEnabled ? "default" : "outline"}
                    onClick={() => setAiContextEnabled(!aiContextEnabled)}
                    className={`text-sm ${aiContextEnabled ? 'bg-sacred-600/20 text-sacred-400' : ''}`}
                    data-testid="ai-context-toggle"
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    AI Context
                  </Button>
                </div>
              </form>
              
              {/* Search Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Search className="text-divine-500 mr-3" />
                  Search Results ({searchResults?.total || 24} verses found)
                </h3>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-celestial-800/30 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-divine-600/30 rounded w-24 mb-2"></div>
                        <div className="h-16 bg-celestial-800/50 rounded mb-3"></div>
                        <div className="flex space-x-4">
                          <div className="h-4 bg-celestial-700 rounded w-20"></div>
                          <div className="h-4 bg-celestial-700 rounded w-28"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  searchResults?.verses.map((verse, index) => (
                    <div
                      key={index}
                      className="bg-celestial-800/30 rounded-lg p-4 border-l-4 border-divine-500 hover:bg-celestial-800/50 transition-colors"
                      data-testid={`search-result-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-divine-600 text-sm px-2 py-1 rounded font-medium">
                              {verse.reference}
                            </span>
                            <span className="text-xs text-gray-400">{verse.version}</span>
                          </div>
                          <p className="font-scripture text-gray-200 leading-relaxed mb-3">
                            "{verse.text}"
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-divine-400 hover:text-divine-300 h-auto p-0"
                              data-testid={`add-to-sermon-${index}`}
                              onClick={() => addVerseToSermonDraft(verse)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Sermon
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-sacred-400 hover:text-sacred-300 h-auto p-0"
                              data-testid={`view-cross-refs-${index}`}
                            >
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Cross References
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyDeepLink(verse.reference, verse.id)}
                              className="text-gray-400 hover:text-gray-300 h-auto p-0"
                              data-testid={`link-verse-${index}`}
                            >
                              Link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGoToReference(verse.reference)}
                              className="text-celestial-400 hover:text-celestial-300 h-auto p-0"
                              data-testid={`go-to-${index}`}
                            >
                              Go to
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Compute chapter from reference
                                if (!books.length) return;
                                const refLower = verse.reference.toLowerCase();
                                let matched = null as null | { id: string; name: string };
                                for (const b of books) {
                                  const name = (b.name || '').toLowerCase();
                                  if (name && refLower.startsWith(name) && (!matched || name.length > matched.name.length)) matched = { id: b.id, name: b.name };
                                }
                                if (!matched) return;
                                const remainder = verse.reference.slice(matched.name.length).trim();
                                const chapterMatch = remainder.match(/(\d+)/);
                                if (!chapterMatch) return;
                                const chapterNum = chapterMatch[1];
                                setSelectedVerseId(verse.id || null);
                                loadPassage(`${matched.id}.${chapterNum}`);
                              }}
                              className="text-gold-400 hover:text-gold-300 h-auto p-0"
                              data-testid={`view-chapter-${index}`}
                            >
                              View Chapter
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyVerse(verse)}
                              className="text-gray-400 hover:text-gray-300 h-auto p-0"
                              data-testid={`copy-verse-${index}`}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-300"
                          data-testid={`save-verse-${index}`}
                          onClick={() => bookmarkVerse(verse)}
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )) ||
                  // Default verses when no search results
                  [
                    {
                      reference: "Psalm 42:11",
                      text: "Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.",
                      version: "NIV"
                    },
                    {
                      reference: "Romans 15:13",
                      text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",
                      version: "NIV"
                    }
                  ].map((verse, index) => (
                    <div
                      key={index}
                      className={`bg-celestial-800/30 rounded-lg p-4 border-l-4 ${
                        index === 0 ? 'border-divine-500' : 'border-sacred-500'
                      } hover:bg-celestial-800/50 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-sm px-2 py-1 rounded font-medium ${
                              index === 0 ? 'bg-divine-600' : 'bg-sacred-600'
                            }`}>
                              {verse.reference}
                            </span>
                            <span className="text-xs text-gray-400">{verse.version}</span>
                          </div>
                          <p className="font-scripture text-gray-200 leading-relaxed mb-3">
                            "{verse.text}"
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-divine-400 hover:text-divine-300 h-auto p-0"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add to Sermon
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-sacred-400 hover:text-sacred-300 h-auto p-0"
                            >
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Cross References
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyVerse(verse)}
                              className="text-gray-400 hover:text-gray-300 h-auto p-0"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="text-center">
                  <Button
                    variant="outline"
                    className="bg-celestial-700 hover:bg-celestial-600 border-celestial-600"
                    data-testid="load-more-results"
                  >
                    Load More Results
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Study Tools Sidebar */}
          <div className="space-y-6">
            {/* Favorites / My Verses */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4">My Verses</h3>
              <FavoritesList onAddToSermon={addVerseToSermonDraft} />
            </GlassCard>

            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4">Saved Collections</h3>
              <Suspense fallback={<div className="text-sm text-gray-400">Loading collections…</div>}>
                <CollectionsManager onAddToSermon={(v) => addVerseToSermonDraft({ reference: v.reference, text: v.text, version: v.version || 'N/A' })} />
              </Suspense>
            </GlassCard>
            {/* Scripture Navigator */}
            <div ref={navigatorRef}>
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4">Scripture Navigator</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Bible</div>
                  <Select value={selectedBibleId} onValueChange={(v) => { setSelectedBibleId(v); setSelectedBookId("All"); setSelectedChapterId("All"); }}>
                    <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.label || b.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Book</div>
                  <Select value={selectedBookId} onValueChange={(v) => { setSelectedBookId(v); setSelectedChapterId("All"); }}>
                    <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bookOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedBookId !== "All" && (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Chapter</div>
                    <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                      <SelectTrigger className="w-full bg-celestial-800/50 border border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {chapterOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedChapterId !== "All" && (
                  <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                    {(chapterVersesData?.data || []).map((v: any) => {
                      const isSelected = selectedVerseId && v.id === selectedVerseId;
                      const verseObj: BibleVerse = { id: v.id, reference: v.reference, text: (v.text || '').replace(/<[^>]*>/g, ''), version: selectedVersion };
                      return (
                        <div key={v.id} id={v.id} className={`text-sm rounded ${isSelected ? 'bg-divine-600/20 border border-divine-600/40 p-2' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-divine-400 mr-2">{v.reference?.split(' ').pop()}</span>
                              <span className="text-gray-200">{verseObj.text}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Button variant="ghost" size="sm" className="h-auto p-0 text-divine-400" onClick={() => addVerseToSermonDraft(verseObj)}>
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                              <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400" onClick={() => copyVerse(verseObj)}>
                                <Copy className="w-3 h-3 mr-1" /> Copy
                              </Button>
                              <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400" onClick={() => copyDeepLink(verseObj.reference, v.id)}>
                                Link
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {passage && (
                  <div ref={passageRef} className="mt-4 p-3 rounded bg-celestial-800/30 border border-white/10 passage-view">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">{passage.reference}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => selectedVerseId && copyDeepLink('', selectedVerseId)}>Copy Verse Link</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { if (selectedVerseId && passageRef.current) { const el = passageRef.current.querySelector(`[id*="${selectedVerseId}"]`) as HTMLElement | null; el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }}>Scroll to Verse</Button>
                      </div>
                    </div>
                    {selectedVerseId && (
                      <style>{`
                        @keyframes versePulse { 0% { box-shadow: 0 0 0 6px rgba(125,211,252,0.25); } 100% { box-shadow: 0 0 0 0 rgba(125,211,252,0); } }
                        .passage-view [id*="${selectedVerseId}"]{ background: rgba(125,211,252,.25); border-radius: .25rem; padding: .1rem .15rem; animation: versePulse 1.5s ease-out 1; }
                      `}</style>
                    )}
                    <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: passage.content }} />
                  </div>
                )}
              </div>
            </GlassCard>
            </div>

            {/* AI Commentary */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="text-divine-500 mr-3" />
                AI Commentary
              </h3>
              
              <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-divine-400">Context on "Hope"</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  The biblical concept of hope is not wishful thinking, but confident expectation based on God's character and promises. In Hebrew, "tikvah" suggests a cord or rope that connects us to something secure.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-divine-400 hover:text-divine-300 text-sm mt-2 h-auto p-0"
                  data-testid="expand-commentary"
                >
                  Read more analysis...
                </Button>
              </div>
            </GlassCard>
            
            {/* Cross References */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <LinkIcon className="text-sacred-500 mr-3" />
                Cross References
              </h3>
              
              <div className="space-y-3">
                <div className="bg-celestial-800/30 rounded-lg p-3">
                  <div className="font-medium text-sm mb-1">Related Themes</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-divine-600/20 text-divine-400 text-xs px-2 py-1 rounded cursor-pointer">Faith</span>
                    <span className="bg-sacred-600/20 text-sacred-400 text-xs px-2 py-1 rounded cursor-pointer">Trust</span>
                    <span className="bg-celestial-600/20 text-celestial-400 text-xs px-2 py-1 rounded cursor-pointer">Suffering</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Similar Passages</div>
                  <div className="space-y-1 text-sm">
                    <div className="cursor-pointer hover:text-divine-400 transition-colors">Jeremiah 29:11</div>
                    <div className="cursor-pointer hover:text-divine-400 transition-colors">Lamentations 3:22-23</div>
                    <div className="cursor-pointer hover:text-divine-400 transition-colors">1 Peter 1:3</div>
                  </div>
                </div>
              </div>
            </GlassCard>
            
            {/* Study Collections */}
            <GlassCard className="p-6 premium-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Folder className="text-celestial-500 mr-3" />
                Study Collections
              </h3>
              
              <div className="space-y-2">
                <div className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Hope & Faith</div>
                    <div className="text-xs text-gray-400">23 verses</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-divine-400 hover:text-divine-300"
                    data-testid="open-collection-hope-faith"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="bg-celestial-800/30 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Psalms of Comfort</div>
                    <div className="text-xs text-gray-400">18 verses</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-divine-400 hover:text-divine-300"
                    data-testid="open-collection-psalms-comfort"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Button
                className="w-full bg-celestial-700 hover:bg-celestial-600 mt-4 text-sm"
                data-testid="create-collection-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Collection
              </Button>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function FavoritesList({ onAddToSermon }: { onAddToSermon: (v: { reference: string; text: string; version: string }) => void }) {
  const { data, refetch } = useQuery<any>({
    queryKey: ['/api/scripture-collections'],
    queryFn: () => apiClient.get('/api/scripture-collections'),
  });
  const collections: any[] = data || [];
  const myVerses = useMemo(() => {
    const found = collections.find((c) => (c.name || '').toLowerCase() === 'my verses');
    return (found?.verses || []).slice(0, 10);
  }, [collections]);

  return (
    <div className="space-y-2">
      {myVerses.length === 0 && (
        <div className="text-sm text-gray-400">No saved verses yet. Bookmark verses from search results.</div>
      )}
      {myVerses.map((v: any, idx: number) => (
        <div key={`${v.reference}-${idx}`} className="bg-celestial-800/30 rounded p-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="mr-2">
              <div className="text-divine-400 font-medium">{v.reference}</div>
              <div className="text-gray-300 line-clamp-2">{v.text}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-auto p-0 text-divine-400" onClick={() => onAddToSermon({ reference: v.reference, text: v.text, version: v.version || 'N/A' })}>Add</Button>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400" onClick={() => navigator.clipboard.writeText(`"${v.text}" - ${v.reference} (${v.version || ''})`)}>Copy</Button>
            </div>
          </div>
        </div>
      ))}
      <div className="text-right">
        <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400" onClick={() => refetch()}>Refresh</Button>
      </div>
    </div>
  );
}
