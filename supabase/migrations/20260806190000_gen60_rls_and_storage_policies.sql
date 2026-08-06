-- Migration: 20260806190000_gen60_rls_and_storage_policies.sql
-- Description: Enable full RLS and storage policies for gen60_forms and gen60-forms/gen60-documents buckets

ALTER TABLE public.gen60_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global Admin full access to gen60" ON public.gen60_forms;
CREATE POLICY "Global Admin full access to gen60" ON public.gen60_forms
  FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'command_admin', 'personnel_officer')
    )
  );

DROP POLICY IF EXISTS "Authenticated users view gen60" ON public.gen60_forms;
CREATE POLICY "Authenticated users view gen60" ON public.gen60_forms
  FOR SELECT TO authenticated USING (true);

-- Ensure gen60-forms bucket exists in storage.buckets as well
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gen60-forms', 'gen60-forms', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies for gen60-forms
DROP POLICY IF EXISTS "Authenticated read gen60-forms" ON storage.objects;
CREATE POLICY "Authenticated read gen60-forms" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id IN ('gen60-forms', 'gen60-documents'));

DROP POLICY IF EXISTS "Authorized upload gen60-forms" ON storage.objects;
CREATE POLICY "Authorized upload gen60-forms" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('gen60-forms', 'gen60-documents'));
