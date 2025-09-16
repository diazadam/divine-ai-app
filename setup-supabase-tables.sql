-- Divine AI Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Images table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  style VARCHAR(100),
  aspect_ratio VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Videos table
CREATE TABLE IF NOT EXISTS generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  style VARCHAR(100),
  aspect_ratio VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Audio table
CREATE TABLE IF NOT EXISTS generated_audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  model VARCHAR(100),
  format VARCHAR(20),
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sermons table
CREATE TABLE IF NOT EXISTS sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  scripture_references TEXT[],
  tags VARCHAR(100)[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Podcasts table  
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripture Collections table
CREATE TABLE IF NOT EXISTS scripture_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  verses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  audio_url TEXT NOT NULL,
  transcription TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_videos_user_id ON generated_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_audios_user_id ON generated_audios(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripture_collections_user_id ON scripture_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON voice_recordings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripture_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR ALL USING (id = auth.uid());
CREATE POLICY "Images belong to user" ON generated_images FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Videos belong to user" ON generated_videos FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Audio belongs to user" ON generated_audios FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Sermons belong to user" ON sermons FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Podcasts belong to user" ON podcasts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Collections belong to user" ON scripture_collections FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Recordings belong to user" ON voice_recordings FOR ALL USING (user_id = auth.uid());