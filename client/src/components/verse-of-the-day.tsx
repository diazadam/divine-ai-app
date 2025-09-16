import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quote, Share2, Bookmark, Copy, RotateCcw, Heart, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyVerse {
  reference: string;
  text: string;
  version: string;
  theme: string;
  reflection: string;
  date: string;
}

const inspirationalVerses: DailyVerse[] = [
  {
    reference: "Jeremiah 29:11",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    version: "NIV",
    theme: "Hope & Future",
    reflection: "God has a beautiful plan for your life, even when you can't see it. Trust in His timing and His love for you.",
    date: new Date().toISOString().split('T')[0]
  },
  {
    reference: "Philippians 4:13",
    text: "I can do all this through him who gives me strength.",
    version: "NIV",
    theme: "Strength & Courage",
    reflection: "Whatever challenges you face today, remember that Christ's strength is available to you. You are more capable than you know.",
    date: new Date().toISOString().split('T')[0]
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    version: "NIV",
    theme: "Faith & Trust",
    reflection: "Even in difficult times, God is weaving all things together for your good. Trust His perfect plan.",
    date: new Date().toISOString().split('T')[0]
  },
  {
    reference: "Psalm 46:10",
    text: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
    version: "NIV",
    theme: "Peace & Rest",
    reflection: "In our busy world, take time to be still and remember who God is. Find peace in His presence.",
    date: new Date().toISOString().split('T')[0]
  }
];

export default function VerseOfTheDay() {
  const [currentVerse, setCurrentVerse] = useState<DailyVerse>(inspirationalVerses[0]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load today's verse based on date
    const today = new Date().toISOString().split('T')[0];
    const savedVerse = localStorage.getItem(`verseOfTheDay-${today}`);
    
    if (savedVerse) {
      setCurrentVerse(JSON.parse(savedVerse));
    } else {
      // Select a verse based on the day of year
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const selectedVerse = inspirationalVerses[dayOfYear % inspirationalVerses.length];
      setCurrentVerse({ ...selectedVerse, date: today });
      localStorage.setItem(`verseOfTheDay-${today}`, JSON.stringify(selectedVerse));
    }

    // Load user preferences
    const likedVerses = JSON.parse(localStorage.getItem('likedVerses') || '[]');
    const bookmarkedVerses = JSON.parse(localStorage.getItem('bookmarkedVerses') || '[]');
    
    setIsLiked(likedVerses.includes(currentVerse.reference));
    setIsBookmarked(bookmarkedVerses.includes(currentVerse.reference));
  }, []);

  const handleLike = () => {
    const likedVerses = JSON.parse(localStorage.getItem('likedVerses') || '[]');
    if (isLiked) {
      const updatedLikes = likedVerses.filter((ref: string) => ref !== currentVerse.reference);
      localStorage.setItem('likedVerses', JSON.stringify(updatedLikes));
      setIsLiked(false);
      toast({ title: 'Removed from favorites' });
    } else {
      likedVerses.push(currentVerse.reference);
      localStorage.setItem('likedVerses', JSON.stringify(likedVerses));
      setIsLiked(true);
      toast({ title: 'Added to favorites' });
    }
  };

  const handleBookmark = () => {
    const bookmarkedVerses = JSON.parse(localStorage.getItem('bookmarkedVerses') || '[]');
    if (isBookmarked) {
      const updatedBookmarks = bookmarkedVerses.filter((ref: string) => ref !== currentVerse.reference);
      localStorage.setItem('bookmarkedVerses', JSON.stringify(updatedBookmarks));
      setIsBookmarked(false);
      toast({ title: 'Bookmark removed' });
    } else {
      bookmarkedVerses.push(currentVerse.reference);
      localStorage.setItem('bookmarkedVerses', JSON.stringify(bookmarkedVerses));
      setIsBookmarked(true);
      toast({ title: 'Verse bookmarked' });
    }
  };

  const handleCopy = () => {
    const text = `"${currentVerse.text}" - ${currentVerse.reference} (${currentVerse.version})`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Verse copied to clipboard' });
  };

  const handleShare = async () => {
    const text = `${currentVerse.text} - ${currentVerse.reference}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Verse of the Day',
          text: text,
          url: window.location.href
        });
      } catch (error) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const getNewVerse = () => {
    const randomIndex = Math.floor(Math.random() * inspirationalVerses.length);
    const newVerse = inspirationalVerses[randomIndex];
    setCurrentVerse(newVerse);
    toast({ title: 'New verse loaded' });
  };

  const getThemeColor = (theme: string) => {
    switch (theme.toLowerCase()) {
      case 'hope & future': return 'bg-blue-600';
      case 'strength & courage': return 'bg-red-600';
      case 'faith & trust': return 'bg-green-600';
      case 'peace & rest': return 'bg-purple-600';
      default: return 'bg-purple-600';
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-purple-800/30 to-violet-800/30 border-purple-500/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-violet-600/20 p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold flex items-center">
              <Quote className="w-6 h-6 mr-2 text-purple-400" />
              Verse of the Day
            </h3>
            <Button variant="ghost" size="icon" onClick={getNewVerse}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <Badge className={getThemeColor(currentVerse.theme)}>
            {currentVerse.theme}
          </Badge>
        </div>

        {/* Verse Content */}
        <div className="p-6">
          <blockquote className="text-lg md:text-xl font-medium text-gray-200 leading-relaxed mb-4 italic">
            "{currentVerse.text}"
          </blockquote>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-purple-400 font-semibold">
              {currentVerse.reference}
            </div>
            <Badge variant="outline" className="text-xs">
              {currentVerse.version}
            </Badge>
          </div>

          {/* Reflection */}
          <div className="bg-slate-800/30 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-slate-300 mb-2">Reflection</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {currentVerse.reflection}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`${isBookmarked ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-300`}
              >
                <Star className={`w-4 h-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}