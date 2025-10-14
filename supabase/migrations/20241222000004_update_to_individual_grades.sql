-- Drop the existing table and recreate with individual grade structure
DROP TABLE IF EXISTS grade_level_schedules;

CREATE TABLE IF NOT EXISTS grade_level_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_level VARCHAR(50) NOT NULL UNIQUE,
  dismissal_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default schedules for common grade levels
INSERT INTO grade_level_schedules (grade_level, dismissal_time) VALUES 
('6', '18:00:00'),
('7', '12:00:00'),
('8', '12:00:00'),
('9', '18:00:00'),
('10', '18:00:00'),
('11', '18:00:00'),
('12', '12:00:00')
ON CONFLICT (grade_level) DO NOTHING;

alter publication supabase_realtime add table grade_level_schedules;
