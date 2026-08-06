-- =============================================================================
-- EOD & CBRN NATIONAL COMMAND DATABASE - SUPABASE RPC & RLS MIGRATION (v7.0)
-- Project Reference: tfuhkakpucjgrrqcnpaf
-- URL: https://tfuhkakpucjgrrqcnpaf.supabase.co
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ATOMIC PERSONNEL CREATION RPC FUNCTION
CREATE OR REPLACE FUNCTION create_personnel_atomic(
    p_id UUID,
    p_apf_no VARCHAR,
    p_rank VARCHAR,
    p_full_name VARCHAR,
    p_educational_qualification VARCHAR,
    p_state_of_origin VARCHAR,
    p_lga VARCHAR,
    p_tribe VARCHAR,
    p_geopolitical_zone VARCHAR,
    p_date_of_birth DATE,
    p_date_of_enlistment DATE,
    p_date_of_last_promotion DATE,
    p_retirement_date DATE,
    p_calculated_retirement_date DATE,
    p_command_served_last VARCHAR,
    p_date_transferred_to_command DATE,
    p_gd_sp VARCHAR,
    p_grade_level VARCHAR,
    p_duty_post VARCHAR,
    p_employee_code VARCHAR,
    p_base_id UUID,
    p_unit_id UUID,
    p_registration_status VARCHAR,
    p_employment_status VARCHAR,
    -- Private Fields
    p_account_number VARCHAR,
    p_bank_name VARCHAR,
    p_ippis_number VARCHAR,
    p_pfa VARCHAR,
    p_pen_pin VARCHAR,
    p_nhf_number VARCHAR,
    p_mss VARCHAR,
    p_email_address VARCHAR,
    p_phone_number VARCHAR,
    -- Actor
    p_actor VARCHAR
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_created_personnel RECORD;
BEGIN
    -- Check AP/F/NO Uniqueness
    IF EXISTS (SELECT 1 FROM public.personnel WHERE apf_no = p_apf_no OR ap_no = p_apf_no) THEN
        RAISE EXCEPTION 'AP/F/NO % is already registered.', p_apf_no USING ERRCODE = '23505';
    END IF;

    -- Check Employee Code Uniqueness
    IF p_employee_code IS NOT NULL AND p_employee_code <> '' AND EXISTS (SELECT 1 FROM public.personnel WHERE employee_code = p_employee_code) THEN
        RAISE EXCEPTION 'Employee Code % is already registered.', p_employee_code USING ERRCODE = '23505';
    END IF;

    -- Check IPPIS Uniqueness
    IF p_ippis_number IS NOT NULL AND p_ippis_number <> '' AND EXISTS (SELECT 1 FROM public.personnel_private WHERE ippis_number = p_ippis_number OR ippis_no = p_ippis_number) THEN
        RAISE EXCEPTION 'IPPIS Number % is already registered.', p_ippis_number USING ERRCODE = '23505';
    END IF;

    -- 1. Insert into public.personnel
    INSERT INTO public.personnel (
        id, apf_no, ap_no, service_no, rank, full_name, name,
        educational_qualification, edu_qual, state_of_origin, lga, tribe,
        geopolitical_zone, geo_pol_zone, date_of_birth, dob,
        date_of_enlistment, enlist_date, date_of_last_promotion, last_prom_date,
        retirement_date, retire_date, calculated_retirement_date,
        command_served_last, date_transferred_to_command, transferred_date,
        gd_sp, grade_level, gl, duty_post, employee_code,
        base_id, current_base_unit_id, unit_id, registration_status, employment_status, created_at, updated_at
    ) VALUES (
        p_id, p_apf_no, p_apf_no, p_apf_no, p_rank, p_full_name, p_full_name,
        p_educational_qualification, p_educational_qualification, p_state_of_origin, p_lga, p_tribe,
        p_geopolitical_zone, p_geopolitical_zone, p_date_of_birth, p_date_of_birth,
        p_date_of_enlistment, p_date_of_enlistment, p_date_of_last_promotion, p_date_of_last_promotion,
        p_retirement_date, p_retirement_date, p_calculated_retirement_date,
        p_command_served_last, p_date_transferred_to_command, p_date_transferred_to_command,
        p_gd_sp, p_grade_level, p_grade_level, p_duty_post, p_employee_code,
        p_base_id, p_base_id, p_unit_id, COALESCE(p_registration_status, 'APPROVED'), COALESCE(p_employment_status, 'ACTIVE'), NOW(), NOW()
    ) RETURNING * INTO v_created_personnel;

    -- 2. Insert into public.personnel_private
    INSERT INTO public.personnel_private (
        personnel_id, account_number, account_no, bank_name,
        ippis_number, ippis_no, pfa, pen_pin, nhf_number, nhf_no,
        mss, email_address, email, phone_number, phone, created_at, updated_at
    ) VALUES (
        p_id, p_account_number, p_account_number, p_bank_name,
        p_ippis_number, p_ippis_number, p_pfa, p_pen_pin, p_nhf_number, p_nhf_number,
        p_mss, p_email_address, p_email_address, p_phone_number, p_phone_number, NOW(), NOW()
    );

    -- 3. Insert into public.audit_logs
    INSERT INTO public.audit_logs (
        id, actor, action, category, details, timestamp
    ) VALUES (
        gen_random_uuid(), COALESCE(p_actor, 'SYSTEM'), 'ADD_PERSONNEL', 'PERSONNEL',
        format('Created personnel record %s (%s)', p_apf_no, p_full_name), NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'personnel_id', p_id,
        'apf_no', p_apf_no,
        'full_name', p_full_name,
        'rank', p_rank
    );
END;
$$;

-- 2. ROW LEVEL SECURITY POLICIES FOR SUPABASE TABLES
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_settings ENABLE ROW LEVEL SECURITY;

-- Allow all read/write for service role key and authenticated policies
DROP POLICY IF EXISTS "Allow read write on bases" ON public.bases;
CREATE POLICY "Allow read write on bases" ON public.bases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on units" ON public.units;
CREATE POLICY "Allow read write on units" ON public.units FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on personnel" ON public.personnel;
CREATE POLICY "Allow read write on personnel" ON public.personnel FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on personnel_private" ON public.personnel_private;
CREATE POLICY "Allow read write on personnel_private" ON public.personnel_private FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow read write on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on profiles" ON public.profiles;
CREATE POLICY "Allow read write on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read write on retirement_settings" ON public.retirement_settings;
CREATE POLICY "Allow read write on retirement_settings" ON public.retirement_settings FOR ALL USING (true) WITH CHECK (true);
