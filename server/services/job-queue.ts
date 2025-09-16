// Job Queue Service for async processing
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

interface Job {
  id: string;
  type: string;
  params: any;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private processing: boolean = false;
  private maxConcurrent: number = 3;
  private activeJobs: number = 0;

  constructor() {
    super();
    console.log('📋 Job queue service initialized');
    this.startProcessor();
  }

  private startProcessor() {
    setInterval(() => {
      this.processNextJob();
    }, 1000); // Check every second
  }

  submit(jobData: { type: string; params: any; userId: string }): Job {
    const job: Job = {
      id: randomUUID(),
      type: jobData.type,
      params: jobData.params,
      userId: jobData.userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(job.id, job);
    console.log(`📥 Job ${job.id} submitted: ${job.type}`);
    
    // Emit event for real-time updates
    this.emit(`job:${job.id}`, job);
    
    // Try to process immediately
    this.processNextJob();
    
    return job;
  }

  get(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  private async processNextJob() {
    if (this.activeJobs >= this.maxConcurrent) {
      return; // Already at max concurrent jobs
    }

    // Find next pending job
    const pendingJob = Array.from(this.jobs.values()).find(j => j.status === 'pending');
    if (!pendingJob) {
      return; // No pending jobs
    }

    this.activeJobs++;
    pendingJob.status = 'processing';
    pendingJob.updatedAt = new Date();
    this.emit(`job:${pendingJob.id}`, pendingJob);

    try {
      console.log(`⚙️ Processing job ${pendingJob.id}: ${pendingJob.type}`);
      
      // Process based on job type
      let result: any;
      
      switch (pendingJob.type) {
        case 'image':
          result = await this.processImageJob(pendingJob.params);
          break;
        case 'video':
          result = await this.processVideoJob(pendingJob.params);
          break;
        case 'audio':
          result = await this.processAudioJob(pendingJob.params);
          break;
        default:
          throw new Error(`Unknown job type: ${pendingJob.type}`);
      }

      // Mark as completed
      pendingJob.status = 'completed';
      pendingJob.result = result;
      pendingJob.updatedAt = new Date();
      
      console.log(`✅ Job ${pendingJob.id} completed`);
    } catch (error) {
      // Mark as failed
      pendingJob.status = 'failed';
      pendingJob.error = error instanceof Error ? error.message : 'Unknown error';
      pendingJob.updatedAt = new Date();
      
      console.error(`❌ Job ${pendingJob.id} failed:`, error);
    } finally {
      this.activeJobs--;
      this.emit(`job:${pendingJob.id}`, pendingJob);
      
      // Clean up old completed/failed jobs after 1 hour
      setTimeout(() => {
        if (pendingJob.status === 'completed' || pendingJob.status === 'failed') {
          this.jobs.delete(pendingJob.id);
        }
      }, 60 * 60 * 1000);
    }
  }

  private async processImageJob(params: any): Promise<any> {
    // Import and use HF media service
    const { hfMediaService } = await import('./hf-media');
    
    const result = await hfMediaService.generateImage({
      prompt: params.prompt,
      model: params.model,
      width: params.width,
      height: params.height,
      num_inference_steps: params.num_inference_steps,
      guidance_scale: params.guidance_scale
    });
    
    return {
      url: `/uploads/images/${result.filename}`,
      filename: result.filename,
      model: result.modelUsed
    };
  }

  private async processVideoJob(params: any): Promise<any> {
    // Import and use HF media service
    const { hfMediaService } = await import('./hf-media');
    
    const result = await hfMediaService.generateVideo({
      prompt: params.prompt,
      model: params.model,
      num_frames: params.num_frames,
      width: params.width,
      height: params.height
    });
    
    return {
      url: `/uploads/videos/${result.filename}`,
      filename: result.filename,
      model: result.modelUsed
    };
  }

  private async processAudioJob(params: any): Promise<any> {
    // Import and use HF media service
    const { hfMediaService } = await import('./hf-media');
    
    const result = await hfMediaService.generateAudio({
      prompt: params.prompt,
      model: params.model,
      duration: params.duration,
      format: params.format
    });
    
    return {
      url: `/uploads/audio/${result.filename}`,
      filename: result.filename,
      model: result.modelUsed,
      contentType: result.contentType
    };
  }

  // Subscribe to job updates
  onUpdate(jobId: string, callback: (job: Job) => void): () => void {
    const listener = (job: Job) => callback(job);
    this.on(`job:${jobId}`, listener);
    
    // Return unsubscribe function
    return () => {
      this.off(`job:${jobId}`, listener);
    };
  }

  // Get all jobs for a user
  getUserJobs(userId: string): Job[] {
    return Array.from(this.jobs.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get queue statistics
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent
    };
  }

  // Clear completed and failed jobs
  clearCompleted() {
    const cleared: string[] = [];
    
    for (const [id, job] of Array.from(this.jobs.entries())) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(id);
        cleared.push(id);
      }
    }
    
    console.log(`🧹 Cleared ${cleared.length} completed/failed jobs`);
    return cleared;
  }
}

export const jobQueue = new JobQueue();
