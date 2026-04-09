-- Add payment and public registration fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'external';
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_external_url TEXT DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_instructions TEXT DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_public_registration BOOLEAN DEFAULT true;

-- Create event_registrations table for public registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_proof_url TEXT,
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, email)
);

-- Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Public can view events with public_slug
CREATE POLICY "Public events are viewable by slug"
ON events FOR SELECT
USING (public_slug IS NOT NULL AND is_active = true);

-- Anyone can register for public events
CREATE POLICY "Anyone can register for public events"
ON event_registrations FOR INSERT
WITH CHECK (true);

-- Public can view registrations count
CREATE POLICY "Public can view registrations"
ON event_registrations FOR SELECT
USING (true);

-- Admins can manage all registrations
CREATE POLICY "Admins can manage registrations"
ON event_registrations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));