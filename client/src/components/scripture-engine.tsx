import { useState } from "react";
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
import { apiRequest } from "@/lib/queryClient";

interface BibleVerse {
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
  const [selectedBook, setSelectedBook] = useState("All Books");
  const [aiContextEnabled, setAiContextEnabled] = useState(true);

  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ['/api/scripture/search', searchQuery, selectedVersion],
    enabled: searchQuery.length > 0,
  });

  const { data: crossReferences = [] } = useQuery({
    queryKey: ['/api/scripture/cross-references', 'psalm 42:11'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by React Query
  };

  const copyVerse = (verse: BibleVerse) => {
    navigator.clipboard.writeText(`"${verse.text}" - ${verse.reference} (${verse.version})`);
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
                  <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                    <SelectTrigger className="w-32 bg-celestial-800/50 border border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Versions">All Versions</SelectItem>
                      <SelectItem value="NIV">NIV</SelectItem>
                      <SelectItem value="ESV">ESV</SelectItem>
                      <SelectItem value="KJV">KJV</SelectItem>
                      <SelectItem value="NASB">NASB</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger className="w-40 bg-celestial-800/50 border border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Books">All Books</SelectItem>
                      <SelectItem value="Old Testament">Old Testament</SelectItem>
                      <SelectItem value="New Testament">New Testament</SelectItem>
                      <SelectItem value="Psalms">Psalms</SelectItem>
                    </SelectContent>
                  </Select>
                  
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
