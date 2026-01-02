-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Allow authenticated users to upload their own media
CREATE POLICY "Users can upload their own media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to post media
CREATE POLICY "Post media is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);