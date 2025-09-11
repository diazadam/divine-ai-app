import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/glass-card';

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Read optional return path and toast signal
  const { returnTo, toastAfter } = useMemo(() => {
    if (typeof window === 'undefined') return { returnTo: '', toastAfter: '' };
    const p = new URLSearchParams(window.location.search);
    return {
      returnTo: p.get('returnTo') || '',
      toastAfter: p.get('toastAfter') || '',
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ username, password });
      // Optionally signal a post-login toast to the destination page
      if (toastAfter) {
        try { localStorage.setItem('postLoginToast', toastAfter); } catch {}
      }
      // Immediate feedback on login
      toast({ title: 'Welcome back!', description: `Signed in as ${username}` });
      setLocation(returnTo || '/');
    } catch (e: any) {
      setError('Invalid credentials');
      toast({ title: 'Login failed', variant: 'destructive' });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </GlassCard>
    </section>
  );
}
