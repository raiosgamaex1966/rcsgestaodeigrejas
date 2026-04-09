-- Tabela de Álbuns de Fotos
CREATE TABLE public.photo_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_url text,
  event_date date,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  photos_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Fotos
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.photo_albums(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  thumbnail_url text,
  description text,
  face_descriptors jsonb,
  faces_count integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índices para busca
CREATE INDEX idx_photos_album ON public.photos(album_id);
CREATE INDEX idx_photos_faces ON public.photos(faces_count) WHERE faces_count > 0;
CREATE INDEX idx_albums_date ON public.photo_albums(event_date DESC);
CREATE INDEX idx_albums_published ON public.photo_albums(is_published);

-- Trigger para updated_at
CREATE TRIGGER update_photo_albums_updated_at
BEFORE UPDATE ON public.photo_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Todos podem ver álbuns publicados
CREATE POLICY "Anyone can view published albums"
ON public.photo_albums FOR SELECT
USING (is_published = true);

-- Admins podem ver todos os álbuns
CREATE POLICY "Admins can view all albums"
ON public.photo_albums FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem inserir álbuns
CREATE POLICY "Admins can insert albums"
ON public.photo_albums FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar álbuns
CREATE POLICY "Admins can update albums"
ON public.photo_albums FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar álbuns
CREATE POLICY "Admins can delete albums"
ON public.photo_albums FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Todos podem ver fotos de álbuns publicados
CREATE POLICY "Anyone can view photos from published albums"
ON public.photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.photo_albums
    WHERE id = photos.album_id AND is_published = true
  )
);

-- Admins podem ver todas as fotos
CREATE POLICY "Admins can view all photos"
ON public.photos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem inserir fotos
CREATE POLICY "Admins can insert photos"
ON public.photos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar fotos
CREATE POLICY "Admins can update photos"
ON public.photos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar fotos
CREATE POLICY "Admins can delete photos"
ON public.photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Bucket de storage para fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('photo-albums', 'photo-albums', true, 10485760);

-- Políticas do bucket
CREATE POLICY "Anyone can view album photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photo-albums');

CREATE POLICY "Admins can upload album photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photo-albums' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update album photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photo-albums' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete album photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photo-albums' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Função para atualizar contagem de fotos no álbum
CREATE OR REPLACE FUNCTION public.update_album_photos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.photo_albums SET photos_count = photos_count + 1 WHERE id = NEW.album_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.photo_albums SET photos_count = photos_count - 1 WHERE id = OLD.album_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para contagem automática
CREATE TRIGGER update_photos_count
AFTER INSERT OR DELETE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_album_photos_count();