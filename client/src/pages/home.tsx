import { useLocation } from "wouter";
import NavigationBar from "@/components/navigation-bar";
import HeroSection from "@/components/hero-section";
import MenuCarousel from "@/components/menu-carousel";
import ScriptureEngine from "@/components/scripture-engine";

export default function Home() {
  const [location] = useLocation();
  const isMainPage = location === '/';

  return (
    <div className="bg-divine-gradient min-h-screen text-white font-display overflow-x-hidden relative">
      {/* Particle Background */}
      <div className="particle-bg">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      <NavigationBar />
      
      {isMainPage ? (
        <>
          <HeroSection />
          <MenuCarousel />
        </>
      ) : (
        <>
          {/* Legacy routing - these should now use dedicated pages */}
          {location === '/scripture-search' && <ScriptureEngine />}
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gold-gradient p-2 rounded-xl">
                  <i className="fas fa-cross text-celestial-900 text-xl"></i>
                </div>
                <h3 className="text-2xl font-bold glow-text">Divine AI</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing pastoral ministry through cutting-edge AI technology. Create compelling sermons, generate stunning visuals, and engage your congregation like never before.
              </p>
              <div className="flex space-x-4">
                <div className="bg-divine-600/10 border border-divine-600/30 rounded-lg p-3 flex-1">
                  <div className="text-lg font-bold text-divine-400">2,500+</div>
                  <div className="text-xs text-gray-400">Bible Versions</div>
                </div>
                <div className="bg-sacred-600/10 border border-sacred-600/30 rounded-lg p-3 flex-1">
                  <div className="text-lg font-bold text-sacred-400">AI-Powered</div>
                  <div className="text-xs text-gray-400">Generation</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Live Voice Prayer Sessions</li>
                <li>• AI Pastoral Counseling</li>
                <li>• Theological AI Analysis</li>
                <li>• Multi-Modal Worship Creation</li>
                <li>• Smart Church Integration</li>
                <li>• Advanced Sermon Prep</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Powered By</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• OpenAI GPT-5 & Realtime API</li>
                <li>• MCP Connectors (Google, YouTube)</li>
                <li>• Advanced Theological AI</li>
                <li>• API.Bible (2,500+ versions)</li>
                <li>• DALL-E 3 Visual Generation</li>
                <li>• Live Voice AI Counseling</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Divine AI. Transforming ministry through artificial intelligence.</p>
            <p className="text-xs mt-2">Built with cutting-edge AI technology for the modern church.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
