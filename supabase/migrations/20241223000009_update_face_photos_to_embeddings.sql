-- Remove old face photo columns if they exist
ALTER TABLE students 
DROP COLUMN IF EXISTS face_photo_front,
DROP COLUMN IF EXISTS face_photo_right,
DROP COLUMN IF EXISTS face_photo_left;

-- Remove old embedding columns if they exist
ALTER TABLE students 
DROP COLUMN IF EXISTS face_embedding_front,
DROP COLUMN IF EXISTS face_embedding_right,
DROP COLUMN IF EXISTS face_embedding_left;

-- Add new columns for image storage paths and embeddings
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS face_image_front_url TEXT,
ADD COLUMN IF NOT EXISTS face_image_low_angle_url TEXT,
ADD COLUMN IF NOT EXISTS face_embedding_front FLOAT8[128],
ADD COLUMN IF NOT EXISTS face_embedding_low_angle FLOAT8[128];

-- Enable realtime for students table (only if not already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'students'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE students;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Table already in publication, ignore
        NULL;
END $$;