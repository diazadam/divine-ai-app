import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, User, Home } from "lucide-react";

export default function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();

  const handleNavigation = (route: string) => {
    navigate(route);
    setIsOpen(false);
  };

  const navItems = [
    { id: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: '/sermon-prep', label: 'Sermon Prep' },
    { id: '/podcast-studio', label: 'Podcasts' },
    { id: '/scripture-search', label: 'Scripture' },
    { id: '/media-creator', label: 'Media' },
    { id: '/gemini-chat', label: 'Personal AI' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-effect" data-testid="navigation-bar">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gold-gradient p-2 rounded-xl">
              <i className="fas fa-cross text-celestial-900 text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold glow-text shimmer-text">Divine AI</h1>
            <span className="text-xs bg-sacred-600 px-2 py-1 rounded-full">BETA</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`hover:text-divine-400 transition-colors ${
                  location === item.id ? 'text-divine-400' : ''
                }`}
                data-testid={`nav-link-${item.id.replace('/', '')}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-lg glass-effect hover:bg-white/10 transition-all"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="w-8 h-8 bg-divine-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-celestial-900/95 border-white/10">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`text-left px-4 py-3 rounded-lg hover:text-divine-400 hover:bg-white/10 transition-all flex items-center space-x-3 ${
                          location === item.id ? 'text-divine-400 bg-white/5' : ''
                        }`}
                        data-testid={`mobile-nav-link-${item.id.replace('/', '')}`}
                      >
                        {item.icon && item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
