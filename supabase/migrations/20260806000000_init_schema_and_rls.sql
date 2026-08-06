-- NPF EOD CBRN PERSONNEL & EQUIPMENT MANAGEMENT SYSTEM
-- Full Production PostgreSQL Database Schema Migration & Row Level Security Policies
-- Migration ID: 20260806000000_init_schema_and_rls

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ORGANISATIONAL HIERARCHY TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.state_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id UUID REFERENCES public.commands(id) ON DELETE SET NULL,
    base_code TEXT UNIQUE NOT NULL,
    base_name TEXT NOT NULL,
    state TEXT NOT NULL,
    location TEXT NOT NULL,
    is_fct BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID NOT NULL REFERENCES public.state_bases(id) ON DELETE CASCADE,
    unit_code TEXT UNIQUE NOT NULL,
    unit_name TEXT NOT NULL,
    unit_type TEXT DEFAULT 'TACTICAL' CHECK (unit_type IN ('TACTICAL', 'AIRPORT', 'SEAPORT', 'FRONTLINE', 'LABORATORY', 'HEADQUARTERS')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 2. ROLES, PERMISSIONS & PROFILES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (name IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. PERSONNEL MASTER ROLL & DECOUPLED FINANCIAL TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apf_no TEXT UNIQUE NOT NULL,
    rank TEXT NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT DEFAULT 'MALE' CHECK (gender IN ('MALE', 'FEMALE')),
    educational_qualification TEXT,
    state_of_origin TEXT NOT NULL,
    lga TEXT,
    tribe TEXT,
    geopolitical_zone TEXT,
    date_of_birth DATE NOT NULL,
    phone_number TEXT NOT NULL,
    email_address TEXT,
    mss TEXT,
    photo_url TEXT,
    date_of_enlistment DATE NOT NULL,
    date_of_last_promotion DATE,
    retirement_date DATE NOT NULL,
    calculated_retirement_date DATE NOT NULL,
    command_served_last TEXT,
    duty_post TEXT,
    date_transferred_to_command DATE,
    gd_sp TEXT DEFAULT 'GD',
    base_id UUID REFERENCES public.state_bases(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    current_appointment TEXT,
    date_posted_to_unit DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'suspended', 'retired', 'dismissed', 'deceased', 'archived')),
    is_archived BOOLEAN DEFAULT false,
    archive_reason TEXT,
    has_retirement_override BOOLEAN DEFAULT false,
    retirement_override_reason TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personnel_financial_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID UNIQUE NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    grade_level TEXT,
    bank_name TEXT,
    account_number TEXT,
    employee_code TEXT UNIQUE,
    ippis_number TEXT UNIQUE,
    pfa TEXT,
    pen_pin TEXT UNIQUE,
    nhf_number TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personnel_contact_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID UNIQUE NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    residential_address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    next_of_kin_name TEXT,
    next_of_kin_phone TEXT,
    next_of_kin_relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    personnel_id UUID UNIQUE REFERENCES public.personnel(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'personnel' CHECK (role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor')),
    state_base_id UUID REFERENCES public.state_bases(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    financial_access_granted BOOLEAN DEFAULT false,
    is_mfa_enabled BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state_base_id UUID REFERENCES public.state_bases(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS financial_access_granted BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, role_id)
);

-- ==============================================================================
-- 4. CAREER, POSTINGS, TRANSFERS & PROMOTIONS HISTORY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.personnel_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    base_id UUID NOT NULL REFERENCES public.state_bases(id),
    unit_id UUID NOT NULL REFERENCES public.units(id),
    duty_post TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    posting_order_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personnel_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    from_base_id UUID REFERENCES public.state_bases(id),
    to_base_id UUID NOT NULL REFERENCES public.state_bases(id),
    from_unit_id UUID REFERENCES public.units(id),
    to_unit_id UUID NOT NULL REFERENCES public.units(id),
    transfer_reason TEXT NOT NULL,
    approval_ref TEXT,
    transferred_by UUID REFERENCES public.profiles(id),
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personnel_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    previous_rank TEXT NOT NULL,
    new_rank TEXT NOT NULL,
    gazette_ref TEXT,
    promotion_date DATE NOT NULL,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personnel_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    change_reason TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 5. STATUTORY RETIREMENT AUTOMATION & OVERRIDES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.retirement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_age_years INT DEFAULT 60 NOT NULL,
    max_service_years INT DEFAULT 35 NOT NULL,
    advance_notice_days INT DEFAULT 60 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retirement_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID UNIQUE NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    age_retirement_date DATE NOT NULL,
    service_retirement_date DATE NOT NULL,
    effective_retirement_date DATE NOT NULL,
    basis_of_calculation TEXT NOT NULL CHECK (basis_of_calculation IN ('AGE_60', 'SERVICE_35', 'OVERRIDE')),
    days_remaining INT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'MORE_THAN_12_MONTHS', 'BETWEEN_6_AND_12_MONTHS', 'BETWEEN_3_AND_6_MONTHS',
        'DUE_WITHIN_60_DAYS', 'DUE_WITHIN_30_DAYS', 'DUE_WITHIN_7_DAYS',
        'DUE_TODAY', 'DATE_PASSED', 'OVERRIDDEN', 'COMPLETED'
    )),
    is_notification_sent BOOLEAN DEFAULT false,
    notification_date TIMESTAMPTZ,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES public.profiles(id),
    acknowledged_at TIMESTAMPTZ,
    last_calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retirement_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    original_retirement_date DATE NOT NULL,
    new_retirement_date DATE NOT NULL,
    override_reason TEXT NOT NULL,
    approval_ref TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 6. GEN.60 FORM MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.gen60_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    form_year INT NOT NULL,
    form_type TEXT DEFAULT 'ANNUAL_APPRAISAL',
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'returned_for_correction', 'superseded', 'archived')),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INT,
    mime_type TEXT,
    file_checksum TEXT,
    remarks TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gen60_form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gen60_form_id UUID NOT NULL REFERENCES public.gen60_forms(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    storage_path TEXT NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 7. CBRN & EOD EQUIPMENT MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.equipment_categories(id),
    subcategory TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1 NOT NULL,
    unit_of_measurement TEXT DEFAULT 'PCS',
    acquisition_date DATE,
    acquisition_source TEXT,
    base_id UUID REFERENCES public.state_bases(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    store_location TEXT,
    assigned_officer_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    condition TEXT DEFAULT 'serviceable' CHECK (condition IN ('serviceable', 'unserviceable', 'under_repair', 'damaged', 'obsolete')),
    operational_status TEXT DEFAULT 'operational' CHECK (operational_status IN ('operational', 'degraded', 'non_operational')),
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'issued', 'in_use', 'under_inspection', 'under_maintenance', 'awaiting_repair', 'unserviceable', 'missing', 'transferred', 'retired', 'disposed')),
    last_inspection_date DATE,
    next_inspection_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    last_calibration_date DATE,
    calibration_expiry_date DATE,
    warranty_expiry_date DATE,
    remarks TEXT,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('ISSUE', 'RETURN', 'TRANSFER', 'MAINTENANCE_SENT', 'MAINTENANCE_RETURN', 'DISPOSAL')),
    from_base_id UUID REFERENCES public.state_bases(id),
    to_base_id UUID REFERENCES public.state_bases(id),
    from_unit_id UUID REFERENCES public.units(id),
    to_unit_id UUID REFERENCES public.units(id),
    assigned_officer_id UUID REFERENCES public.personnel(id),
    remarks TEXT,
    executed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
    maintenance_type TEXT NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(12,2),
    performed_by TEXT,
    completion_date DATE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment_calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
    calibration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certified_by TEXT NOT NULL,
    certificate_ref TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_items(id) ON DELETE CASCADE,
    disposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    disposal_reason TEXT NOT NULL,
    approval_ref TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 8. NOTIFICATIONS, WORKFLOWS & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('RETIREMENT_60_DAYS', 'BIRTHDAY', 'GEN60_STATUS', 'CORRECTION_REQUEST', 'APPROVAL_REQUEST', 'EQUIPMENT_ALERT', 'SECURITY_EVENT')),
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acknowledged', 'archived')),
    related_entity_type TEXT,
    related_entity_id UUID,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.birthday_message_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    birthday_year INT NOT NULL,
    message_text TEXT NOT NULL,
    sent_by UUID REFERENCES public.profiles(id),
    sent_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(personnel_id, birthday_year)
);

