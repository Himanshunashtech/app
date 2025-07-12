/*
  # Remove phone column from profiles table

  1. Changes
    - Remove phone column from profiles table
    - Remove phone-related constraints

  2. Notes
    - This migration removes the phone verification requirement
    - Email verification will be used instead
*/

-- Remove phone column constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_phone_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_phone_check;
  END IF;
END $$;

-- Remove phone column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles DROP COLUMN phone;
  END IF;
END $$;