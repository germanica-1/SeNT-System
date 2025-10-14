ALTER TABLE grade_level_schedules DROP COLUMN IF EXISTS start_grade;
ALTER TABLE grade_level_schedules DROP COLUMN IF EXISTS end_grade;

UPDATE grade_level_schedules SET grade_range = 'Grade 7-8' WHERE grade_range = 'Grade 7-8';
UPDATE grade_level_schedules SET grade_range = 'Grade 9-12' WHERE grade_range = 'Grade 9-12';
