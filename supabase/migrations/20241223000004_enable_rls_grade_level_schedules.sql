ALTER TABLE public.grade_level_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to view grade level schedules"
ON public.grade_level_schedules FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to insert grade level schedules"
ON public.grade_level_schedules FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to update grade level schedules"
ON public.grade_level_schedules FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete grade level schedules" ON public.grade_level_schedules;
CREATE POLICY "Allow authenticated users to delete grade level schedules"
ON public.grade_level_schedules FOR DELETE
USING (auth.role() = 'authenticated');