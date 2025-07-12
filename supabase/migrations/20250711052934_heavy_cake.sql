/*
  # Add messaging and notification features

  1. New Tables
    - `user_status` - Track online/offline and typing status
    - `notifications` - Store user notifications
  
  2. Updates
    - Add `message_type` and `read_at` to messages table
    
  3. Security
    - Enable RLS on new tables
    - Add policies for user access
*/

-- Add message_type and read_at to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'like'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN read_at timestamptz;
  END IF;
END $$;

-- Create user_status table
CREATE TABLE IF NOT EXISTS user_status (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  is_typing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'super_like', 'match', 'message')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_status_user_id ON user_status(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- RLS Policies for user_status
CREATE POLICY "Users can read all user status"
  ON user_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own status"
  ON user_status
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to create like notification
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liker_name text;
  notification_title text;
  notification_message text;
BEGIN
  -- Get liker's name
  SELECT first_name INTO liker_name
  FROM profiles
  WHERE id = NEW.liker_id;

  -- Create notification text
  IF NEW.is_super_like THEN
    notification_title := 'Super Like!';
    notification_message := liker_name || ' super liked you!';
  ELSE
    notification_title := 'New Like!';
    notification_message := liker_name || ' liked you!';
  END IF;

  -- Create notification
  PERFORM create_notification(
    NEW.liked_id,
    CASE WHEN NEW.is_super_like THEN 'super_like' ELSE 'like' END,
    notification_title,
    notification_message,
    jsonb_build_object('user_id', NEW.liker_id, 'like_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

-- Function to create match notification
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user1_name text;
  user2_name text;
BEGIN
  -- Get both users' names
  SELECT first_name INTO user1_name FROM profiles WHERE id = NEW.user1_id;
  SELECT first_name INTO user2_name FROM profiles WHERE id = NEW.user2_id;

  -- Create notification for user1
  PERFORM create_notification(
    NEW.user1_id,
    'match',
    'It''s a Match! 🎉',
    'You and ' || user2_name || ' liked each other!',
    jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user2_id)
  );

  -- Create notification for user2
  PERFORM create_notification(
    NEW.user2_id,
    'match',
    'It''s a Match! 🎉',
    'You and ' || user1_name || ' liked each other!',
    jsonb_build_object('match_id', NEW.id, 'other_user_id', NEW.user1_id)
  );

  RETURN NEW;
END;
$$;

-- Function to create message notification
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name text;
  receiver_id uuid;
  match_record record;
BEGIN
  -- Get match details
  SELECT user1_id, user2_id INTO match_record
  FROM matches
  WHERE id = NEW.match_id;

  -- Determine receiver
  IF match_record.user1_id = NEW.sender_id THEN
    receiver_id := match_record.user2_id;
  ELSE
    receiver_id := match_record.user1_id;
  END IF;

  -- Get sender's name
  SELECT first_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Create notification for receiver
  PERFORM create_notification(
    receiver_id,
    'message',
    'New Message',
    sender_name || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    jsonb_build_object('match_id', NEW.match_id, 'sender_id', NEW.sender_id, 'message_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS like_notification_trigger ON likes;
CREATE TRIGGER like_notification_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

DROP TRIGGER IF EXISTS match_notification_trigger ON matches;
CREATE TRIGGER match_notification_trigger
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION create_match_notification();

DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();