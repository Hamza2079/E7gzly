-- Create the 'avatars' bucket if it doesn't already exist and make it completely public so Next.js can read the images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow absolutely anyone (the public application) to view the images
CREATE POLICY "Public Access: Any user can view avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy 2: Allow authenticated users to upload new avatar files
CREATE POLICY "Upload Access: Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Policy 3: Allow authenticated users to update/overwrite avatar files
CREATE POLICY "Update Access: Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- Policy 4: Allow authenticated users to delete their avatars
CREATE POLICY "Delete Access: Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
