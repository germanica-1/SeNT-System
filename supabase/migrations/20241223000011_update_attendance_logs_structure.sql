-- Drop existing attendance_logs table and recreate with new structure
DROP TABLE IF EXISTS attendance_logs CASCADE;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  section TEXT NOT NULL,
  time TIME NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable realtime
alter publication supabase_realtime add table attendance_logs;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_grade_section ON attendance_logs(grade_level, section);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_full_name ON attendance_logs(full_name);