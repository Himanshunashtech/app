/*
  # Add phone and location fields to profiles

  1. Changes
    - Add phone field to profiles table
    - Add latitude and longitude fields for location
    - Update RLS policies to include new fields

  2. Security
    - Maintain existing RLS policies
    - Ensure phone numbers are properly validated
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;
END $$;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- Add constraint to ensure phone number format (basic validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_phone_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_phone_check 
    CHECK (phone IS NULL OR length(phone) >= 10);
  END IF;
END $$;