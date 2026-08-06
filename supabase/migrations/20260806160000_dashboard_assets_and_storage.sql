-- =============================================================================
-- Migration: 20260806160000_dashboard_assets_and_storage.sql
-- Description: Dashboard Assets Table, Storage Bucket & Audit RLS Policies
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.dashboard_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name TEXT NOT NULL,
    original_filename TEXT,
    storage_path TEXT NOT NULL,
    image_type TEXT NOT NULL CHECK (image_type IN ('dashboard_background', 'blended_hero', 'logo', 'badge')),
    aspect_ratio TEXT DEFAULT '16:9',
    mime_type TEXT DEFAULT 'image/jpeg',
    file_size_bytes BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_assets_type ON public.dashboard_assets(image_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_assets_status ON public.dashboard_assets(status);

ALTER TABLE public.dashboard_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active dashboard_assets" ON public.dashboard_assets;
CREATE POLICY "Anyone can read active dashboard_assets" ON public.dashboard_assets
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global admins manage dashboard_assets" ON public.dashboard_assets;
CREATE POLICY "Global admins manage dashboard_assets" ON public.dashboard_assets
FOR ALL USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- Supabase Storage Bucket for Dashboard Assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'eod-cbrn-dashboard-assets',
    'eod-cbrn-dashboard-assets',
    true,
    5242880, -- 5MB limit per image
    ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Storage Bucket RLS Policies
DROP POLICY IF EXISTS "Public Read Access for Dashboard Assets" ON storage.objects;
CREATE POLICY "Public Read Access for Dashboard Assets" ON storage.objects
FOR SELECT USING (bucket_id = 'eod-cbrn-dashboard-assets');

DROP POLICY IF EXISTS "Global Admin Upload Dashboard Assets" ON storage.objects;
CREATE POLICY "Global Admin Upload Dashboard Assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'eod-cbrn-dashboard-assets' AND public.is_global_admin()
);

DROP POLICY IF EXISTS "Global Admin Delete Dashboard Assets" ON storage.objects;
CREATE POLICY "Global Admin Delete Dashboard Assets" ON storage.objects
FOR DELETE USING (
    bucket_id = 'eod-cbrn-dashboard-assets' AND public.is_global_admin()
);