CREATE TABLE IF NOT EXISTS public.correction_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    current_value TEXT,
    proposed_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    document_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    review_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    state_base_id UUID REFERENCES public.state_bases(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    previous_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT,
    approval_ref TEXT,
    result TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 9. PRIVATE STORAGE BUCKETS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('gen60-documents', 'gen60-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('personnel-photos', 'personnel-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('equipment-docs', 'equipment-docs', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES ON ALL PROTECTED TABLES
-- ==============================================================================

ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_financial_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gen60_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gen60_form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_message_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is global admin (SECURE search_path)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'global_admin'
  );
END;
$$;

-- Helper function to get current user base id (SECURE search_path)
CREATE OR REPLACE FUNCTION public.get_user_base_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_id UUID;
BEGIN
  SELECT state_base_id INTO base_id FROM public.profiles WHERE id = auth.uid();
  RETURN base_id;
END;
$$;

-- RLS: Profiles Table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_global_admin());

CREATE POLICY "Global Admin can manage profiles" ON public.profiles
  FOR ALL USING (public.is_global_admin());

-- RLS: Personnel Table
CREATE POLICY "Global Admin full access to personnel" ON public.personnel
  FOR ALL USING (public.is_global_admin());

CREATE POLICY "State Admin access to personnel in state base" ON public.personnel
  FOR SELECT USING (
    base_id = public.get_user_base_id()
  );

CREATE POLICY "Personnel self access only" ON public.personnel
  FOR SELECT USING (
    id IN (SELECT personnel_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS: Financial Details Table (STRICT ACCESS)
CREATE POLICY "Global Admin or Financial Granted access to finance" ON public.personnel_financial_details
  FOR ALL USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND financial_access_granted = true)
  );

-- RLS: Gen.60 Forms Table
CREATE POLICY "Global Admin full access to gen60" ON public.gen60_forms
  FOR ALL USING (public.is_global_admin());

CREATE POLICY "State Admin view gen60 in base" ON public.gen60_forms
  FOR SELECT USING (
    personnel_id IN (SELECT id FROM public.personnel WHERE base_id = public.get_user_base_id())
  );

CREATE POLICY "Personnel self view gen60" ON public.gen60_forms
  FOR SELECT USING (
    personnel_id IN (SELECT personnel_id FROM public.profiles WHERE id = auth.uid())
  );

-- RLS: Equipment Items Table
CREATE POLICY "Authenticated users view equipment" ON public.equipment_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Global Admin or Equipment Officer manage equipment" ON public.equipment_items
  FOR ALL USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('equipment_officer', 'state_admin'))
  );

