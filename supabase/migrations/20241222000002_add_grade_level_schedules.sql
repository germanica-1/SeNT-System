CREATE TABLE IF NOT EXISTS grade_level_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_range VARCHAR(50) NOT NULL,
  start_grade INTEGER NOT NULL,
  end_grade INTEGER NOT NULL,
  dismissal_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO grade_level_schedules (grade_range, start_grade, end_grade, dismissal_time) VALUES 
('Grade 7-8', 7, 8, '12:00:00'),
('Grade 9-12', 9, 12, '18:00:00')
ON CONFLICT DO NOTHING;

alter publication supabase_realtime add table grade_level_schedules;
