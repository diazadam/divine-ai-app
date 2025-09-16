import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://usapxezphcqtapobwrcn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYXB4ZXpwaGNxdGFwb2J3cmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzNjA0OSwiZXhwIjoyMDcwMjEyMDQ5fQ.gthMtNYiCn-nUo4mTIVweah0t3lp8kVfyUjjdXXmOoQ';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
}

// Server-side client with service role key for full access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database table definitions for TypeScript
export interface SupabaseUser {
  id: string;
  username: string;
  password: string;
  email: string | null;
  created_at: string;
}

export interface SupabaseGeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  style: string | null;
  aspect_ratio: string | null;
  created_at: string;
}

export interface SupabaseGeneratedVideo {
  id: string;
  user_id: string;
  prompt: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  style: string | null;
  aspect_ratio: string | null;
  status: string;
  created_at: string;
}

export interface SupabaseGeneratedAudio {
  id: string;
  user_id: string;
  prompt: string;
  audio_url: string;
  model: string;
  format: string;
  duration: number | null;
  created_at: string;
}