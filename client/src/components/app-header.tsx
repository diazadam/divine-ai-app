import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { me, logout } = useAuth();
  const [loc, setLocation] = useLocation();
  const isAuthed = me.data && !me.isError;
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/"><a className="hover:text-white text-gray-300">Home</a></Link>
          <Link href="/scripture-search"><a className="hover:text-white text-gray-300">Scripture</a></Link>
          <Link href="/gemini-chat"><a className="hover:text-white text-gray-300">Chat</a></Link>
          <Link href="/sermon-prep"><a className="hover:text-white text-gray-300">Sermon Prep</a></Link>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <span className="text-sm text-gray-300">{me.data?.username}</span>
              <Button size="sm" variant="outline" onClick={() => logout.mutate(undefined, { onSuccess: () => toast({ title: 'Signed out' }) })}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button size="sm" variant="outline">Login</Button></Link>
              <Link href="/register"><Button size="sm">Register</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
