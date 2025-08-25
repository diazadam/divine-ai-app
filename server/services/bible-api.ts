export interface BibleVerse {
  reference: string;
  text: string;
  version: string;
}

export interface BibleSearchResult {
  verses: BibleVerse[];
  total: number;
}

export interface CrossReference {
  reference: string;
  text: string;
  relevance: number;
}

class BibleApiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.scripture.api.bible/v1';

  constructor() {
    this.apiKey = process.env.BIBLE_API_KEY || '';
  }

  async searchVerses(query: string, version = 'NIV', limit = 20): Promise<BibleSearchResult> {
    try {
      // Using API.Bible for comprehensive search
      const response = await fetch(`${this.baseUrl}/bibles/de4e12af7f28f599-02/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: {
          'api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Bible API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const verses: BibleVerse[] = data.data?.verses?.map((verse: any) => ({
        reference: verse.reference,
        text: verse.text.replace(/<[^>]*>/g, ''), // Remove HTML tags
        version: version,
      })) || [];

      return {
        verses,
        total: data.data?.total || 0,
      };
    } catch (error) {
      console.error('Error searching verses:', error);
      // Fallback to free Bible API
      return this.searchVersesFallback(query, version, limit);
    }
  }

  private async searchVersesFallback(query: string, version: string, limit: number): Promise<BibleSearchResult> {
    try {
      // Fallback to free Bible API
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Fallback Bible API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const verses: BibleVerse[] = data.verses?.slice(0, limit).map((verse: any) => ({
        reference: `${data.reference} ${verse.verse}`,
        text: verse.text,
        version: version,
      })) || [];

      return {
        verses,
        total: verses.length,
      };
    } catch (error) {
      console.error('Error with fallback Bible API:', error);
      return { verses: [], total: 0 };
    }
  }

  async getVerse(reference: string, version = 'NIV'): Promise<BibleVerse | null> {
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return {
        reference: data.reference,
        text: data.text,
        version: version,
      };
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  async getCrossReferences(reference: string): Promise<CrossReference[]> {
    try {
      // For cross-references, we'll use a predefined mapping or AI generation
      // This would typically require a more sophisticated Bible study API
      const commonCrossRefs: Record<string, string[]> = {
        'psalm 42:11': ['Romans 15:13', 'Jeremiah 29:11', 'Lamentations 3:22-23'],
        'romans 15:13': ['Psalm 42:11', '1 Peter 1:3', 'Isaiah 40:31'],
        'jeremiah 29:11': ['Romans 8:28', 'Psalm 42:11', 'Proverbs 3:5-6'],
      };

      const key = reference.toLowerCase().replace(/\s+/g, ' ');
      const refs = commonCrossRefs[key] || [];
      
      const crossRefs: CrossReference[] = [];
      
      for (const ref of refs) {
        const verse = await this.getVerse(ref);
        if (verse) {
          crossRefs.push({
            reference: ref,
            text: verse.text.substring(0, 100) + '...',
            relevance: 0.8,
          });
        }
      }

      return crossRefs;
    } catch (error) {
      console.error('Error fetching cross references:', error);
      return [];
    }
  }

  async getTopicalVerses(topic: string): Promise<BibleVerse[]> {
    const topicMapping: Record<string, string[]> = {
      'hope': ['Psalm 42:11', 'Romans 15:13', 'Jeremiah 29:11', '1 Peter 1:3'],
      'faith': ['Hebrews 11:1', 'Romans 10:17', '2 Corinthians 5:7', 'Ephesians 2:8'],
      'love': ['1 Corinthians 13:4-7', 'John 3:16', '1 John 4:8', 'Romans 8:38-39'],
      'peace': ['John 14:27', 'Philippians 4:7', 'Isaiah 26:3', 'Romans 5:1'],
      'strength': ['Philippians 4:13', 'Isaiah 40:31', '2 Corinthians 12:9', 'Psalm 28:7'],
    };

    const references = topicMapping[topic.toLowerCase()] || [];
    const verses: BibleVerse[] = [];

    for (const ref of references) {
      const verse = await this.getVerse(ref);
      if (verse) {
        verses.push(verse);
      }
    }

    return verses;
  }
}

export const bibleApiService = new BibleApiService();
