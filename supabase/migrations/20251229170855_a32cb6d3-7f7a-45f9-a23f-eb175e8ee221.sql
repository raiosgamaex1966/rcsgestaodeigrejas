-- Create event_categories table
CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Calendar',
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on event_categories
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_categories
CREATE POLICY "Event categories are viewable by everyone" 
ON public.event_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage event categories" 
ON public.event_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add new fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.event_categories(id),
ADD COLUMN IF NOT EXISTS registration_limit INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS organizer_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT NULL;

-- Add new fields to event_attendees table
ALTER TABLE public.event_attendees 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT now();

-- Insert default event categories
INSERT INTO public.event_categories (name, icon, color, order_index) VALUES
('Culto', 'Church', '#6366f1', 1),
('Célula', 'Users', '#22c55e', 2),
('Conferência', 'Mic', '#a855f7', 3),
('Retiro', 'Mountain', '#f97316', 4),
('Louvor', 'Music', '#ec4899', 5),
('Estudo Bíblico', 'BookOpen', '#3b82f6', 6),
('Jovens', 'Flame', '#ef4444', 7),
('Especial', 'Star', '#eab308', 8);