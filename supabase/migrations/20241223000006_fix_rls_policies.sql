-- Fix RLS policies for all tables to use correct authentication check

-- Students table
DROP POLICY IF EXISTS "Allow authenticated users to view students" ON public.students;
CREATE POLICY "Allow authenticated users to view students"
ON public.students FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON public.students;
CREATE POLICY "Allow authenticated users to insert students"
ON public.students FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update students" ON public.students;
CREATE POLICY "Allow authenticated users to update students"
ON public.students FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete students" ON public.students;
CREATE POLICY "Allow authenticated users to delete students"
ON public.students FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Attendance logs table
DROP POLICY IF EXISTS "Allow authenticated users to view attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to view attendance logs"
ON public.attendance_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to insert attendance logs"
ON public.attendance_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to update attendance logs"
ON public.attendance_logs FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to delete attendance logs"
ON public.attendance_logs FOR DELETE
USING (auth.uid() IS NOT NULL);

-- School settings table
DROP POLICY IF EXISTS "Allow authenticated users to view school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to view school settings"
ON public.school_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to insert school settings"
ON public.school_settings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to update school settings"
ON public.school_settings FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to delete school settings"
ON public.school_settings FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Grade level schedules table
DROP POLICY IF EXISTS "Allow authenticated users to view grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to view grade level schedules"
ON public.grade_level_schedules FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to insert grade level schedules"
ON public.grade_level_schedules FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to update grade level schedules"
ON public.grade_level_schedules FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to delete grade level schedules"
ON public.grade_level_schedules FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Emergency notifications table
DROP POLICY IF EXISTS "Allow authenticated users to view emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to view emergency notifications"
ON public.emergency_notifications FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to insert emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to insert emergency notifications"
ON public.emergency_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to update emergency notifications"
ON public.emergency_notifications FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to delete emergency notifications"
ON public.emergency_notifications FOR DELETE
USING (auth.uid() IS NOT NULL);
