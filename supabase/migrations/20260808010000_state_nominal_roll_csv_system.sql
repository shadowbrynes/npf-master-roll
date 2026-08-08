-- ============================================================================
-- CBRN & EOD COMMAND SYSTEM: STATE NOMINAL ROLL & BULK CSV SUBMISSION SCHEMA
-- Migration: 20260808010000_state_nominal_roll_csv_system.sql
-- ============================================================================

-- 1. Ensure master personnel table supports all 26 headings
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS educational_qualification TEXT,
ADD COLUMN IF NOT EXISTS tribe TEXT,
ADD COLUMN IF NOT EXISTS geopolitical_zone TEXT,
ADD COLUMN IF NOT EXISTS email_address TEXT,
ADD COLUMN IF NOT EXISTS mss TEXT,
ADD COLUMN IF NOT EXISTS date_of_last_promotion DATE,
ADD COLUMN IF NOT EXISTS date_of_retirement DATE,
ADD COLUMN IF NOT EXISTS calculated_retirement_date DATE,
ADD COLUMN IF NOT EXISTS command_served_last TEXT,
ADD COLUMN IF NOT EXISTS duty_post TEXT,
ADD COLUMN IF NOT EXISTS date_transferred_to_command DATE,
ADD COLUMN IF NOT EXISTS gd_sp TEXT DEFAULT 'GD',
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS employee_code TEXT,
ADD COLUMN IF NOT EXISTS ippis_number TEXT,
ADD COLUMN IF NOT EXISTS pfa TEXT,
ADD COLUMN IF NOT EXISTS pen_pin TEXT,
ADD COLUMN IF NOT EXISTS nhf_number TEXT,
ADD COLUMN IF NOT EXISTS assigned_unit TEXT;

-- 2. Create state submission batches table
CREATE TABLE IF NOT EXISTS public.personnel_state_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT UNIQUE NOT NULL,
    state_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT,
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_by_name TEXT,
    
    total_records INTEGER DEFAULT 0 NOT NULL,
    valid_records INTEGER DEFAULT 0 NOT NULL,
    error_records INTEGER DEFAULT 0 NOT NULL,
    duplicate_records INTEGER DEFAULT 0 NOT NULL,
    warning_records INTEGER DEFAULT 0 NOT NULL,
    
    submission_status TEXT DEFAULT 'Uploaded' NOT NULL, -- 'Uploaded', 'Validated', 'Pending Review', 'Approved', 'Returned for Correction', 'Rejected'
    review_comment TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by_name TEXT,
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create submission batch staging items table
CREATE TABLE IF NOT EXISTS public.personnel_submission_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.personnel_state_submissions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    
    -- 26 Headings Data Payload
    apf_no TEXT NOT NULL,
    rank TEXT NOT NULL,
    name TEXT NOT NULL,
    educational_qualification TEXT,
    state_of_origin TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    tribe TEXT,
    date_of_birth DATE NOT NULL,
    geopolitical_zone TEXT,
    email_address TEXT,
    mss TEXT,
    date_of_enlistment DATE NOT NULL,
    date_of_last_promotion DATE,
    imported_date_of_retirement DATE,
    calculated_retirement_date DATE NOT NULL,
    command_served_last TEXT,
    duty_post TEXT,
    date_transferred DATE,
    gd_sp TEXT,
    grade_level TEXT,
    bank_name TEXT,
    employee_code TEXT,
    ippis_number TEXT,
    pfa TEXT,
    pen_pin TEXT,
    nhf_number TEXT,
    assigned_unit TEXT NOT NULL,
    
    validation_status TEXT DEFAULT 'Valid' NOT NULL, -- 'Valid', 'Warning', 'Error', 'Duplicate'
    validation_notes TEXT,
    is_duplicate_override BOOLEAN DEFAULT false NOT NULL,
    imported_personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.personnel_state_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_submission_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Allow authenticated read for state submissions" ON public.personnel_state_submissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert for state submissions" ON public.personnel_state_submissions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update for state submissions" ON public.personnel_state_submissions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read for submission items" ON public.personnel_submission_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert for submission items" ON public.personnel_submission_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update for submission items" ON public.personnel_submission_items
    FOR UPDATE TO authenticated USING (true);

-- 6. Indexes for High Performance Searching & AP/F Lookup
CREATE INDEX IF NOT EXISTS idx_personnel_apf ON public.personnel(apf_no);
CREATE INDEX IF NOT EXISTS idx_personnel_ippis ON public.personnel(ippis_number);
CREATE INDEX IF NOT EXISTS idx_submission_items_apf ON public.personnel_submission_items(apf_no);
CREATE INDEX IF NOT EXISTS idx_submissions_ref ON public.personnel_state_submissions(reference_no);
CREATE INDEX IF NOT EXISTS idx_submissions_state ON public.personnel_state_submissions(state_name);

COMMENT ON TABLE public.personnel_state_submissions IS 'State Personnel CSV Submission Batches for Global Command Approval';
COMMENT ON TABLE public.personnel_submission_items IS 'Staged CSV Personnel Records mapped to 26 official headings';
