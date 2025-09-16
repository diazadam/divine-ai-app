// Social Media Service
import { randomUUID } from 'crypto';

interface SocialAccount {
  id: string;
  userId: string;
  provider: string;
  accountHandle: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  metadata: any;
  createdAt: Date;
}

interface ScheduledPost {
  id: string;
  userId: string;
  platform: string;
  content: string;
  imageUrl?: string;
  scheduledAt: Date;
  status: 'scheduled' | 'posted' | 'failed';
  error?: string | null;
  postedAt?: Date | null;
}

class SocialService {
  private accounts: Map<string, SocialAccount[]> = new Map();
  private scheduledPosts: Map<string, ScheduledPost[]> = new Map();

  constructor() {
    console.log('📱 Social media service initialized');
  }

  async listAccounts(userId: string): Promise<SocialAccount[]> {
    // In production, this would query the database
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { socialAccounts } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        const accounts = await db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
        return accounts as SocialAccount[];
      } catch (error) {
        console.error('DB error listing accounts:', error);
      }
    }
    
    // Fallback to in-memory storage
    return this.accounts.get(userId) || [];
  }

  async connectAccount(userId: string, platform: string): Promise<SocialAccount> {
    // Mock OAuth flow - in production this would do real OAuth
    const account: SocialAccount = {
      id: randomUUID(),
      userId,
      provider: platform.toLowerCase(),
      accountHandle: `@${platform.toLowerCase()}_user`,
      accessToken: `mock_${platform}_token_${Date.now()}`,
      refreshToken: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: { connected_via: 'mock_oauth' },
      createdAt: new Date()
    };

    // Store in memory
    const userAccounts = this.accounts.get(userId) || [];
    userAccounts.push(account);
    this.accounts.set(userId, userAccounts);

    // Store in database if available
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { socialAccounts } = await import('@shared/schema');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        await db.insert(socialAccounts).values(account as any);
      } catch (error) {
        console.error('DB error connecting account:', error);
      }
    }

    return account;
  }

  async addAccount(userId: string, accountData: Partial<SocialAccount>): Promise<SocialAccount> {
    const account: SocialAccount = {
      id: randomUUID(),
      userId,
      provider: accountData.provider || 'unknown',
      accountHandle: accountData.accountHandle || null,
      accessToken: accountData.accessToken || null,
      refreshToken: accountData.refreshToken || null,
      expiresAt: accountData.expiresAt || null,
      metadata: accountData.metadata || {},
      createdAt: new Date()
    };

    // Store in memory
    const userAccounts = this.accounts.get(userId) || [];
    userAccounts.push(account);
    this.accounts.set(userId, userAccounts);

    // Store in database if available
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { socialAccounts } = await import('@shared/schema');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        await db.insert(socialAccounts).values(account as any);
      } catch (error) {
        console.error('DB error adding account:', error);
      }
    }

    return account;
  }

  async removeAccount(userId: string, accountId: string): Promise<boolean> {
    // Remove from memory
    const userAccounts = this.accounts.get(userId) || [];
    const filtered = userAccounts.filter(a => a.id !== accountId);
    this.accounts.set(userId, filtered);

    // Remove from database if available
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { socialAccounts } = await import('@shared/schema');
        const { and, eq } = await import('drizzle-orm');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        await db.delete(socialAccounts).where(
          and(
            eq(socialAccounts.id, accountId),
            eq(socialAccounts.userId, userId)
          )
        );
      } catch (error) {
        console.error('DB error removing account:', error);
      }
    }

    return true;
  }

  async schedulePost(userId: string, postData: {
    content: string;
    platforms: string[];
    scheduleTime: string;
    type?: string;
    imageUrl?: string;
  }): Promise<ScheduledPost[]> {
    const scheduledPosts: ScheduledPost[] = [];
    
    for (const platform of postData.platforms) {
      const post: ScheduledPost = {
        id: randomUUID(),
        userId,
        platform,
        content: postData.content,
        imageUrl: postData.imageUrl,
        scheduledAt: new Date(postData.scheduleTime),
        status: 'scheduled'
      };

      // Store in memory
      const userPosts = this.scheduledPosts.get(userId) || [];
      userPosts.push(post);
      this.scheduledPosts.set(userId, userPosts);

      // Store in database if available
      if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
        try {
          const { drizzle } = await import('drizzle-orm/neon-http');
          const { neon } = await import('@neondatabase/serverless');
          const { scheduledPosts: scheduledPostsTable } = await import('@shared/schema');
          
          const db = drizzle(neon(process.env.DATABASE_URL!));
          await db.insert(scheduledPostsTable).values({
            ...post,
            type: postData.type || 'text'
          } as any);
        } catch (error) {
          console.error('DB error scheduling post:', error);
        }
      }

      scheduledPosts.push(post);
    }

    return scheduledPosts;
  }

  generateShareLinks(data: {
    provider?: string;
    url?: string;
    title?: string;
    caption?: string;
    imageUrl?: string;
    hashtags?: string[];
  }): Record<string, string> {
    const links: Record<string, string> = {};
    const text = data.caption || data.title || '';
    const url = data.url || '';
    const hashtags = data.hashtags?.join(',') || '';

    // Generate share links for various platforms
    if (!data.provider || data.provider === 'twitter') {
      links.twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
    }
    
    if (!data.provider || data.provider === 'facebook') {
      links.facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    }
    
    if (!data.provider || data.provider === 'linkedin') {
      links.linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(data.title || '')}&summary=${encodeURIComponent(text)}`;
    }
    
    if (!data.provider || data.provider === 'pinterest') {
      links.pinterest = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(data.imageUrl || '')}&description=${encodeURIComponent(text)}`;
    }
    
    if (!data.provider || data.provider === 'reddit') {
      links.reddit = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(data.title || text)}`;
    }
    
    if (!data.provider || data.provider === 'whatsapp') {
      links.whatsapp = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    }
    
    if (!data.provider || data.provider === 'telegram') {
      links.telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    }
    
    if (!data.provider || data.provider === 'email') {
      links.email = `mailto:?subject=${encodeURIComponent(data.title || 'Check this out')}&body=${encodeURIComponent(text + '\\n\\n' + url)}`;
    }

    return links;
  }

  async recordShare(userId: string, shareData: any): Promise<any> {
    const share = {
      id: randomUUID(),
      userId,
      ...shareData,
      createdAt: new Date()
    };

    // Store in database if available
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { socialShares } = await import('@shared/schema');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        await db.insert(socialShares).values(share as any);
      } catch (error) {
        console.error('DB error recording share:', error);
      }
    }

    return share;
  }

  async postNow(userId: string, platform: string, content: string, options?: {
    imageUrl?: string;
    url?: string;
    title?: string;
  }): Promise<{ ok: boolean; message?: string; error?: string }> {
    try {
      // Check if user has connected account for this platform
      const accounts = await this.listAccounts(userId);
      const account = accounts.find(a => a.provider === platform.toLowerCase());
      
      if (!account) {
        return { ok: false, error: `No ${platform} account connected` };
      }

      // Special handling for Discord webhooks
      if (platform.toLowerCase() === 'discord' && process.env.DISCORD_WEBHOOK_URL) {
        const webhookData: any = {
          content: content,
          embeds: []
        };

        if (options?.title || options?.url || options?.imageUrl) {
          webhookData.embeds.push({
            title: options.title,
            url: options.url,
            description: content,
            image: options.imageUrl ? { url: options.imageUrl } : undefined,
            color: 0x5865F2 // Discord blurple
          });
        }

        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          return { ok: true, message: 'Posted to Discord successfully' };
        } else {
          return { ok: false, error: `Discord API error: ${response.status}` };
        }
      }

      // For other platforms, we'd implement their specific APIs here
      // For now, return mock success
      console.log(`🚀 Posting to ${platform}: "${content.substring(0, 50)}..."`);
      
      return { 
        ok: true, 
        message: `Successfully posted to ${platform} (mock)` 
      };
      
    } catch (error) {
      console.error(`Error posting to ${platform}:`, error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Map emotion to TTS parameters for voice generation
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
}

export const socialService = new SocialService();