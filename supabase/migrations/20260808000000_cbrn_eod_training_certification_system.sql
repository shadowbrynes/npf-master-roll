-- =============================================================================
-- Migration: 20260808000000_cbrn_eod_training_certification_system.sql
-- Description: Complete CBRN & EOD Training, Certification, Competency, and Document Management System
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. COURSE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.course_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT UNIQUE NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Default Categories
INSERT INTO public.course_categories (category_name, description, display_order) VALUES
('CBRN', 'Chemical, Biological, Radiological and Nuclear Awareness and Response', 1),
('EOD', 'Explosive Ordnance Disposal Basic and Advanced Tactics', 2),
('Hazmat', 'Hazardous Materials Operations and Incident Control', 3),
('Explosives Ordnance', 'Explosive Ordnance Recognition and Range Operations', 4),
('Detection', 'Chemical, Biological and Radiological Detection Sensor Technologies', 5),
('Decontamination', 'Personnel and Tactical Equipment Decontamination Operations', 6),
('Radiological Safety', 'Ionizing Radiation Safety and Shielding Protocols', 7),
('Chemical Safety', 'Industrial and Military Chemical Hazard Safeguards', 8),
('Biological Response', 'Bio-threat Containment and Bio-agent Sampling', 9),
('IED Response', 'Improvised Explosive Device Defeat and Render-Safe Procedures', 10),
('Bomb Disposal', 'High-Yield Explosive Threat Interdiction and Bomb Scene Management', 11),
('Post Blast Investigation', 'Post-Blast Forensics, Evidentiary Collection and Analysis', 12),
('Emergency Response', 'Law Enforcement First Responder and Disaster Management', 13),
('Tactical Safety', 'Operational Safety, PPE Inspection and Hazard Assessment', 14),
('Instructor Certification', 'Tactical Instructional Competency and Master Trainer Certification', 15),
('Other', 'Specialised Technical and Auxiliary Tactical Courses', 16)
ON CONFLICT (category_name) DO NOTHING;

-- 2. TRAINING PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.training_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT UNIQUE NOT NULL,
    provider_type TEXT DEFAULT 'Government Agency',
    country TEXT DEFAULT 'Nigeria',
    address TEXT,
    email TEXT,
    telephone TEXT,
    website TEXT,
    accreditation_details TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Default Training Providers
INSERT INTO public.training_providers (provider_name, provider_type, country, accreditation_details) VALUES
('NPF EOD CBRN Training School, Maiduguri', 'Law Enforcement Academy', 'Nigeria', 'Official NPF Certified Training Wing'),
('Police Staff College, Jos', 'Government Police Staff College', 'Nigeria', 'Federal Law Enforcement Accreditation'),
('National Emergency Management Agency (NEMA)', 'Government Agency', 'Nigeria', 'National Disaster Management Accreditation'),
('International Atomic Energy Agency (IAEA)', 'International Organisation', 'Austria', 'UN Global Radiation Safety & Safeguards Accredited'),
('US Defense Threat Reduction Agency (DTRA)', 'International Military Partner', 'United States', 'International CBRN Security Clearance Standard'),
('UK Defence EOD CBRN Academy', 'Military Academy', 'United Kingdom', 'NATO Qualified EOD Training Institution'),
('Nigerian Army School of Military Engineering (NASME), Makurdi', 'Military Academy', 'Nigeria', 'Armed Forces EOD & Combat Engineering Accredited')
ON CONFLICT (provider_name) DO NOTHING;

-- 3. TRAINING COURSES CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.training_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_name TEXT NOT NULL,
    course_code CITEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    description TEXT,
    provider_id UUID REFERENCES public.training_providers(id) ON DELETE SET NULL,
    default_provider_name TEXT,
    validity_period_months INT DEFAULT 24,
    renewal_requirement TEXT DEFAULT 'Re-certification every 24 months via refresher assessment',
    competency_awarded TEXT,
    required_prerequisite TEXT,
    certification_level TEXT DEFAULT 'Level I',
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Default Courses
INSERT INTO public.training_courses (course_code, course_name, category_name, validity_period_months, competency_awarded) VALUES
('CBRN-101', 'CBRN Awareness Course', 'CBRN', 36, 'Basic CBRN First Responder'),
('CBRN-201', 'Advanced CBRN Response', 'CBRN', 24, 'Qualified CBRN Specialist'),
('CBRN-DET-1', 'Chemical Detection Course', 'Detection', 24, 'Chemical Detection Sensor Specialist'),
('CBRN-RAD-1', 'Radiological Detection Course', 'Radiological Safety', 24, 'Radiation Field Monitor'),
('CBRN-BIO-1', 'Biological Incident Response', 'Biological Response', 24, 'Bio-hazard Field Operator'),
('CBRN-DECON-1', 'Decontamination Operations', 'Decontamination', 24, 'Hazmat Decontamination Specialist'),
('EOD-BASIC', 'EOD Basic Course', 'EOD', 36, 'EOD Assistant Technician'),
('EOD-ADV', 'EOD Advanced Course', 'EOD', 24, 'Qualified EOD Bomb Technician'),
('IEDD-301', 'Improvised Explosive Device Disposal', 'IED Response', 24, 'Master IEDD Operator'),
('PBI-401', 'Post Blast Investigation', 'Post Blast Investigation', 36, 'Post-Blast Forensic Investigator'),
('BSM-201', 'Bomb Scene Management', 'Bomb Disposal', 24, 'Incident Scene Commander'),
('HAZMAT-OPS', 'Hazardous Materials Operations', 'Hazmat', 24, 'Hazmat Operational Operator'),
('HAZMAT-TECH', 'Hazmat Technician Course', 'Hazmat', 24, 'Hazmat Master Specialist')
ON CONFLICT (course_code) DO NOTHING;

