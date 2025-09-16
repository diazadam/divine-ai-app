import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import UserSettings from '@/components/user-settings';
import { Settings } from 'lucide-react';
import { useState } from 'react';

export default function AppHeader() {
  const { me, logout } = useAuth();
  const [loc, setLocation] = useLocation();
  const isAuthed = me.data && !me.isError;
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/"><a className="hover:text-white text-gray-300">Home</a></Link>
          <Link href="/scripture-search"><a className="hover:text-white text-gray-300">Scripture</a></Link>
          <Link href="/gemini-chat"><a className="hover:text-white text-gray-300">Chat</a></Link>
          <Link href="/sermon-prep"><a className="hover:text-white text-gray-300">Sermon Prep</a></Link>
          {isAuthed && (
            <>
              <Link href="/podcast-studio"><a className="hover:text-green-300 text-green-400 font-medium">🎙️ Podcast</a></Link>
              <Link href="/media-creator"><a className="hover:text-pink-300 text-pink-400 font-medium">🎨 AI Media</a></Link>
              <Link href="/media/images"><a className="hover:text-orange-300 text-orange-400 font-medium">🖼️ Images</a></Link>
              <Link href="/media/videos"><a className="hover:text-red-300 text-red-400 font-medium">🎬 Videos</a></Link>
              <Link href="/media/audios"><a className="hover:text-blue-300 text-blue-400 font-medium">🎵 Audio</a></Link>
              <Link href="/social-media"><a className="hover:text-blue-300 text-blue-400 font-medium">📱 Social</a></Link>
              <Link href="/audio-editor"><a className="hover:text-cyan-300 text-cyan-400 font-medium">🎧 Audio Editor</a></Link>
              <Link href="/admin"><a className="hover:text-purple-300 text-purple-400 font-medium">⚙️ Admin</a></Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
                title="User Settings"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
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

      {/* User Settings Modal */}
      <UserSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
}
