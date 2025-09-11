import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import GlassCard from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SharedCollectionPage() {
  const [data, setData] = useState<{ name?: string; description?: string; verses?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { me } = useAuth();
  const { toast } = useToast();

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/api/share/collection?token=${encodeURIComponent(token)}`);
        setData(res as any);
      } catch (e: any) {
        setError('Invalid or expired share link');
      }
    })();
  }, [token]);

  // Show a helpful toast after login redirect
  useEffect(() => {
    try {
      const signal = localStorage.getItem('postLoginToast');
      if (signal === 'importReady') {
        toast({ title: 'Signed in', description: 'You can import this collection now.' });
        localStorage.removeItem('postLoginToast');
      }
    } catch {}
  }, [toast]);

  const importToAccount = async () => {
    if (!data) return;
    try {
      await apiClient.post('/api/scripture-collections/import', {
        name: data.name || 'Imported Collection',
        description: data.description || '',
        verses: data.verses || [],
      });
      alert('Collection imported to your account');
    } catch (e) {
      alert('Import failed (are you signed in?)');
    }
  };

  return (
    <section className="min-h-screen pt-24 pb-16 relative z-10">
      <div className="max-w-3xl mx-auto px-4">
        <GlassCard className="p-6">
          <h1 className="text-2xl font-bold mb-2">Shared Collection</h1>
          {error && <div className="text-sm text-red-400">{error}</div>}
          {!error && !data && <div className="text-sm text-gray-400">Loading…</div>}
          {data && (
            <div className="space-y-3">
              <div className="text-lg font-medium">{data.name}</div>
              {data.description && <div className="text-sm text-gray-300">{data.description}</div>}
              <div className="space-y-2">
                {(data.verses || []).map((v: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-celestial-800/30">
                    <div className="text-sm font-medium text-divine-400">{v.reference}</div>
                    <div className="text-sm text-gray-300">{v.text}</div>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                {me.data ? (
                  <Button onClick={importToAccount}>Import into My Collections</Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Sign in to import this collection.</span>
                    <Link href={`/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}&toastAfter=importReady`}>
                      <Button size="sm" variant="outline">Sign In</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  );
}
