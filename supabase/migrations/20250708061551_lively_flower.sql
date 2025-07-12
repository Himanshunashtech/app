/*
  # Dating App Database Schema

  1. New Tables
    - `profiles` - User profiles with detailed information
    - `likes` - User likes and super likes  
    - `matches` - Matched users who can chat
    - `messages` - Real-time messages between matches

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Secure message and match access

  3. Storage
    - Create bucket for profile photos
    - Set up policies for image uploads
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  age integer NOT NULL CHECK (age >= 18 AND age <= 100),
  bio text DEFAULT '',
  city text NOT NULL,
  interests text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  looking_for text NOT NULL DEFAULT 'relationship',
  education text DEFAULT '',
  job_title text DEFAULT '',
  height integer CHECK (height > 0),
  smoking text DEFAULT 'never',
  drinking text DEFAULT 'never',
  religion text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_super_like boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Likes policies
CREATE POLICY "Users can read all likes" ON likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE TO authenticated USING (auth.uid() = liker_id);

-- Matches policies
CREATE POLICY "Users can read own matches" ON matches
  FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches" ON matches
  FOR INSERT TO authenticated WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can read messages from their matches" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their matches" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Storage policies
CREATE POLICY "Users can upload profile photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile photos are publicly accessible" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update own profile photos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to create matches when mutual likes occur
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual like
  IF EXISTS (
    SELECT 1 FROM likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) THEN
    -- Create a match (ensure consistent ordering)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic match creation
CREATE OR REPLACE TRIGGER create_match_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_liker_id ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_id ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);