-- RLS: Audit Logs Table (APPEND ONLY)
CREATE POLICY "Global Admin view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_global_admin());

CREATE POLICY "Allow authenticated insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: Commands, State Bases, Units
CREATE POLICY "Authenticated users view commands" ON public.commands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users view bases" ON public.state_bases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users view units" ON public.units FOR SELECT USING (auth.role() = 'authenticated');

-- RLS: Storage Objects Security
CREATE POLICY "Authenticated view private storage" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      bucket_id IN ('gen60-documents', 'personnel-photos', 'equipment-docs')
    )
  );

CREATE POLICY "Authenticated upload private storage" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      bucket_id IN ('gen60-documents', 'personnel-photos', 'equipment-docs')
    )
  );

-- ==============================================================================
-- 11. STATUTORY RETIREMENT SCANNER & BIRTHDAY ENGINE PROCEDURES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.run_daily_retirement_and_birthday_scans()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  calc_ret_date DATE;
  days_left INT;
  ret_cat TEXT;
  age_date DATE;
  svc_date DATE;
BEGIN
  -- 1. Scan and calculate statutory retirement dates
  FOR rec IN SELECT id, date_of_birth, date_of_enlistment FROM public.personnel WHERE status = 'active' LOOP
    age_date := (rec.date_of_birth + INTERVAL '60 years')::DATE;
    svc_date := (rec.date_of_enlistment + INTERVAL '35 years')::DATE;
    calc_ret_date := LEAST(age_date, svc_date);
    days_left := (calc_ret_date - CURRENT_DATE);

    IF days_left > 365 THEN ret_cat := 'MORE_THAN_12_MONTHS';
    ELSIF days_left BETWEEN 180 AND 365 THEN ret_cat := 'BETWEEN_6_AND_12_MONTHS';
    ELSIF days_left BETWEEN 90 AND 179 THEN ret_cat := 'BETWEEN_3_AND_6_MONTHS';
    ELSIF days_left BETWEEN 31 AND 60 THEN ret_cat := 'DUE_WITHIN_60_DAYS';
    ELSIF days_left BETWEEN 8 AND 30 THEN ret_cat := 'DUE_WITHIN_30_DAYS';
    ELSIF days_left BETWEEN 1 AND 7 THEN ret_cat := 'DUE_WITHIN_7_DAYS';
    ELSIF days_left = 0 THEN ret_cat := 'DUE_TODAY';
    ELSE ret_cat := 'DATE_PASSED';
    END IF;

    INSERT INTO public.retirement_calculations (
      personnel_id, age_retirement_date, service_retirement_date, effective_retirement_date,
      basis_of_calculation, days_remaining, category, last_calculated_at
    ) VALUES (
      rec.id, age_date, svc_date, calc_ret_date,
      CASE WHEN age_date < svc_date THEN 'AGE_60' ELSE 'SERVICE_35' END,
      days_left, ret_cat, now()
    ) ON CONFLICT (personnel_id) DO UPDATE SET
      effective_retirement_date = EXCLUDED.effective_retirement_date,
      days_remaining = EXCLUDED.days_remaining,
      category = EXCLUDED.category,
      last_calculated_at = now();

    -- Generate 60-day advance high-priority notification for Global Admin
    IF days_left <= 60 AND days_left > 0 THEN
      INSERT INTO public.notifications (
        recipient_profile_id, title, message, type, priority, related_entity_type, related_entity_id
      ) SELECT p.id, 'STATUTORY RETIREMENT WARNING (60 DAYS)',
               'Officer statutory retirement is due within 60 days.', 'RETIREMENT_60_DAYS', 'HIGH', 'PERSONNEL', rec.id
        FROM public.profiles p WHERE p.role = 'global_admin'
        ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
