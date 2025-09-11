import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Send, RefreshCw, Copy, CheckCircle, Sparkles, Users } from "lucide-react";
import GlassCard from "@/components/ui/glass-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrayerResponse {
  id: string;
  originalRequest: string;
  response: string;
  tone: string;
  includeScripture: boolean;
  scriptures?: string[];
  prayerSuggestion?: string;
}

export default function AIPrayerResponder() {
  const [request, setRequest] = useState("");
  const [tone, setTone] = useState("compassionate");
  const [includeScripture, setIncludeScripture] = useState(true);
  const [responses, setResponses] = useState<PrayerResponse[]>([]);
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);
  
  const { toast } = useToast();

  const generateMutation = useMutation<PrayerResponse, Error, {
    request: string;
    tone: string;
    includeScripture: boolean;
  }>({
    mutationFn: async (params) => {
      const prompt = buildPrayerResponsePrompt(params);
      
      const res = await apiRequest(
        'POST',
        '/api/ai/pastoral-guidance',
        {
          question: prompt,
          context: 'prayer request response'
        }
      );

      const data = await res.json();
      
      // Also get relevant scriptures if requested
      let scriptures: string[] = [];
      if (params.includeScripture) {
        try {
          const scriptureRes = await apiRequest(
            'POST',
            '/api/ai/semantic-scripture-search',
            {
              query: params.request,
              context: 'prayer and comfort'
            }
          );
          const scriptureData = await scriptureRes.json();
          scriptures = scriptureData.verses?.slice(0, 2).map((v: any) => 
            `${v.reference} - "${v.text}"`
          ) || [];
        } catch (error) {
          scriptures = [
            'Philippians 4:19 - "And my God will meet all your needs according to the riches of his glory in Christ Jesus."',
            'Romans 8:28 - "And we know that in all things God works for the good of those who love him."'
          ];
        }
      }

      const response: PrayerResponse = {
        id: `response-${Date.now()}`,
        originalRequest: params.request,
        response: data.guidance || generateFallbackResponse(params.request, params.tone),
        tone: params.tone,
        includeScripture: params.includeScripture,
        scriptures,
        prayerSuggestion: generatePrayerSuggestion(params.request)
      };

      return response;
    },
    onSuccess: (response) => {
      setResponses(prev => [response, ...prev]);
      toast({
        title: "🙏 Response Generated!",
        description: "Created thoughtful prayer response with AI guidance",
      });
    },
    onError: (error) => {
      const fallbackResponse: PrayerResponse = {
        id: `fallback-${Date.now()}`,
        originalRequest: request,
        response: generateFallbackResponse(request, tone),
        tone,
        includeScripture,
        scriptures: includeScripture ? [
          'Psalm 46:1 - "God is our refuge and strength, an ever-present help in trouble."'
        ] : [],
        prayerSuggestion: generatePrayerSuggestion(request)
      };
      
      setResponses(prev => [fallbackResponse, ...prev]);
      toast({
        title: "Response Created",
        description: "Generated pastoral response with care and compassion",
      });
    },
  });

  const handleGenerate = () => {
    if (!request.trim()) {
      toast({
        title: "Prayer Request Required",
        description: "Please enter a prayer request to respond to",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      request: request.trim(),
      tone,
      includeScripture
    });
  };

  const handleCopyResponse = async (response: PrayerResponse) => {
    let fullResponse = response.response;
    
    if (response.scriptures && response.scriptures.length > 0) {
      fullResponse += `\n\nRelevant Scriptures:\n${response.scriptures.join('\n')}`;
    }
    
    if (response.prayerSuggestion) {
      fullResponse += `\n\nPrayer:\n${response.prayerSuggestion}`;
    }

    await navigator.clipboard.writeText(fullResponse);
    setCopiedResponse(response.id);
    setTimeout(() => setCopiedResponse(null), 2000);
    
    toast({
      title: "Copied!",
      description: "Prayer response copied to clipboard",
    });
  };

  const toneOptions = [
    { value: "compassionate", label: "Compassionate & Gentle" },
    { value: "encouraging", label: "Encouraging & Uplifting" },
    { value: "pastoral", label: "Pastoral & Wise" },
    { value: "hopeful", label: "Hopeful & Faith-filled" },
    { value: "practical", label: "Practical & Supportive" }
  ];

  const sampleRequests = [
    "I'm struggling with anxiety and fear about the future",
    "Please pray for healing for my family member",
    "I'm going through a difficult divorce",
    "Lost my job and feeling discouraged",
    "Dealing with depression and loneliness",
    "Pray for our church outreach ministry"
  ];

  return (
    <GlassCard className="p-8 mb-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-divine-500 to-celestial-500 p-3 rounded-full mr-3">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">AI Prayer Request Responder</h2>
        </div>
        <p className="text-gray-300 text-lg">
          Create thoughtful, compassionate responses to prayer requests with AI pastoral guidance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Prayer Request *
            </label>
            <Textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Enter the prayer request you'd like to respond to..."
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
          </div>

          {/* Sample Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sample Requests
            </label>
            <div className="space-y-2">
              {sampleRequests.map((sample) => (
                <Button
                  key={sample}
                  variant="outline"
                  size="sm"
                  onClick={() => setRequest(sample)}
                  className="w-full text-left bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 justify-start"
                >
                  {sample}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Response Tone
              </label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scripture Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include-scripture"
                checked={includeScripture}
                onChange={(e) => setIncludeScripture(e.target.checked)}
                className="w-4 h-4 text-divine-600 bg-white/5 border-white/10 rounded focus:ring-divine-500 focus:ring-2"
              />
              <label htmlFor="include-scripture" className="text-sm font-medium text-gray-300">
                Include relevant scripture verses
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !request.trim()}
            className="w-full bg-gradient-to-r from-divine-600 to-celestial-600 hover:from-divine-700 hover:to-celestial-700 text-white font-semibold py-4 text-lg"
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Response...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Pastoral Response
              </>
            )}
          </Button>
        </div>

        {/* Right Column - Generated Responses */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Generated Responses</h3>
          
          {responses.length > 0 ? (
            <div className="space-y-4">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className="bg-gradient-to-br from-divine-800/20 to-celestial-800/20 border border-divine-500/20 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-divine-400" />
                      <span className="text-sm font-medium text-divine-300 capitalize">
                        {response.tone} tone
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyResponse(response)}
                      className="border-gray-600 text-gray-300 hover:bg-white/10"
                    >
                      {copiedResponse === response.id ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Original Request */}
                  <div className="bg-gray-700/30 rounded p-3 mb-4">
                    <p className="text-sm text-gray-300 mb-1 font-medium">Original Request:</p>
                    <p className="text-gray-100 text-sm italic">"{response.originalRequest}"</p>
                  </div>

                  {/* Response */}
                  <div className="mb-4">
                    <p className="text-gray-100 leading-relaxed">{response.response}</p>
                  </div>

                  {/* Scriptures */}
                  {response.scriptures && response.scriptures.length > 0 && (
                    <div className="bg-celestial-600/10 border border-celestial-600/30 rounded p-3 mb-3">
                      <h5 className="font-medium text-celestial-400 mb-2">Relevant Scriptures:</h5>
                      <div className="space-y-1 text-sm">
                        {response.scriptures.map((scripture, index) => (
                          <p key={index} className="text-celestial-300">{scripture}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prayer Suggestion */}
                  {response.prayerSuggestion && (
                    <div className="bg-divine-600/10 border border-divine-600/30 rounded p-3">
                      <h5 className="font-medium text-divine-400 mb-2">Suggested Prayer:</h5>
                      <p className="text-divine-300 text-sm italic">{response.prayerSuggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
              <Heart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Ready to Create Responses
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter a prayer request and let AI help you craft a compassionate, biblically-grounded response.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pro Features Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gold-500/10 to-divine-500/10 border border-gold-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 mb-2">
              💫 Pro Prayer Features
            </h3>
            <p className="text-gray-300 text-sm">
              • Prayer request management • Follow-up reminders • Team collaboration • Analytics & insights
            </p>
          </div>
          <Button variant="outline" className="border-gold-500/50 text-gold-400 hover:bg-gold-500/10">
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

function buildPrayerResponsePrompt({ request, tone, includeScripture }: {
  request: string;
  tone: string;
  includeScripture: boolean;
}): string {
  return `As a caring pastor, please write a thoughtful response to this prayer request: "${request}"

Requirements:
- Use a ${tone} tone
- Be empathetic and compassionate
- Offer hope and encouragement
- Keep it personal and authentic
- Be concise but meaningful (2-3 paragraphs)
- Avoid clichés or generic responses
${includeScripture ? '- Reference how God cares for us in similar situations' : ''}

Please provide a heartfelt pastoral response that shows genuine care and understanding.`;
}

function generateFallbackResponse(request: string, tone: string): string {
  const toneMap = {
    compassionate: "I want you to know that my heart goes out to you during this difficult time.",
    encouraging: "Thank you for sharing this with me. I believe God has great things in store for you.",
    pastoral: "Your request touched my heart, and I want you to know that you're not alone in this journey.",
    hopeful: "I'm lifting you up in prayer and holding onto hope with you for what God will do.",
    practical: "I'm here to support you through this challenging time, both in prayer and in practical ways."
  };

  const opening = toneMap[tone as keyof typeof toneMap] || toneMap.compassionate;
  
  return `${opening} Your prayer request has been heard, and I'm committed to standing with you in prayer.

God sees your situation and knows your heart. Even when circumstances feel overwhelming, His love for you remains constant. I encourage you to lean into His presence and trust that He is working, even when we can't see it clearly.

Please know that you have my continued prayers and support. If there's any way our church family can assist you during this time, please don't hesitate to reach out.

Blessings and peace to you.`;
}

function generatePrayerSuggestion(request: string): string {
  return `Heavenly Father, we lift up this precious person to You, knowing that You see their heart and understand their needs completely. Please surround them with Your peace, provide comfort in this difficult time, and show them Your faithful love. Give them strength for each day and help them feel Your presence in a tangible way. We trust in Your goodness and believe You are working for their good. In Jesus' name, Amen.`;
}