ALTER TABLE public.emergency_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to view emergency notifications"
ON public.emergency_notifications FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to insert emergency notifications"
ON public.emergency_notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to update emergency notifications"
ON public.emergency_notifications FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Allow authenticated users to delete emergency notifications"
ON public.emergency_notifications FOR DELETE
USING (auth.role() = 'authenticated');