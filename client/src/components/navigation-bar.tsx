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
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200" data-testid="navigation-bar">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-cross text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Divine AI</h1>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">BETA</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`hover:text-blue-600 transition-colors text-gray-600 ${
                  location === item.id ? 'text-blue-600 font-medium' : ''
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
              className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>
            
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-white border-gray-200">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className={`text-left px-4 py-3 rounded-lg hover:text-blue-600 hover:bg-gray-50 transition-all flex items-center space-x-3 text-gray-700 ${
                          location === item.id ? 'text-blue-600 bg-blue-50 font-medium' : ''
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
