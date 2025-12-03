-- Create droplet_notes table for storing notes from Droplet hardware device
-- Run this query in your Supabase SQL Editor
-- Note: Table name is lowercase (droplet_notes) as PostgreSQL converts unquoted identifiers to lowercase

-- Drop table if exists (use only if you want to recreate)
-- DROP TABLE IF EXISTS droplet_notes CASCADE;

CREATE TABLE IF NOT EXISTS droplet_notes (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    notes TEXT,
    device_name TEXT DEFAULT 'Droplet',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT droplet_notes_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0)
);

-- Create a unique constraint on filename to ensure one note record per file
-- This prevents duplicate notes for the same filename
CREATE UNIQUE INDEX IF NOT EXISTS idx_droplet_notes_filename_unique 
ON droplet_notes(filename);

-- Create an index on filename for faster lookups (if unique constraint is not used)
-- CREATE INDEX IF NOT EXISTS idx_droplet_notes_filename 
-- ON Droplet_Notes(filename);

-- Create an index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_droplet_notes_updated_at 
ON droplet_notes(updated_at DESC);

-- Create an index on device_name for filtering by device
CREATE INDEX IF NOT EXISTS idx_droplet_notes_device_name 
ON droplet_notes(device_name);

-- Optional: Enable Row Level Security (RLS) if needed
-- ALTER TABLE droplet_notes ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy to allow all operations (adjust as needed for your security requirements)
-- CREATE POLICY "Allow all operations on droplet_notes" 
-- ON droplet_notes FOR ALL 
-- USING (true) 
-- WITH CHECK (true);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_droplet_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for clean recreation)
DROP TRIGGER IF EXISTS trigger_update_droplet_notes_updated_at ON Droplet_Notes;

CREATE TRIGGER trigger_update_droplet_notes_updated_at
    BEFORE UPDATE ON droplet_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_droplet_notes_updated_at();

-- Add table comment
COMMENT ON TABLE droplet_notes IS 'Stores notes from Droplet hardware device for data entry files. Notes are linked to files by filename. One note record per filename.';

-- Add column comments
COMMENT ON COLUMN droplet_notes.id IS 'Primary key, auto-incrementing';
COMMENT ON COLUMN droplet_notes.filename IS 'Filename of the data entry file (unique, one note per file)';
COMMENT ON COLUMN droplet_notes.notes IS 'Notes content for the file';
COMMENT ON COLUMN droplet_notes.device_name IS 'Name of the hardware device (default: Droplet)';
COMMENT ON COLUMN droplet_notes.created_at IS 'Timestamp when the note record was created';
COMMENT ON COLUMN droplet_notes.updated_at IS 'Timestamp when the note was last updated (auto-updated by trigger)';
