-- =============================================================================
-- Migration: 20260806200000_state_nominal_roll_management.sql
-- Description: State Nominal Roll Management, Personnel Documents & State Isolation RLS
-- =============================================================================

-- 1. Create States Table & Seed 36 States + FCT
CREATE TABLE IF NOT EXISTS public.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name TEXT UNIQUE NOT NULL,
    state_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.states (state_name, state_code) VALUES
('ABIA', 'AB'), ('ADAMAWA', 'AD'), ('AKWA IBOM', 'AK'), ('ANAMBRA', 'AN'), ('BAUCHI', 'BA'),
('BAYELSA', 'BY'), ('BENUE', 'BN'), ('BORNO', 'BO'), ('CROSS RIVER', 'CR'), ('DELTA', 'DT'),
('EBONYI', 'EB'), ('EDO', 'ED'), ('EKITI', 'EK'), ('ENUGU', 'EN'), ('FCT ABUJA', 'FC'),
('GOMBE', 'GB'), ('IMO', 'IM'), ('JIGAWA', 'JG'), ('KADUNA', 'KD'), ('KANO', 'KN'),
('KATSINA', 'KT'), ('KEBBI', 'KB'), ('KOGI', 'KG'), ('KWARA', 'KW'), ('LAGOS', 'LA'),
('NASARAWA', 'NAS'), ('NIGER', 'NG'), ('OGUN', 'OG'), ('ONDO', 'ON'), ('OSUN', 'OS'),
('OYO', 'OY'), ('PLATEAU', 'PL'), ('RIVERS', 'RV'), ('SOKOTO', 'SK'), ('TARABA', 'TR'),
('YOBE', 'YB'), ('ZAMFARA', 'ZM')
ON CONFLICT (state_code) DO UPDATE SET state_name = EXCLUDED.state_name;

-- 2. Extend roles / user_roles with state_id
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES public.states(id) ON DELETE SET NULL;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES public.states(id) ON DELETE SET NULL;

-- 3. Nominal Roll Uploads Table
CREATE TABLE IF NOT EXISTS public.nominal_roll_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID REFERENCES public.states(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    total_records INT DEFAULT 0,
    submission_status TEXT DEFAULT 'submitted' CHECK (submission_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_requested')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Supporting Personnel Documents Table
CREATE TABLE IF NOT EXISTS public.personnel_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE,
    state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('Identity Document', 'Service Record', 'Appointment Letter', 'Training Certificate', 'Medical Certificate', 'Other')),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominal_roll_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_documents ENABLE ROW LEVEL SECURITY;

-- RLS: States (Anyone authenticated can read)
DROP POLICY IF EXISTS "Anyone can read states" ON public.states;
CREATE POLICY "Anyone can read states" ON public.states FOR SELECT USING (true);

-- RLS: Nominal Roll Uploads
DROP POLICY IF EXISTS "Global Admin full access to nominal_roll_uploads" ON public.nominal_roll_uploads;
CREATE POLICY "Global Admin full access to nominal_roll_uploads" ON public.nominal_roll_uploads
FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'global_admin')
);

DROP POLICY IF EXISTS "State Admin view own state nominal_roll_uploads" ON public.nominal_roll_uploads;
CREATE POLICY "State Admin view own state nominal_roll_uploads" ON public.nominal_roll_uploads
FOR SELECT TO authenticated USING (
    state_id IN (SELECT state_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'state_admin')
);

DROP POLICY IF EXISTS "State Admin insert own state nominal_roll_uploads" ON public.nominal_roll_uploads;
CREATE POLICY "State Admin insert own state nominal_roll_uploads" ON public.nominal_roll_uploads
FOR INSERT TO authenticated WITH CHECK (
    state_id IN (SELECT state_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'state_admin')
);

-- RLS: Personnel Documents
DROP POLICY IF EXISTS "Global Admin full access to personnel_documents" ON public.personnel_documents;
CREATE POLICY "Global Admin full access to personnel_documents" ON public.personnel_documents
FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'global_admin')
);

DROP POLICY IF EXISTS "State Admin view own state personnel_documents" ON public.personnel_documents;
CREATE POLICY "State Admin view own state personnel_documents" ON public.personnel_documents
FOR SELECT TO authenticated USING (
    state_id IN (SELECT state_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'state_admin')
);

DROP POLICY IF EXISTS "State Admin insert own state personnel_documents" ON public.personnel_documents;
CREATE POLICY "State Admin insert own state personnel_documents" ON public.personnel_documents
FOR INSERT TO authenticated WITH CHECK (
    state_id IN (SELECT state_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'state_admin')
);

-- 6. Private Storage Bucket: personnel-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'personnel-documents',
    'personnel-documents',
    false,
    15728640, -- 15MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies for personnel-documents
DROP POLICY IF EXISTS "Global Admin full access to personnel-documents storage" ON storage.objects;
CREATE POLICY "Global Admin full access to personnel-documents storage" ON storage.objects
FOR ALL TO authenticated USING (
    bucket_id = 'personnel-documents' AND (
        public.is_global_admin() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'global_admin')
    )
);

DROP POLICY IF EXISTS "Authenticated users access personnel-documents" ON storage.objects;
CREATE POLICY "Authenticated users access personnel-documents" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'personnel-documents');

DROP POLICY IF EXISTS "Authenticated upload personnel-documents" ON storage.objects;
CREATE POLICY "Authenticated upload personnel-documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'personnel-documents');
