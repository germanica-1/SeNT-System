ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to view school settings"
ON public.school_settings FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to insert school settings"
ON public.school_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to update school settings"
ON public.school_settings FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete school settings" ON public.school_settings;
CREATE POLICY "Allow authenticated users to delete school settings"
ON public.school_settings FOR DELETE
USING (auth.role() = 'authenticated');