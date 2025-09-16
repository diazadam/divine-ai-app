import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Search, Grid3X3, Grid2X2, Sparkles, Eye, Calendar, Filter, Zap } from 'lucide-react';
import type { GeneratedImage } from '@shared/schema';

export default function MediaImagesPage() {
  const { data: images = [] } = useQuery<GeneratedImage[]>({ queryKey: ['/api/generated-images'] });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'new'|'old'>('new');
  const [viewMode, setViewMode] = useState<'grid'|'masonry'>('masonry');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const pageSize = 20;

  const filtered = useMemo(() => {
    const f = images.filter(i => i.prompt.toLowerCase().includes(q.toLowerCase()));
    return f.sort((a, b) => sort === 'new'
      ? new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
      : new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
  }, [images, q, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const download = (id: string) => {
    const a = document.createElement('a');
    a.href = `/api/generated-images/${id}/download`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const remove = async (id: string) => {
    const resp = await fetch(`/api/generated-images/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      toast({ title: 'Image deleted successfully', description: 'The image has been removed from your gallery' });
      queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
    } else {
      toast({ title: 'Delete failed', description: 'Could not delete the image', variant: 'destructive' });
    }
  };

  const bulkDelete = async () => {
    if (!confirm('Delete all filtered images? This action cannot be undone.')) return;
    const url = q ? `/api/generated-images?q=${encodeURIComponent(q)}` : '/api/generated-images';
    const resp = await fetch(url, { method: 'DELETE' });
    if (resp.ok) {
      toast({ title: 'Images deleted', description: `${filtered.length} images removed from gallery` });
      queryClient.invalidateQueries({ queryKey: ['/api/generated-images'] });
    } else {
      toast({ title: 'Bulk delete failed', description: 'Could not delete images', variant: 'destructive' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <main className="pt-16 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Divine Gallery
                </h1>
              </div>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your collection of AI-generated masterpieces. Where creativity meets divine inspiration.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          {/* Controls */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Search your divine creations..." 
                    value={q} 
                    onChange={(e) => { setQ(e.target.value); setPage(1); }} 
                    className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl h-12"
                  />
                </div>
                <div className="flex gap-3">
                  <select 
                    value={sort} 
                    onChange={e => setSort(e.target.value as any)} 
                    className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm min-w-[120px] backdrop-blur-sm"
                  >
                    <option value="new">Newest First</option>
                    <option value="old">Oldest First</option>
                  </select>
                  
                  {/* View Mode Toggle */}
                  <div className="flex bg-white/10 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('masonry')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'masonry' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Grid2X2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/10 rounded-full px-4 py-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">{filtered.length}</span>
                  <span>creations</span>
                </div>
                {filtered.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={bulkDelete} 
                    className="rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-200"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          {pageItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">No images found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {q ? `No images match "${q}". Try a different search term.` : 'Start creating divine AI artwork to build your gallery.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'masonry' 
              ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6" 
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }>
              {pageItems.map((img, index) => (
                <div 
                  key={img.id} 
                  className={`group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 ${viewMode === 'masonry' ? 'break-inside-avoid mb-6' : 'aspect-square'}`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className={viewMode === 'masonry' ? 'relative' : 'aspect-square'}>
                    <img 
                      src={img.imageUrl} 
                      alt={img.prompt} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    {/* Action Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => setSelectedImage(img)}
                        className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => download(img.id)}
                        className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all duration-300 hover:scale-110"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => remove(img.id)}
                        className="p-3 bg-red-500/50 backdrop-blur-sm rounded-full text-white hover:bg-red-500/70 transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                        {img.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(img.createdAt as any)}</span>
                        </div>
                        {img.style && (
                          <span className="px-2 py-1 bg-purple-500/30 rounded-full text-xs">
                            {img.style}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 mb-8">
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p-1))}
                className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        pageNum === page 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="max-w-4xl max-h-[90vh] relative rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.prompt}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => download(selectedImage.id)}
                className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all"
              >
                ×
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
              <h3 className="text-lg font-semibold mb-2">{selectedImage.prompt}</h3>
              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-4">
                  <span>Created {formatDate(selectedImage.createdAt as any)}</span>
                  {selectedImage.style && <span className="px-2 py-1 bg-purple-500/30 rounded-full">{selectedImage.style}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
