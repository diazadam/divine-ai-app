// Social Media Scheduler Service
import { CronJob } from 'cron';

class SchedulerService {
  private jobs: Map<string, CronJob> = new Map();

  constructor() {
    console.log('📅 Scheduler service initialized');
  }

  start() {
    console.log('✅ Scheduler service started');
    // Check for scheduled posts every minute
    const job = new CronJob('* * * * *', async () => {
      try {
        await this.processScheduledPosts();
      } catch (error) {
        console.error('Error processing scheduled posts:', error);
      }
    }, null, true);
    
    this.jobs.set('scheduled-posts', job);
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    console.log('🛑 Scheduler service stopped');
  }

  private async processScheduledPosts() {
    // Check database for posts that need to be published
    if (process.env.USE_DB === 'true' && process.env.DATABASE_URL) {
      try {
        const { drizzle } = await import('drizzle-orm/neon-http');
        const { neon } = await import('@neondatabase/serverless');
        const { scheduledPosts } = await import('@shared/schema');
        const { eq, lte, and } = await import('drizzle-orm');
        
        const db = drizzle(neon(process.env.DATABASE_URL!));
        
        // Find posts scheduled for now or earlier that haven't been posted
        const now = new Date();
        const postsToPublish = await db
          .select()
          .from(scheduledPosts)
          .where(
            and(
              eq(scheduledPosts.status, 'scheduled'),
              lte(scheduledPosts.scheduledTime, now)
            )
          )
          .limit(10);
        
        for (const post of postsToPublish) {
          try {
            // Here we would actually post to the social media platform
            console.log(`📤 Publishing scheduled post ${post.id} to ${post.platform}`);
            
            // Update status to posted
            await db
              .update(scheduledPosts)
              .set({ status: 'posted', postedAt: now })
              .where(eq(scheduledPosts.id, post.id));
              
          } catch (error) {
            console.error(`Failed to publish post ${post.id}:`, error);
            // Update status to failed
            await db
              .update(scheduledPosts)
              .set({ 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              })
              .where(eq(scheduledPosts.id, post.id));
          }
        }
      } catch (error) {
        console.error('Database error in scheduler:', error);
      }
    }
  }

  // Schedule a one-time job
  scheduleOnce(id: string, date: Date, callback: () => void) {
    const job = new CronJob(date, callback, null, true);
    this.jobs.set(id, job);
    return id;
  }

  // Cancel a scheduled job
  cancel(id: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
      return true;
    }
    return false;
  }
}

export const schedulerService = new SchedulerService();
