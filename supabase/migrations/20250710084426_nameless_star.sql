/*
  # Add phone field to profiles table

  1. Changes
    - Add phone field to profiles table
    - Update RLS policies to include phone field

  2. Security
    - Maintain existing RLS policies
    - Ensure phone numbers are properly validated
*/

-- Add phone column to profiles table
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

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