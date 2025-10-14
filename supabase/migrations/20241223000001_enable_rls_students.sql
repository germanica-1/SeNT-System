ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view students" ON public.students;
CREATE POLICY "Allow authenticated users to view students"
ON public.students FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON public.students;
CREATE POLICY "Allow authenticated users to insert students"
ON public.students FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update students" ON public.students;
CREATE POLICY "Allow authenticated users to update students"
ON public.students FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete students" ON public.students;
CREATE POLICY "Allow authenticated users to delete students"
ON public.students FOR DELETE
USING (auth.role() = 'authenticated');