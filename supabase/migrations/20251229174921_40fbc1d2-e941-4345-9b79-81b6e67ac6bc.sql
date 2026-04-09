-- Add foreign key from event_attendees to profiles
ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add custom PIX fields to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_pix_key TEXT,
ADD COLUMN IF NOT EXISTS event_pix_key_type TEXT DEFAULT 'CNPJ',
ADD COLUMN IF NOT EXISTS event_pix_beneficiary TEXT,
ADD COLUMN IF NOT EXISTS event_pix_qrcode_url TEXT;