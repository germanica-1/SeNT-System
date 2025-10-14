-- Add columns for left and right angle images and embeddings
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS face_image_left_url TEXT,
ADD COLUMN IF NOT EXISTS face_image_right_url TEXT,
ADD COLUMN IF NOT EXISTS face_embedding_left FLOAT8[128],
ADD COLUMN IF NOT EXISTS face_embedding_right FLOAT8[128];

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