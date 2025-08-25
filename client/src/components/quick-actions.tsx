import { ScrollText, Mic, Image, BookOpen } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  targetSection: string;
}

export default function QuickActions() {
  const quickActions: QuickAction[] = [
    {
      id: 'sermon-prep',
      title: 'Sermon Prep',
      description: 'AI-powered sermon outlines with biblical insights',
      icon: <ScrollText className="text-xl" />,
      bgColor: 'bg-divine-600',
      targetSection: 'sermon-prep',
    },
    {
      id: 'podcast-studio',
      title: 'Podcast Studio',
      description: 'Transform sermons into professional podcasts',
      icon: <Mic className="text-xl" />,
      bgColor: 'bg-sacred-600',
      targetSection: 'podcasts',
    },
    {
      id: 'visual-creator',
      title: 'Visual Creator',
      description: 'Generate stunning sermon backgrounds and graphics',
      icon: <Image className="text-xl" />,
      bgColor: 'bg-gradient-to-r from-divine-600 to-sacred-600',
      targetSection: 'media',
    },
    {
      id: 'scripture-search',
      title: 'Scripture Search',
      description: 'Intelligent biblical cross-reference engine',
      icon: <BookOpen className="text-xl" />,
      bgColor: 'bg-celestial-600',
      targetSection: 'scripture',
    },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="mb-16 relative z-10" data-testid="quick-actions">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <GlassCard
              key={action.id}
              className="p-6 hover:bg-white/10 transition-all cursor-pointer group premium-shadow"
              onClick={() => scrollToSection(action.targetSection)}
              data-testid={`quick-action-${action.id}`}
            >
              <div className={`${action.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
