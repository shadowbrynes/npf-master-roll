-- Ensure RLS policies on personnel_private for read and write access
ALTER TABLE public.personnel_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to read personnel_private" ON public.personnel_private;
CREATE POLICY "Allow authenticated to read personnel_private" ON public.personnel_private
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow global_admin and system to manage personnel_private" ON public.personnel_private;
CREATE POLICY "Allow global_admin and system to manage personnel_private" ON public.personnel_private
FOR ALL TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
