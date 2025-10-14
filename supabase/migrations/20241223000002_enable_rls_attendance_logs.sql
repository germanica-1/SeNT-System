ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to view attendance logs"
ON public.attendance_logs FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to insert attendance logs"
ON public.attendance_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to update attendance logs"
ON public.attendance_logs FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete attendance logs" ON public.attendance_logs;
CREATE POLICY "Allow authenticated users to delete attendance logs"
ON public.attendance_logs FOR DELETE
USING (auth.role() = 'authenticated');