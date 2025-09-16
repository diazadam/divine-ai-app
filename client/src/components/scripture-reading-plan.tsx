import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, Target, Book, Flame } from 'lucide-react';

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  category: 'chronological' | 'topical' | 'book' | 'devotional';
  totalDays: number;
  currentDay: number;
  passages: string[];
  icon: React.ReactNode;
}

const readingPlans: ReadingPlan[] = [
  {
    id: 'bible-year',
    name: 'Bible in a Year',
    description: 'Read through the entire Bible in 365 days',
    duration: '365 days',
    category: 'chronological',
    totalDays: 365,
    currentDay: 42,
    passages: ['Genesis 1-3', 'Matthew 1-2'],
    icon: <Book className="w-5 h-5" />
  },
  {
    id: 'psalms-month',
    name: 'Psalms in a Month',
    description: 'Experience the beauty of Psalms',
    duration: '30 days',
    category: 'book',
    totalDays: 30,
    currentDay: 15,
    passages: ['Psalm 45-50'],
    icon: <Target className="w-5 h-5" />
  },
  {
    id: 'new-testament',
    name: 'New Testament in 90 Days',
    description: 'Focus on the teachings of Christ',
    duration: '90 days',
    category: 'chronological',
    totalDays: 90,
    currentDay: 23,
    passages: ['Mark 8-10'],
    icon: <Flame className="w-5 h-5" />
  }
];

export default function ScriptureReadingPlan() {
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [todayCompleted, setTodayCompleted] = useState(false);

  useEffect(() => {
    // Load reading plan progress from localStorage
    const savedPlan = localStorage.getItem('currentReadingPlan');
    const savedProgress = localStorage.getItem('readingPlanProgress');
    
    if (savedPlan && savedProgress) {
      const plan = JSON.parse(savedPlan);
      const progress = JSON.parse(savedProgress);
      setSelectedPlan({ ...plan, currentDay: progress.currentDay });
      setTodayCompleted(progress.todayCompleted);
    }
  }, []);

  const startPlan = (plan: ReadingPlan) => {
    const newPlan = { ...plan, currentDay: 1 };
    setSelectedPlan(newPlan);
    localStorage.setItem('currentReadingPlan', JSON.stringify(newPlan));
    localStorage.setItem('readingPlanProgress', JSON.stringify({ currentDay: 1, todayCompleted: false }));
  };

  const markDayComplete = () => {
    if (!selectedPlan) return;
    
    const newProgress = {
      currentDay: Math.min(selectedPlan.currentDay + 1, selectedPlan.totalDays),
      todayCompleted: true
    };
    
    setTodayCompleted(true);
    setSelectedPlan(prev => prev ? { ...prev, currentDay: newProgress.currentDay } : null);
    localStorage.setItem('readingPlanProgress', JSON.stringify(newProgress));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chronological': return 'bg-blue-600';
      case 'topical': return 'bg-green-600';
      case 'book': return 'bg-purple-600';
      case 'devotional': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'chronological': return 'Chronological';
      case 'topical': return 'Topical';
      case 'book': return 'Book Study';
      case 'devotional': return 'Devotional';
      default: return 'General';
    }
  };

  if (!selectedPlan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-divine-500" />
            Reading Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {readingPlans.map((plan) => (
              <div
                key={plan.id}
                className="border border-white/10 rounded-lg p-4 hover:border-divine-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-divine-500 mr-3">{plan.icon}</div>
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(plan.category)}>
                    {getCategoryLabel(plan.category)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {plan.duration}
                  </div>
                  <Button size="sm" onClick={() => startPlan(plan)}>
                    Start Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = (selectedPlan.currentDay / selectedPlan.totalDays) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-divine-500 mr-2">{selectedPlan.icon}</div>
            {selectedPlan.name}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)}>
            Change Plan
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-400">
              Day {selectedPlan.currentDay} of {selectedPlan.totalDays}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>

        {/* Today's Reading */}
        <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Today's Reading
            </h3>
            {todayCompleted && (
              <Badge className="bg-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            {selectedPlan.passages.map((passage, index) => (
              <div key={index} className="text-sm">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-divine-400">
                  {passage}
                </Button>
              </div>
            ))}
          </div>

          {!todayCompleted && (
            <Button onClick={markDayComplete} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-divine-400">{selectedPlan.currentDay - 1}</div>
            <div className="text-xs text-gray-400">Days Complete</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sacred-400">{selectedPlan.totalDays - selectedPlan.currentDay + 1}</div>
            <div className="text-xs text-gray-400">Days Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-celestial-400">
              {Math.round((selectedPlan.currentDay - 1) / selectedPlan.totalDays * 100)}%
            </div>
            <div className="text-xs text-gray-400">Progress</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}