import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedVideo } from '@shared/schema';

export default function MediaVideosPage() {
  const { data: videos = [] } = useQuery<GeneratedVideo[]>({ queryKey: ['/api/generated-videos'] });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'new'|'old'>('new');
  const pageSize = 8;

  const filtered = useMemo(() => {
    const f = videos.filter(v => v.prompt.toLowerCase().includes(q.toLowerCase()));
    return f.sort((a,b) => sort === 'new'
      ? new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
      : new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
  }, [videos, q, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const download = (id: string) => {
    const a = document.createElement('a'); a.href = `/api/generated-videos/${id}/download`; a.download = ''; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const remove = async (id: string) => {
    const resp = await fetch(`/api/generated-videos/${id}`, { method: 'DELETE' });
    if (resp.ok) { toast({ title: 'Deleted' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] }); } else { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const bulkDelete = async () => {
    if (!confirm('Delete all filtered videos? This cannot be undone.')) return;
    const url = q ? `/api/generated-videos?q=${encodeURIComponent(q)}` : '/api/generated-videos';
    const resp = await fetch(url, { method: 'DELETE' });
    if (resp.ok) { toast({ title: 'Deleted videos' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-videos'] }); }
    else { toast({ title: 'Bulk delete failed', variant: 'destructive' }); }
  };

  return (
    <main className="pt-20 max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-4">All Generated Videos</h1>
      <div className="flex items-center gap-3 mb-6">
        <Input placeholder="Search prompts..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="bg-white/10 border-white/20 text-white" />
        <select value={sort} onChange={e => setSort(e.target.value as any)} className="bg-white/10 border border-white/20 text-white rounded px-2 py-2 text-sm">
          <option value="new">Newest</option>
          <option value="old">Oldest</option>
        </select>
        <div className="text-sm text-gray-300">{filtered.length} items</div>
        {filtered.length > 0 && (
          <Button variant="destructive" onClick={bulkDelete} className="ml-auto">Delete All</Button>
        )}
      </div>
      <div className="space-y-3">
        {pageItems.map(v => (
          <div key={v.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
            <div className="text-white text-sm">{v.prompt.substring(0,80)}...</div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => download(v.id)}>Download</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(v.id)}>Delete</Button>
              {v.videoUrl && <Button size="sm" variant="ghost" onClick={() => window.open(v.videoUrl!, '_blank')}>Open</Button>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-6 text-white">
        <Button variant="outline" disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
        <span>Page {page} / {totalPages}</span>
        <Button variant="outline" disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
      </div>
    </main>
  );
}
