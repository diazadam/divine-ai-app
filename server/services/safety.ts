// Safety and Moderation Service
interface ModerationResult {
  flagged: boolean;
  toxicityScore: number | null;
  labels: string[];
  redactedText?: string;
  redactions?: Array<{
    type: string;
    text: string;
    start: number;
    end: number;
  }>;
}

class SafetyService {
  constructor() {
    console.log('🛡️ Safety service initialized');
  }

  async moderate(text: string, allowOverride: boolean = false): Promise<ModerationResult> {
    // Basic content moderation
    const result: ModerationResult = {
      flagged: false,
      toxicityScore: 0,
      labels: [],
      redactedText: text,
      redactions: []
    };

    // If override is allowed and requested, skip moderation
    if (allowOverride) {
      console.log('⚠️ Moderation override enabled');
      return result;
    }

    // Check for toxic content patterns (simplified)
    const toxicPatterns = [
      /\b(hate|kill|die|attack)\b/gi,
      /\b(stupid|idiot|dumb)\b/gi
    ];

    let toxicityCount = 0;
    for (const pattern of toxicPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        toxicityCount += matches.length;
        result.labels.push('potentially_toxic');
      }
    }

    // Calculate toxicity score (0-1)
    const wordCount = text.split(/\s+/).length;
    result.toxicityScore = Math.min(toxicityCount / Math.max(wordCount, 1), 1);

    // Flag if toxicity exceeds threshold
    if (result.toxicityScore > 0.3) {
      result.flagged = true;
      result.labels.push('high_toxicity');
    }

    // PII Detection and Redaction
    const piiPatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN' },
      { pattern: /\b\d{16}\b/g, type: 'CREDIT_CARD' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'EMAIL' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'PHONE' }
    ];

    let redactedText = text;
    for (const { pattern, type } of piiPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of Array.from(matches)) {
        if (match.index !== undefined) {
          result.redactions?.push({
            type,
            text: match[0],
            start: match.index,
            end: match.index + match[0].length
          });
          
          // Redact the PII
          redactedText = redactedText.replace(match[0], '[REDACTED]');
        }
      }
    }

    if (result.redactions && result.redactions.length > 0) {
      result.redactedText = redactedText;
      result.labels.push('contains_pii');
    }

    return result;
  }

  mapEmotionToTtsParams(emotion: string): any {
    const emotionMap: Record<string, any> = {
      neutral: { stability: 0.5, similarity_boost: 0.75, style: 0.5 },
      excited: { stability: 0.3, similarity_boost: 0.8, style: 0.7, use_speaker_boost: true },
      thoughtful: { stability: 0.7, similarity_boost: 0.7, style: 0.4 },
      questioning: { stability: 0.5, similarity_boost: 0.75, style: 0.6 },
      agreeing: { stability: 0.6, similarity_boost: 0.8, style: 0.5 },
      surprised: { stability: 0.2, similarity_boost: 0.85, style: 0.8, use_speaker_boost: true }
    };
    
    return emotionMap[emotion] || emotionMap.neutral;
  }

  async checkImageSafety(imageUrl: string): Promise<ModerationResult> {
    // Placeholder for image moderation
    console.log(`🖼️ Checking image safety for: ${imageUrl}`);
    
    return {
      flagged: false,
      toxicityScore: 0,
      labels: [],
      redactedText: imageUrl
    };
  }

  async checkVideoSafety(videoUrl: string): Promise<ModerationResult> {
    // Placeholder for video moderation
    console.log(`🎥 Checking video safety for: ${videoUrl}`);
    
    return {
      flagged: false,
      toxicityScore: 0,
      labels: [],
      redactedText: videoUrl
    };
  }
}

export const safetyService = new SafetyService();
