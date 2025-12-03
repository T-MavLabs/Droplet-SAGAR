-- Supabase Storage Bucket Policies for raw-uploads
-- Run this in your Supabase SQL Editor to allow file uploads
-- IMPORTANT: This fixes the "row-level security policy" error

-- Step 1: Ensure the raw-uploads bucket exists
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: raw-uploads
-- Public: No (Private)
-- Or run this SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('raw-uploads', 'raw-uploads', false) ON CONFLICT DO NOTHING;

-- Step 2: Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Allow authenticated uploads to raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to raw-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from raw-uploads" ON storage.objects;

-- IMPORTANT: Since the app uses anon key (not authenticated users), we need public policies
-- If you want more security, use authenticated policies and implement user authentication

-- Policy to allow public/anonymous uploads to raw-uploads bucket
CREATE POLICY "Allow public uploads to raw-uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'raw-uploads' AND
  (storage.foldername(name))[1] = 'data-entry'
);

-- Policy to allow public/anonymous reads from raw-uploads
CREATE POLICY "Allow public reads from raw-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'raw-uploads');

-- Policy to allow public/anonymous updates to raw-uploads
CREATE POLICY "Allow public updates to raw-uploads"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'raw-uploads')
WITH CHECK (
  bucket_id = 'raw-uploads' AND
  (storage.foldername(name))[1] = 'data-entry'
);

-- Policy to allow public/anonymous deletes from raw-uploads
CREATE POLICY "Allow public deletes from raw-uploads"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'raw-uploads');

-- Alternative: If you want authenticated-only access (more secure)
-- Uncomment the following policies and comment out the public ones above
-- Then implement user authentication in your app

-- CREATE POLICY "Allow authenticated uploads to raw-uploads"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'raw-uploads' AND
--   (storage.foldername(name))[1] = 'data-entry'
-- );

-- CREATE POLICY "Allow authenticated reads from raw-uploads"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'raw-uploads');

-- CREATE POLICY "Allow authenticated updates to raw-uploads"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'raw-uploads')
-- WITH CHECK (
--   bucket_id = 'raw-uploads' AND
--   (storage.foldername(name))[1] = 'data-entry'
-- );

-- CREATE POLICY "Allow authenticated deletes from raw-uploads"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'raw-uploads');

