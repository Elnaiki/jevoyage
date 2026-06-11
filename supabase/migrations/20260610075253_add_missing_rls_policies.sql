-- Delete policies for admin operations
CREATE POLICY "delete_agencies" ON agencies FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "delete_trips" ON trips FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "delete_trip_ratings" ON trip_ratings FOR DELETE
  TO authenticated USING (true);

-- Allow authenticated users to read all profiles (needed for admin & comment display)
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Add is_admin column to profiles for admin access control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add unique constraint: one rating per user per trip
ALTER TABLE trip_ratings DROP CONSTRAINT IF EXISTS trip_ratings_user_trip_unique;
ALTER TABLE trip_ratings ADD CONSTRAINT trip_ratings_user_trip_unique UNIQUE (user_id, trip_id);

-- Add unique constraint: one like per user per trip
ALTER TABLE trip_likes DROP CONSTRAINT IF EXISTS trip_likes_user_trip_unique;
ALTER TABLE trip_likes ADD CONSTRAINT trip_likes_user_trip_unique UNIQUE (user_id, trip_id);
