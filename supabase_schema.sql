-- =============================================================================
-- EOD & CBRN NATIONAL COMMAND DATABASE - COMPLETE SUPABASE POSTGRESQL SCHEMA (v8.0)
-- Project URL: https://tfuhkakpucjgrrqcnpaf.supabase.co
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email CITEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BASES
CREATE TABLE IF NOT EXISTS public.bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name TEXT NOT NULL,
    base_name TEXT NOT NULL,
    base_code CITEXT UNIQUE NOT NULL,
    geopolitical_zone TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNITS
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
    unit_name TEXT NOT NULL,
    unit_code CITEXT NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_units_base_code UNIQUE (base_id, unit_code)
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('global_admin', 'base_admin', 'unit_admin', 'personnel_officer', 'viewer')),
    base_id UUID REFERENCES public.bases(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_role_scope UNIQUE (user_id, role, base_id, unit_id)
);

-- RETIREMENT_POLICIES
CREATE TABLE IF NOT EXISTS public.retirement_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name TEXT NOT NULL,
    retirement_age INT NOT NULL DEFAULT 60 CHECK (retirement_age BETWEEN 18 AND 100),
    maximum_service_years INT NOT NULL DEFAULT 35 CHECK (maximum_service_years BETWEEN 1 AND 80),
    notice_months INT NOT NULL DEFAULT 2 CHECK (notice_months BETWEEN 1 AND 24),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PERSONNEL
CREATE TABLE IF NOT EXISTS public.personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_number CITEXT UNIQUE NOT NULL,
    surname TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    rank TEXT NOT NULL,
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
    date_of_first_appointment DATE NOT NULL CHECK (date_of_first_appointment >= date_of_birth),
    base_id UUID REFERENCES public.bases(id) ON DELETE RESTRICT,
    unit_id UUID REFERENCES public.units(id) ON DELETE RESTRICT,
    retirement_policy_id UUID REFERENCES public.retirement_policies(id) ON DELETE SET NULL,
    retirement_date DATE,
    employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'retiring_soon', 'retired', 'inactive', 'incomplete_data')),
    
    apf_no CITEXT,
    ap_no CITEXT,
    service_no CITEXT,
    full_name TEXT,
    name TEXT,
    state_of_origin TEXT,
    lga TEXT,
    tribe TEXT,
    geopolitical_zone TEXT,
    geo_pol_zone TEXT,
    date_of_enlistment DATE,
    enlist_date DATE,
    date_of_last_promotion DATE,
    last_prom_date DATE,
    command_served_last TEXT,
    date_transferred_to_command DATE,
    transferred_date DATE,
    educational_qualification TEXT,
    edu_qual TEXT,
    gd_sp TEXT,
    grade_level TEXT,
    gl TEXT,
    duty_post TEXT,
    employee_code CITEXT UNIQUE,
    calculated_retirement_date DATE,
    retirement_basis TEXT,
    retirement_status TEXT,
    retirement_override_reason TEXT,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL DEFAULT 'RETIREMENT_2M_ALERT',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    retirement_date_snapshot DATE NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    email_status TEXT DEFAULT 'PENDING' CHECK (email_status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
    email_sent_at TIMESTAMPTZ,
    delivery_attempts INT DEFAULT 0,
    last_error TEXT,
    CONSTRAINT uq_notification_alert UNIQUE (recipient_user_id, personnel_id, notification_type, retirement_date_snapshot)
);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
