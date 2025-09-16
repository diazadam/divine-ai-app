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
    { id: '/media/images', label: 'Gallery' },
    { id: '/gemini-chat', label: 'Personal AI' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass-card border-b border-white/20" data-testid="navigation-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-cross text-white text-lg"></i>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Divine AI</h1>
            <span className="hidden sm:inline-block text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold shadow-md">BETA</span>
          </div>
          
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`hover:text-purple-600 transition-all text-gray-700 font-medium ${
                  location === item.id ? 'text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-semibold' : ''
                }`}
                data-testid={`nav-link-${item.id.replace('/', '')}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex p-2 rounded-xl glass-card hover:scale-110 transition-all"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5 text-purple-600" />
            </Button>
            
            <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="glass-card border-white/20">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl hover:bg-white/50 transition-all flex items-center space-x-3 text-gray-700 font-medium ${
                          location === item.id ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold' : ''
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
