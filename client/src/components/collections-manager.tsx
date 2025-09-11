import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface VerseItem { reference: string; text: string; version?: string }

export default function CollectionsManager({ onAddToSermon }: { onAddToSermon: (v: VerseItem) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery<any[]>({ queryKey: ['/api/scripture-collections'], queryFn: () => apiClient.get('/api/scripture-collections') });
  const collections = data || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => collections.find(c => c.id === selectedId) || null, [collections, selectedId]);

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => apiClient.post('/api/scripture-collections', { ...payload, verses: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/scripture-collections'] }); toast({ title: 'Collection created' }); },
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; name?: string; description?: string; verses?: VerseItem[] }) => apiClient.patch(`/api/scripture-collections/${payload.id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/scripture-collections'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/scripture-collections/${id}`),
    onSuccess: () => { setSelectedId(null); qc.invalidateQueries({ queryKey: ['/api/scripture-collections'] }); toast({ title: 'Collection deleted' }); },
  });

  const removeVerseMut = useMutation({
    mutationFn: (payload: { id: string; index: number }) => apiClient.patch(`/api/scripture-collections/${payload.id}/remove-verse`, { index: payload.index }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/scripture-collections'] }); },
  });

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [importText, setImportText] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');

  const exportCollection = async (id: string, name: string) => {
    const data = await apiClient.get(`/api/scripture-collections/${id}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\W+/g, '-') || 'collection'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importCollection = async () => {
    try {
      const parsed = JSON.parse(importText);
      await apiClient.post('/api/scripture-collections/import', parsed);
      setImportText('');
      qc.invalidateQueries({ queryKey: ['/api/scripture-collections'] });
      toast({ title: 'Imported collection' });
    } catch (e) {
      toast({ title: 'Import failed', variant: 'destructive', description: 'Invalid JSON' });
    }
  };

  const shareCollection = async (id: string) => {
    const res: any = await apiClient.post(`/api/scripture-collections/${id}/share`);
    if (res?.url) { await navigator.clipboard.writeText(res.url); toast({ title: 'Share link copied' }); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="New collection name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button onClick={() => { if (newName.trim()) { createMut.mutate({ name: newName, description: newDesc }); setNewName(''); setNewDesc(''); } }}>Create</Button>
      </div>
      <Textarea placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />

      <div className="flex gap-3">
        <div className="w-1/2 space-y-2">
          {collections.map((c: any) => (
            <div key={c.id} className={`p-2 rounded border ${selectedId === c.id ? 'border-divine-600' : 'border-white/10'} cursor-pointer`} onClick={() => setSelectedId(c.id)}>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-400">{c.verses?.length || 0} verses</div>
            </div>
          ))}
        </div>
        <div className="w-1/2">
          {selected ? (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Input value={selected.name} onChange={(e) => updateMut.mutate({ id: selected.id, name: e.target.value })} />
                <Button variant="destructive" onClick={() => deleteMut.mutate(selected.id)}>Delete</Button>
              </div>
              <Textarea value={selected.description || ''} onChange={(e) => updateMut.mutate({ id: selected.id, description: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportCollection(selected.id, selected.name)}>Export JSON</Button>
                <Button variant="outline" onClick={() => shareCollection(selected.id)}>Copy Share Link</Button>
              </div>
              <div className="flex gap-2 items-center">
                <Input placeholder="Recipient email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                <Button variant="outline" onClick={async () => {
                  try {
                    await apiClient.post(`/api/scripture-collections/${selected.id}/share-email`, { to: emailTo, message: emailMsg });
                    setEmailTo('');
                    setEmailMsg('');
                    toast({ title: 'Email sent' });
                  } catch (e) {
                    toast({ title: 'Email failed', variant: 'destructive' });
                  }
                }}>Email Link</Button>
              </div>
              <Textarea placeholder="Message (optional)" value={emailMsg} onChange={(e) => setEmailMsg(e.target.value)} />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {(selected.verses || []).map((v: VerseItem, idx: number) => (
                  <div key={`${v.reference}-${idx}`} className="p-2 rounded bg-celestial-800/30">
                    <div className="text-sm font-medium text-divine-400">{v.reference}</div>
                    <div className="text-sm text-gray-300 line-clamp-2">{v.text}</div>
                    <div className="flex gap-2 mt-1">
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-divine-400" onClick={() => onAddToSermon(v)}>Add to Sermon</Button>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400" onClick={() => navigator.clipboard.writeText(`"${v.text}" - ${v.reference} (${v.version || ''})`)}>Copy</Button>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-red-400" onClick={() => removeVerseMut.mutate({ id: selected.id, index: idx })}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">Select a collection to manage its verses.</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Import Collection (paste JSON)</div>
        <Textarea placeholder='{"name":"My Collection","description":"...","verses":[...]}' value={importText} onChange={(e) => setImportText(e.target.value)} />
        <Button onClick={importCollection}>Import</Button>
      </div>
    </div>
  );
}
