

-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  water_body text,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Updated-at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_projects_set_updated_at ON public.projects;

-- Create trigger
CREATE TRIGGER trg_projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_projects_date ON public.projects(date);
CREATE INDEX IF NOT EXISTS idx_projects_water_body ON public.projects(water_body);

-- 4) Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies (adjust to your auth model; these allow anon reads/inserts)

-- Read policy
DROP POLICY IF EXISTS "Allow read to anon" ON public.projects;
CREATE POLICY "Allow read to anon"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert policy
DROP POLICY IF EXISTS "Allow insert to anon" ON public.projects;
CREATE POLICY "Allow insert to anon"
  ON public.projects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Update policy (restricted to authenticated only)
DROP POLICY IF EXISTS "Allow update to authenticated" ON public.projects;
CREATE POLICY "Allow update to authenticated"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Delete policy (restricted to authenticated only)
DROP POLICY IF EXISTS "Allow delete to authenticated" ON public.projects;
CREATE POLICY "Allow delete to authenticated"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (true);

-- 5) Sample insert (optional - uncomment to use)
-- INSERT INTO public.projects (title, description, water_body, progress, date)
-- VALUES ('Andaman Deep Sea Survey', 'Comprehensive survey of deep-sea biodiversity in the Andaman Sea region', 'Andaman Sea', 0, current_date);

