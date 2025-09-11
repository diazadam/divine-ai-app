import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/glass-card';

export default function RegisterPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ username, password, email });
      toast({ title: 'Account created', description: 'Please sign in' });
      setLocation('/login');
    } catch (e: any) {
      setError('Registration failed');
      toast({ title: 'Registration failed', variant: 'destructive' });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
      </GlassCard>
    </section>
  );
}
