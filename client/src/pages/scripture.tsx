import { useState } from 'react';
import ScriptureEngine from '@/components/scripture-engine';
import EnhancedScriptureEngine from '@/components/enhanced-scripture-engine';
import { Button } from '@/components/ui/button';
import { Sparkles, Book } from 'lucide-react';

export default function ScripturePage() {
  const [useEnhancedVersion, setUseEnhancedVersion] = useState(true);

  return (
    <div className="relative">
      {/* Version Toggle */}
      <div className="fixed top-20 right-4 z-50">
        <div className="bg-black/50 backdrop-blur-md rounded-xl p-2 border border-white/10">
          <Button
            variant={useEnhancedVersion ? "default" : "ghost"}
            size="sm"
            onClick={() => setUseEnhancedVersion(true)}
            className="mr-1"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Enhanced
          </Button>
          <Button
            variant={!useEnhancedVersion ? "default" : "ghost"}
            size="sm"
            onClick={() => setUseEnhancedVersion(false)}
          >
            <Book className="w-4 h-4 mr-1" />
            Classic
          </Button>
        </div>
      </div>

      {/* Render the selected version */}
      {useEnhancedVersion ? <EnhancedScriptureEngine /> : <ScriptureEngine />}
    </div>
  );
}

