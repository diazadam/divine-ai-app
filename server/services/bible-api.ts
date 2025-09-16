export interface BibleVerse {
  id?: string;
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
  private readonly defaultBibleId: string;

  constructor() {
    this.apiKey = process.env.BIBLE_API_KEY || '';
    // Default to NIV if not provided
    this.defaultBibleId = process.env.BIBLE_DEFAULT_ID || 'de4e12af7f28f599-02';
  }

  // --- API.Bible helpers ---
  private get headers() {
    return { 'api-key': this.apiKey } as Record<string, string>;
  }

  async getBible(bibleId?: string): Promise<any> {
    const id = bibleId || this.defaultBibleId;
    const res = await fetch(`${this.baseUrl}/bibles/${id}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async listBibles(params?: { language?: string; abbreviation?: string; name?: string; ids?: string; includeFullDetails?: boolean; bibleId?: string }): Promise<any> {
    const url = new URL(`${this.baseUrl}/bibles`);
    if (params?.language) url.searchParams.set('language', params.language);
    if (params?.abbreviation) url.searchParams.set('abbreviation', params.abbreviation);
    if (params?.name) url.searchParams.set('name', params.name);
    if (params?.ids) url.searchParams.set('ids', params.ids);
    if (params?.includeFullDetails) url.searchParams.set('include-full-details', 'true');
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getBooks(bibleId?: string): Promise<any> {
    const id = bibleId || this.defaultBibleId;
    const res = await fetch(`${this.baseUrl}/bibles/${id}/books`, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getBook(bibleId: string, bookId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/bibles/${bibleId}/books/${bookId}`, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getChaptersForBook(bibleId: string, bookId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/bibles/${bibleId}/books/${bookId}/chapters`, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getChapter(bibleId: string, chapterId: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/bibles/${bibleId}/chapters/${chapterId}`);
    url.searchParams.set('content-type', 'html');
    url.searchParams.set('include-notes', 'false');
    url.searchParams.set('include-titles', 'true');
    url.searchParams.set('include-verse-numbers', 'true');
    url.searchParams.set('include-chapter-numbers', 'false');
    url.searchParams.set('include-verse-spans', 'true');
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getChapterVerses(bibleId: string, chapterId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/bibles/${bibleId}/chapters/${chapterId}/verses`, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getVerseById(bibleId: string, verseId: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/bibles/${bibleId}/verses/${verseId}`);
    url.searchParams.set('content-type', 'text');
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getPassage(bibleId: string, passageId: string): Promise<any> {
    const url = new URL(`${this.baseUrl}/bibles/${bibleId}/passages/${passageId}`);
    url.searchParams.set('content-type', 'html');
    url.searchParams.set('include-notes', 'false');
    url.searchParams.set('include-titles', 'true');
    url.searchParams.set('include-verse-numbers', 'true');
    url.searchParams.set('include-chapter-numbers', 'false');
    url.searchParams.set('include-verse-spans', 'true');
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`Bible API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async searchVerses(query: string, version = 'NIV', limit = 20, bibleId?: string): Promise<BibleSearchResult> {
    try {
      if (!this.apiKey) {
        console.warn('Bible API key not configured, using fallback');
        return this.searchVersesFallback(query, version, limit);
      }

      // Validate and sanitize query
      const sanitizedQuery = query.trim();
      if (!sanitizedQuery || sanitizedQuery.length < 2) {
        console.warn('Search query too short or empty');
        return { verses: [], total: 0 };
      }

      // Use the correct Bible ID
      const mappedBibleId = bibleId || this.defaultBibleId;
      
      // Construct the search URL properly
      const searchUrl = `${this.baseUrl}/bibles/${mappedBibleId}/search?query=${encodeURIComponent(sanitizedQuery)}&limit=${limit}&offset=0`;
      
      console.log('Bible API search URL:', searchUrl);
      const response = await fetch(searchUrl, { headers: this.headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bible API search error:', response.status, errorText);
        throw new Error(`Bible API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const verses: BibleVerse[] = (data.data?.verses || []).map((verse: any) => ({
        id: verse.id,
        reference: verse.reference,
        text: (verse.text || '').replace(/<[^>]*>/g, ''),
        version,
      }));

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
    // Prefer API.Bible via search to resolve reference → verse text
    try {
      const result = await this.searchVerses(reference, version, 1);
      const verse = result.verses[0];
      if (verse) return verse;
    } catch (e) {
      // fall through to free fallback
    }
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return { reference: data.reference, text: data.text, version };
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  async getVerseByReference(bibleId: string, ref: string, version = 'NIV'): Promise<BibleVerse | null> {
    const result = await this.searchVerses(ref, version, 1, bibleId);
    const verse = result.verses[0];
    return verse || null;
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
