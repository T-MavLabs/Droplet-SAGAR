-- Row Level Security (RLS) Policies for droplet_notes table
-- Run this in your Supabase SQL Editor to allow public access to droplet_notes table
-- Note: Table name is lowercase (droplet_notes) as PostgreSQL converts unquoted identifiers to lowercase

-- Enable RLS on droplet_notes table
ALTER TABLE droplet_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Allow public select on droplet_notes" ON droplet_notes;
DROP POLICY IF EXISTS "Allow public insert on droplet_notes" ON droplet_notes;
DROP POLICY IF EXISTS "Allow public update on droplet_notes" ON droplet_notes;
DROP POLICY IF EXISTS "Allow public delete on droplet_notes" ON droplet_notes;

-- Policy to allow public/anonymous SELECT (read) access
CREATE POLICY "Allow public select on droplet_notes"
ON droplet_notes FOR SELECT
TO public
USING (true);

-- Policy to allow public/anonymous INSERT (create) access
CREATE POLICY "Allow public insert on droplet_notes"
ON droplet_notes FOR INSERT
TO public
WITH CHECK (true);

-- Policy to allow public/anonymous UPDATE access
CREATE POLICY "Allow public update on droplet_notes"
ON droplet_notes FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy to allow public/anonymous DELETE access (optional - remove if you don't want deletes)
CREATE POLICY "Allow public delete on droplet_notes"
ON droplet_notes FOR DELETE
TO public
USING (true);

-- Alternative: If you want authenticated-only access (more secure)
-- Uncomment the following policies and comment out the public ones above
-- Then implement user authentication in your app

-- CREATE POLICY "Allow authenticated select on droplet_notes"
-- ON droplet_notes FOR SELECT
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Allow authenticated insert on droplet_notes"
-- ON droplet_notes FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Allow authenticated update on droplet_notes"
-- ON droplet_notes FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Allow authenticated delete on droplet_notes"
-- ON droplet_notes FOR DELETE
-- TO authenticated
-- USING (true);

