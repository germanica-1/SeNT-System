ALTER TABLE students DROP COLUMN IF EXISTS rfid_card_uid;

ALTER TABLE students ADD COLUMN IF NOT EXISTS face_photo_front TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_photo_right TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_photo_left TEXT;

UPDATE students SET face_photo_front = face_photo_url WHERE face_photo_url IS NOT NULL;

ALTER TABLE students DROP COLUMN IF EXISTS face_photo_url;
