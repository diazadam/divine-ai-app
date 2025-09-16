import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedAudio } from '@shared/schema';

export default function MediaAudiosPage() {
  const { data: audios = [] } = useQuery<GeneratedAudio[]>({ queryKey: ['/api/generated-audios'] });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'new'|'old'>('new');
  const pageSize = 10;

  const filtered = useMemo(() => {
    const f = audios.filter(a => a.prompt.toLowerCase().includes(q.toLowerCase() ));
    return f.sort((a,b) => sort === 'new'
      ? new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
      : new Date(a.createdAt as any).getTime() - new Date(b.createdAt as any).getTime());
  }, [audios, q, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const download = (id: string) => {
    const a = document.createElement('a'); a.href = `/api/generated-audios/${id}/download`; a.download = ''; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const remove = async (id: string) => {
    const resp = await fetch(`/api/generated-audios/${id}`, { method: 'DELETE' });
    if (resp.ok) { toast({ title: 'Deleted' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] }); } else { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const bulkDelete = async () => {
    if (!confirm('Delete all filtered audio? This cannot be undone.')) return;
    const url = q ? `/api/generated-audios?q=${encodeURIComponent(q)}` : '/api/generated-audios';
    const resp = await fetch(url, { method: 'DELETE' });
    if (resp.ok) { toast({ title: 'Deleted audio' }); queryClient.invalidateQueries({ queryKey: ['/api/generated-audios'] }); }
    else { toast({ title: 'Bulk delete failed', variant: 'destructive' }); }
  };

  return (
    <main className="pt-20 max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-4">All Generated Audio</h1>
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
        {pageItems.map(a => (
          <div key={a.id} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white text-sm">{a.prompt.substring(0,80)}...</div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => download(a.id)}>Download</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>Delete</Button>
                {a.audioUrl && <Button size="sm" variant="ghost" onClick={() => window.open(a.audioUrl!, '_blank')}>Open</Button>}
              </div>
            </div>
            {a.audioUrl && <audio controls src={a.audioUrl} className="w-full" />}
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
