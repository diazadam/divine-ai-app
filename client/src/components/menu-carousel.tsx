import { useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ScrollText, Mic, Image, BookOpen, Coffee } from "lucide-react";

interface MenuCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  gradient: string;
  image: string;
}

export default function MenuCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const menuCards: MenuCard[] = [
    {
      id: 'sermon-prep',
      title: 'Sermon Preparation',
      description: 'AI-powered sermon outlines with biblical insights and cross-references',
      route: '/sermon-prep',
      icon: <ScrollText className="w-8 h-8" />,
      gradient: 'from-divine-600 to-divine-400',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600'
    },
    {
      id: 'podcast-studio',
      title: 'Podcast Studio',
      description: 'Transform your sermons into professional podcasts with AI enhancement',
      route: '/podcast-studio',
      icon: <Mic className="w-8 h-8" />,
      gradient: 'from-sacred-600 to-sacred-400',
      image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600'
    },
    {
      id: 'visual-media',
      title: 'Visual Media Creator',
      description: 'Generate stunning sermon backgrounds and church graphics with AI',
      route: '/media-creator',
      icon: <Image className="w-8 h-8" />,
      gradient: 'from-celestial-600 to-divine-500',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600'
    },
    {
      id: 'scripture-engine',
      title: 'Scripture Engine',
      description: 'Intelligent biblical search with cross-references and commentary',
      route: '/scripture-search',
      icon: <BookOpen className="w-8 h-8" />,
      gradient: 'from-divine-500 to-sacred-600',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600'
    },
    {
      id: 'personal-assistant',
      title: 'Personal AI Companion',
      description: 'Your space to relax and explore interests beyond ministry',
      route: '/gemini-chat',
      icon: <Coffee className="w-8 h-8" />,
      gradient: 'from-sacred-500 to-celestial-600',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600'
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % menuCards.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + menuCards.length) % menuCards.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 gradient-bg-primary relative overflow-hidden" data-testid="menu-carousel">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Ministry Toolkit
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto px-4 font-light">
            Powerful AI tools designed to amplify your spiritual impact
          </p>
        </div>

        {/* Main Carousel */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {menuCards.map((card, index) => (
                <div key={card.id} className="w-full flex-shrink-0">
                  <div className="relative h-96 lg:h-[500px] mx-4">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 rounded-3xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${card.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 opacity-90 rounded-3xl"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-12">
                      <div className="glass-dark rounded-3xl p-8 lg:p-12 border border-white/20">
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl">
                            {card.icon}
                          </div>
                          <h3 className="text-3xl lg:text-4xl font-bold text-white">
                            {card.title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-100 text-xl mb-8 leading-relaxed">
                          {card.description}
                        </p>
                        
                        <Link href={card.route}>
                          <button 
                            className="bg-white text-purple-700 hover:bg-white/90 rounded-2xl px-10 py-4 font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                            data-testid={`card-link-${card.id}`}
                          >
                            Launch Tool →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 glass-dark hover:scale-110 rounded-full p-4 text-white transition-all duration-300 shadow-2xl"
            data-testid="carousel-prev"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 glass-dark hover:scale-110 rounded-full p-4 text-white transition-all duration-300 shadow-2xl"
            data-testid="carousel-next"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center mt-8 space-x-2">
          {menuCards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-150 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              data-testid={`carousel-dot-${index}`}
            />
          ))}
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden mt-16 grid grid-cols-1 gap-6 px-4">
          {menuCards.map((card) => (
            <Link key={card.id} href={card.route}>
              <div 
                className="relative h-48 sm:h-56 rounded-2xl bg-cover bg-center overflow-hidden group cursor-pointer transform hover:scale-105 transition-transform duration-300"
                style={{ backgroundImage: `url(${card.image})` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-75 group-hover:opacity-85 transition-opacity`}></div>
                <div className="relative z-10 h-full flex flex-col justify-end p-6">
                  <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{card.title}</h3>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}