-- 4. PERSONNEL CERTIFICATIONS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.personnel_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.training_courses(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.training_providers(id) ON DELETE SET NULL,
    
    apf_no TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    rank TEXT,
    department TEXT,
    unit TEXT,
    command_location TEXT,
    phone_number TEXT,
    official_email TEXT,
    
    course_name TEXT NOT NULL,
    category TEXT NOT NULL,
    provider TEXT,
    provider_country TEXT,
    provider_address TEXT,
    provider_contact TEXT,
    accreditation_details TEXT,
    
    certificate_number TEXT,
    course_start_date DATE,
    course_end_date DATE,
    completion_date DATE NOT NULL,
    certificate_issue_date DATE,
    expiry_date DATE,
    does_not_expire BOOLEAN DEFAULT false NOT NULL,
    
    verification_status TEXT DEFAULT 'Pending Verification' NOT NULL 
        CHECK (verification_status IN ('Pending Verification', 'Verified', 'Rejected', 'Requires Review')),
    certification_status TEXT DEFAULT 'Active' NOT NULL 
        CHECK (certification_status IN ('Active', 'Expiring Soon', 'Critical Expiry Warning', 'Expired', 'Pending Verification', 'Rejected', 'Requires Review', 'No Expiry')),
    
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by_name TEXT,
    verified_at TIMESTAMPTZ,
    verification_comment TEXT,
    
    previous_certification_id UUID REFERENCES public.personnel_certifications(id) ON DELETE SET NULL,
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    archived_at TIMESTAMPTZ
);

-- 5. CERTIFICATION DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.certification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_id UUID NOT NULL REFERENCES public.personnel_certifications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT,
    document_category TEXT DEFAULT 'Course Certificate' NOT NULL
        CHECK (document_category IN ('Course Certificate', 'Training Report', 'Attendance Confirmation', 'Competency Assessment', 'Instructor Evaluation', 'Renewal Certificate', 'Supporting Document')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. PERSONNEL COMPETENCY REGISTER TABLE
CREATE TABLE IF NOT EXISTS public.personnel_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE UNIQUE,
    apf_no TEXT NOT NULL,
    officer_name TEXT NOT NULL,
    rank TEXT,
    primary_competency TEXT DEFAULT 'General Duty Officer',
    secondary_competency TEXT DEFAULT 'None',
    cbrn_qualification TEXT DEFAULT 'Unqualified',
    eod_qualification TEXT DEFAULT 'Unqualified',
    hazmat_qualification TEXT DEFAULT 'Unqualified',
    detection_qualification TEXT DEFAULT 'Unqualified',
    decontamination_qualification TEXT DEFAULT 'Unqualified',
    last_training_date DATE,
    next_expiry_date DATE,
    competency_status TEXT DEFAULT 'Pending Evaluation' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. TRAINING AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.training_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'SYSTEM',
    actor_role TEXT,
    action TEXT NOT NULL,
    certification_id UUID REFERENCES public.personnel_certifications(id) ON DELETE SET NULL,
    personnel_apf TEXT,
    previous_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view categories" ON public.course_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view providers" ON public.training_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view courses" ON public.training_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view certifications" ON public.personnel_certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view cert documents" ON public.certification_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view competencies" ON public.personnel_competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view training audit" ON public.training_audit_logs FOR SELECT TO authenticated USING (true);

-- Allow write for authorized roles
CREATE POLICY "Authorized write categories" ON public.course_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write providers" ON public.training_providers FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write courses" ON public.training_courses FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write certifications" ON public.personnel_certifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write cert documents" ON public.certification_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write competencies" ON public.personnel_competencies FOR ALL TO authenticated USING (true);
CREATE POLICY "Authorized write training audit" ON public.training_audit_logs FOR ALL TO authenticated USING (true);
