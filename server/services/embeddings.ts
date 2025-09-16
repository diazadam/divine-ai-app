// Embeddings Service for RAG (Retrieval Augmented Generation)
import { randomUUID } from 'crypto';

interface EmbeddingDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

class EmbeddingService {
  private documents: Map<string, EmbeddingDocument> = new Map();
  
  constructor() {
    console.log('🧠 Embeddings service initialized for RAG');
    this.seedWithBibleContent();
  }

  private seedWithBibleContent() {
    // Seed with some biblical content for better RAG results
    const seedContent = [
      { content: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. - John 3:16", metadata: { book: 'John', chapter: 3, verse: 16 } },
      { content: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. - Psalm 23:1-2", metadata: { book: 'Psalms', chapter: 23, verse: '1-2' } },
      { content: "Trust in the Lord with all your heart and lean not on your own understanding. - Proverbs 3:5", metadata: { book: 'Proverbs', chapter: 3, verse: 5 } },
      { content: "I can do all things through Christ who strengthens me. - Philippians 4:13", metadata: { book: 'Philippians', chapter: 4, verse: 13 } },
      { content: "And we know that in all things God works for the good of those who love him. - Romans 8:28", metadata: { book: 'Romans', chapter: 8, verse: 28 } }
    ];

    for (const doc of seedContent) {
      this.store(doc.content, doc.metadata);
    }
  }

  // Generate mock embedding (in production, use real embedding model)
  private generateEmbedding(text: string): number[] {
    // Simple mock embedding based on text features
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    // Create a simple hash-based embedding
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const idx = (word.charCodeAt(j) * (i + 1)) % embedding.length;
        embedding[idx] += 0.1;
      }
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  // Calculate cosine similarity between two embeddings
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  // Store a document with its embedding
  async store(content: string, metadata?: Record<string, any>): Promise<EmbeddingDocument> {
    const doc: EmbeddingDocument = {
      id: randomUUID(),
      content,
      embedding: this.generateEmbedding(content),
      metadata,
      createdAt: new Date()
    };
    
    this.documents.set(doc.id, doc);
    console.log(`📝 Stored document ${doc.id} with embedding`);
    
    // In production, store in pgvector or similar vector database
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      // Would store in pgvector here
      console.log('Would store in pgvector database');
    }
    
    return doc;
  }

  // Search for similar documents
  async search(query: string, limit: number = 5): Promise<Array<{ content: string; score: number; metadata?: any }>> {
    const queryEmbedding = this.generateEmbedding(query);
    const results: Array<{ content: string; score: number; metadata?: any }> = [];
    
    // Calculate similarity with all documents
    for (const doc of Array.from(this.documents.values())) {
      if (doc.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        results.push({
          content: doc.content,
          score: similarity,
          metadata: doc.metadata
        });
      }
    }
    
    // Sort by similarity and return top results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  // Generate contextual embedding for improved search
  async generateContextualEmbedding(text: string, context?: string): Promise<number[]> {
    const fullText = context ? `${context} ${text}` : text;
    return this.generateEmbedding(fullText);
  }

  // Batch process multiple documents
  async batchStore(documents: Array<{ content: string; metadata?: any }>): Promise<EmbeddingDocument[]> {
    const stored: EmbeddingDocument[] = [];
    
    for (const doc of documents) {
      const result = await this.store(doc.content, doc.metadata);
      stored.push(result);
    }
    
    return stored;
  }

  // Clear all stored embeddings
  clear() {
    this.documents.clear();
    console.log('🧹 Cleared all embeddings');
  }

  // Get statistics
  getStats() {
    return {
      documentCount: this.documents.size,
      embeddingDimension: 384,
      storageType: process.env.USE_DB === 'true' ? 'pgvector' : 'in-memory'
    };
  }
}

export const embeddingService = new EmbeddingService();
