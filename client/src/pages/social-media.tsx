import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialAutomation from "@/components/social-automation";
import AutoSocialGraphics from "@/components/auto-social-graphics";
import { Share2, Calendar, Image, Sparkles } from "lucide-react";

export default function SocialMediaPage() {
  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 p-4 rounded-full mr-4 shadow-2xl">
              <Share2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                📱 Social Media Suite
              </h1>
              <p className="text-xl text-purple-200">OpenAI GPT-5 Powered Social Content & Automation for Ministry</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-blue-400">
                <Calendar className="w-5 h-5" />
                <span className="font-bold">Smart Scheduling</span>
              </div>
              <p className="text-xs text-blue-200 mt-1">Automated posting</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-pink-400">
                <Image className="w-5 h-5" />
                <span className="font-bold">AI Graphics</span>
              </div>
              <p className="text-xs text-pink-200 mt-1">Generated visuals</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">Multi-Platform</span>
              </div>
              <p className="text-xs text-purple-200 mt-1">All networks</p>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="automation" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-8 bg-white/10 backdrop-blur-sm">
            <TabsTrigger 
              value="automation" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300"
            >
              <Calendar className="w-5 h-5" />
              <span>Social Automation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="graphics" 
              className="flex items-center space-x-2 data-[state=active]:bg-pink-500/30 data-[state=active]:text-pink-300"
            >
              <Image className="w-5 h-5" />
              <span>AI Graphics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automation">
            <SocialAutomation />
          </TabsContent>

          <TabsContent value="graphics">
            <AutoSocialGraphics />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}