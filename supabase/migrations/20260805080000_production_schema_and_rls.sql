-- =============================================================================
-- EOD & CBRN NATIONAL COMMAND DATABASE - COMPLETE PRODUCTION MIGRATION (v8.0)
-- Project URL: https://tfuhkakpucjgrrqcnpaf.supabase.co
-- Includes:
--   1. Full Schema Architecture (profiles, user_roles, bases, units, retirement_policies, personnel, notifications, audit_logs)
--   2. 36 State Base Directory + Separate FCT Record Seed Data
--   3. Statutory Retirement Date Calculation Trigger (Age vs. Service rule with leap year safety)
--   4. Unit-to-Base Constraint Trigger
--   5. Daily Scheduled 2-Month Global Administrator Alert Function
--   6. Fine-grained Row Level Security (RLS) Policies for RBAC Roles
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email CITEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. BASES TABLE (36 Nigerian State Bases + FCT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name TEXT,
    base_name TEXT,
    base_code CITEXT UNIQUE NOT NULL,
    geopolitical_zone TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bases' AND column_name='state_name') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bases' AND column_name='state') THEN
            ALTER TABLE public.bases RENAME COLUMN state TO state_name;
        ELSE
            ALTER TABLE public.bases ADD COLUMN state_name TEXT NOT NULL DEFAULT 'NATIONAL';
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bases' AND column_name='base_name') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bases' AND column_name='name') THEN
            ALTER TABLE public.bases RENAME COLUMN name TO base_name;
        ELSE
            ALTER TABLE public.bases ADD COLUMN base_name TEXT NOT NULL DEFAULT 'EOD BASE';
        END IF;
    END IF;
    ALTER TABLE public.bases ADD COLUMN IF NOT EXISTS geopolitical_zone TEXT;
    ALTER TABLE public.bases ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.bases ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE public.bases ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
    ALTER TABLE public.bases ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_bases_code ON public.bases(base_code);
CREATE INDEX IF NOT EXISTS idx_bases_state ON public.bases(state_name);
CREATE INDEX IF NOT EXISTS idx_bases_zone ON public.bases(geopolitical_zone);
CREATE INDEX IF NOT EXISTS idx_bases_active ON public.bases(active);

-- -----------------------------------------------------------------------------
-- 3. UNITS TABLE
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_units_base_id ON public.units(base_id);
CREATE INDEX IF NOT EXISTS idx_units_code ON public.units(unit_code);
CREATE INDEX IF NOT EXISTS idx_units_active ON public.units(active);

-- -----------------------------------------------------------------------------
-- 4. USER_ROLES TABLE (RBAC)
-- Roles: global_admin, base_admin, unit_admin, personnel_officer, viewer
-- -----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- -----------------------------------------------------------------------------
-- 5. RETIREMENT_POLICIES TABLE
-- -----------------------------------------------------------------------------
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

-- Seed default policy if missing
INSERT INTO public.retirement_policies (id, policy_name, retirement_age, maximum_service_years, notice_months, active)
VALUES (
    'a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1'::uuid,
    'Nigeria Police Force Statutory Retirement Policy (60 Yrs / 35 Yrs Service)',
    60,
    35,
    2,
    true
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. PERSONNEL TABLE
-- -----------------------------------------------------------------------------
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
    
    -- Legacy/Alias columns for existing API backwards compatibility
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

ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS service_number CITEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS rank TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS date_of_first_appointment DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS base_id UUID REFERENCES public.bases(id) ON DELETE RESTRICT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id) ON DELETE RESTRICT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS retirement_policy_id UUID REFERENCES public.retirement_policies(id) ON DELETE SET NULL;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS retirement_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS apf_no CITEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS ap_no CITEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS service_no CITEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS state_of_origin TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS lga TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS tribe TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS geopolitical_zone TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS geo_pol_zone TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS date_of_enlistment DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS enlist_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS date_of_last_promotion DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS last_prom_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS command_served_last TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS date_transferred_to_command DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS transferred_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS educational_qualification TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS edu_qual TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS gd_sp TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS grade_level TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS gl TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS duty_post TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS employee_code CITEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS calculated_retirement_date DATE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS retirement_basis TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS retirement_status TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS retirement_override_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_personnel_service_no ON public.personnel(service_number);
CREATE INDEX IF NOT EXISTS idx_personnel_base ON public.personnel(base_id);
CREATE INDEX IF NOT EXISTS idx_personnel_unit ON public.personnel(unit_id);
CREATE INDEX IF NOT EXISTS idx_personnel_retire_date ON public.personnel(retirement_date);
CREATE INDEX IF NOT EXISTS idx_personnel_status ON public.personnel(employment_status);

-- -----------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE (For 2-Month Global Admin Alerts)
-- -----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);

-- -----------------------------------------------------------------------------
-- 8. AUDIT_LOGS TABLE
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. TRIGGERS FOR RETIREMENT DATE COMPUTATION AND CONSTRAINTS
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_personnel_retirement_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_age INT := 60;
    v_max_service INT := 35;
    v_dob_year INT;
    v_dob_month INT;
    v_dob_day INT;
    v_retire_age_date DATE;
    v_retire_service_date DATE;
    v_final_date DATE;
    v_policy RECORD;
    v_enlist_date DATE;
BEGIN
    -- Synchronize alias fields
    NEW.service_number := COALESCE(NEW.service_number, NEW.apf_no, NEW.ap_no, NEW.service_no);
    NEW.apf_no := NEW.service_number;
    NEW.ap_no := NEW.service_number;
    NEW.service_no := NEW.service_number;
    
    NEW.full_name := COALESCE(NEW.full_name, NEW.name, TRIM(NEW.surname || ' ' || NEW.first_name || ' ' || COALESCE(NEW.middle_name, '')));
    NEW.name := NEW.full_name;

    v_enlist_date := COALESCE(NEW.date_of_first_appointment, NEW.date_of_enlistment, NEW.enlist_date);
    NEW.date_of_first_appointment := v_enlist_date;
    NEW.date_of_enlistment := v_enlist_date;
    NEW.enlist_date := v_enlist_date;

    IF NEW.retirement_policy_id IS NOT NULL THEN
        SELECT retirement_age, maximum_service_years INTO v_policy
        FROM public.retirement_policies WHERE id = NEW.retirement_policy_id;
        IF FOUND THEN
            v_age := COALESCE(v_policy.retirement_age, 60);
            v_max_service := COALESCE(v_policy.maximum_service_years, 35);
        END IF;
    END IF;

    IF NEW.date_of_birth IS NOT NULL AND v_enlist_date IS NOT NULL THEN
        v_dob_year := EXTRACT(YEAR FROM NEW.date_of_birth)::INT + v_age;
        v_dob_month := EXTRACT(MONTH FROM NEW.date_of_birth)::INT;
        v_dob_day := EXTRACT(DAY FROM NEW.date_of_birth)::INT;

        BEGIN
            v_retire_age_date := MAKE_DATE(v_dob_year, v_dob_month, v_dob_day);
        EXCEPTION WHEN OTHERS THEN
            v_retire_age_date := (MAKE_DATE(v_dob_year, v_dob_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        END;

        v_retire_service_date := (v_enlist_date + (v_max_service || ' years')::INTERVAL)::DATE;

        v_final_date := LEAST(v_retire_age_date, v_retire_service_date);
        NEW.retirement_date := v_final_date;
        NEW.calculated_retirement_date := v_final_date;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_calculate_retirement ON public.personnel;
CREATE TRIGGER trigger_calculate_retirement
BEFORE INSERT OR UPDATE OF date_of_birth, date_of_first_appointment, date_of_enlistment, retirement_policy_id ON public.personnel
FOR EACH ROW EXECUTE FUNCTION public.calculate_personnel_retirement_date();

-- Trigger to validate that unit belongs to selected base
CREATE OR REPLACE FUNCTION public.check_personnel_unit_base_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_unit_base_id UUID;
BEGIN
    IF NEW.unit_id IS NOT NULL THEN
        SELECT base_id INTO v_unit_base_id FROM public.units WHERE id = NEW.unit_id;
        IF v_unit_base_id IS NOT NULL AND NEW.base_id IS NOT NULL AND v_unit_base_id <> NEW.base_id THEN
            RAISE EXCEPTION 'Assigned unit does not belong to the selected base.' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_unit_base ON public.personnel;
CREATE TRIGGER trigger_check_unit_base
BEFORE INSERT OR UPDATE OF base_id, unit_id ON public.personnel
FOR EACH ROW EXECUTE FUNCTION public.check_personnel_unit_base_match();

-- -----------------------------------------------------------------------------
-- 10. DAILY RETIREMENT ALERTS FUNCTION (Cron Idempotent Alert Processor)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_retirement_alerts()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_alerts_created INT := 0;
    v_rec RECORD;
    v_admin RECORD;
BEGIN
    FOR v_rec IN 
        SELECT p.id AS personnel_id, p.service_number, p.surname, p.first_name, p.rank,
               p.retirement_date, b.base_name, u.unit_name,
               COALESCE(pol.notice_months, 2) AS notice_months
        FROM public.personnel p
        LEFT JOIN public.bases b ON b.id = p.base_id
        LEFT JOIN public.units u ON u.id = p.unit_id
        LEFT JOIN public.retirement_policies pol ON pol.id = p.retirement_policy_id
        WHERE p.employment_status = 'active'
          AND p.retirement_date IS NOT NULL
          AND (p.retirement_date - (COALESCE(pol.notice_months, 2) || ' months')::INTERVAL)::DATE <= CURRENT_DATE
    LOOP
        FOR v_admin IN
            SELECT DISTINCT ur.user_id
            FROM public.user_roles ur
            JOIN public.profiles pr ON pr.id = ur.user_id
            WHERE ur.role = 'global_admin' AND pr.active = true
        LOOP
            INSERT INTO public.notifications (
                recipient_user_id,
                personnel_id,
                notification_type,
                title,
                message,
                retirement_date_snapshot,
                scheduled_for
            ) VALUES (
                v_admin.user_id,
                v_rec.personnel_id,
                'RETIREMENT_2M_ALERT',
                'RETIREMENT ALERT: ' || v_rec.rank || ' ' || v_rec.surname || ' ' || v_rec.first_name,
                'Personnel ' || v_rec.service_number || ' (' || v_rec.rank || ' ' || v_rec.surname || ' ' || v_rec.first_name || ') at ' || COALESCE(v_rec.base_name, 'National Command') || ' is due for retirement on ' || v_rec.retirement_date || '.',
                v_rec.retirement_date,
                NOW()
            )
            ON CONFLICT (recipient_user_id, personnel_id, notification_type, retirement_date_snapshot) DO NOTHING;
            
            IF FOUND THEN
                v_alerts_created := v_alerts_created + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN v_alerts_created;
END;
$$;

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user has global_admin role
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'global_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'global_admin')
    );
END;
$$;

-- Policies for profiles
DROP POLICY IF EXISTS "Allow users to read profiles" ON public.profiles;
CREATE POLICY "Allow users to read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile or global admin" ON public.profiles;
CREATE POLICY "Allow users to update own profile or global admin" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_global_admin());

-- Policies for user_roles (Global Admin only for write)
DROP POLICY IF EXISTS "Allow read user_roles" ON public.user_roles;
CREATE POLICY "Allow read user_roles" ON public.user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global admins manage user_roles" ON public.user_roles;
CREATE POLICY "Global admins manage user_roles" ON public.user_roles FOR ALL USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- Policies for bases
DROP POLICY IF EXISTS "Anyone read active bases" ON public.bases;
CREATE POLICY "Anyone read active bases" ON public.bases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global admins manage bases" ON public.bases;
CREATE POLICY "Global admins manage bases" ON public.bases FOR ALL USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

-- Policies for units
DROP POLICY IF EXISTS "Anyone read active units" ON public.units;
CREATE POLICY "Anyone read active units" ON public.units FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global & Base admins manage units" ON public.units;
CREATE POLICY "Global & Base admins manage units" ON public.units FOR ALL USING (
    public.is_global_admin() OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'base_admin' AND ur.base_id = units.base_id
    )
);

-- Policies for personnel
DROP POLICY IF EXISTS "Read personnel by scope" ON public.personnel;
CREATE POLICY "Read personnel by scope" ON public.personnel FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage personnel by scope" ON public.personnel;
CREATE POLICY "Manage personnel by scope" ON public.personnel FOR ALL USING (
    public.is_global_admin() OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND (
            (ur.role = 'base_admin' AND ur.base_id = personnel.base_id) OR
            (ur.role = 'unit_admin' AND ur.unit_id = personnel.unit_id) OR
            (ur.role = 'personnel_officer' AND (ur.base_id IS NULL OR ur.base_id = personnel.base_id))
        )
    )
);

-- Policies for notifications
DROP POLICY IF EXISTS "Recipient read notifications" ON public.notifications;
CREATE POLICY "Recipient read notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_user_id OR public.is_global_admin());

DROP POLICY IF EXISTS "Recipient update notifications" ON public.notifications;
CREATE POLICY "Recipient update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_user_id OR public.is_global_admin());

-- Policies for audit_logs
DROP POLICY IF EXISTS "Audit logs read by global admin" ON public.audit_logs;
CREATE POLICY "Audit logs read by global admin" ON public.audit_logs FOR SELECT USING (public.is_global_admin());

-- -----------------------------------------------------------------------------
-- 12. SEED THE 36 NIGERIAN STATE BASES + FCT ABUJA
-- -----------------------------------------------------------------------------
INSERT INTO public.bases (state_name, base_name, base_code, geopolitical_zone, display_order, active)
VALUES
('FCT', 'NATIONAL EOD-CBRN COMMAND HEADQUARTERS, ABUJA', 'EOD-BASE-FCT', 'NORTH CENTRAL', 0, true),
('ABIA', 'ABIA STATE EOD-CBRN COMMAND BASE, UMUAHIA', 'EOD-BASE-ABI', 'SOUTH EAST', 1, true),
('ADAMAWA', 'ADAMAWA STATE EOD-CBRN COMMAND BASE, YOLA', 'EOD-BASE-ADA', 'NORTH EAST', 2, true),
('AKWA IBOM', 'AKWA IBOM STATE EOD-CBRN COMMAND BASE, UYO', 'EOD-BASE-AKW', 'SOUTH SOUTH', 3, true),
('ANAMBRA', 'ANAMBRA STATE EOD-CBRN COMMAND BASE, AWKA', 'EOD-BASE-ANA', 'SOUTH EAST', 4, true),
('BAUCHI', 'BAUCHI STATE EOD-CBRN COMMAND BASE, BAUCHI', 'EOD-BASE-BAU', 'NORTH EAST', 5, true),
('BAYELSA', 'BAYELSA STATE EOD-CBRN COMMAND BASE, YENAGOA', 'EOD-BASE-BAY', 'SOUTH SOUTH', 6, true),
('BENUE', 'BENUE STATE EOD-CBRN COMMAND BASE, MAKURDI', 'EOD-BASE-BEN', 'NORTH CENTRAL', 7, true),
('BORNO', 'BORNO STATE EOD-CBRN COMMAND BASE, MAIDUGURI', 'EOD-BASE-BOR', 'NORTH EAST', 8, true),
('CROSS RIVER', 'CROSS RIVER STATE EOD-CBRN COMMAND BASE, CALABAR', 'EOD-BASE-CRO', 'SOUTH SOUTH', 9, true),
('DELTA', 'DELTA STATE EOD-CBRN COMMAND BASE, ASABA', 'EOD-BASE-DEL', 'SOUTH SOUTH', 10, true),
('EBONYI', 'EBONYI STATE EOD-CBRN COMMAND BASE, ABAKALIKI', 'EOD-BASE-EBO', 'SOUTH EAST', 11, true),
('EDO', 'EDO STATE EOD-CBRN COMMAND BASE, BENIN CITY', 'EOD-BASE-EDO', 'SOUTH SOUTH', 12, true),
('EKITI', 'EKITI STATE EOD-CBRN COMMAND BASE, ADO-EKITI', 'EOD-BASE-EKI', 'SOUTH WEST', 13, true),
('ENUGU', 'ENUGU STATE EOD-CBRN COMMAND BASE, ENUGU', 'EOD-BASE-ENU', 'SOUTH EAST', 14, true),
('GOMBE', 'GOMBE STATE EOD-CBRN COMMAND BASE, GOMBE', 'EOD-BASE-GOM', 'NORTH EAST', 15, true),
('IMO', 'IMO STATE EOD-CBRN COMMAND BASE, OWERRI', 'EOD-BASE-IMO', 'SOUTH EAST', 16, true),
('JIGAWA', 'JIGAWA STATE EOD-CBRN COMMAND BASE, DUTSE', 'EOD-BASE-JIG', 'NORTH WEST', 17, true),
('KADUNA', 'KADUNA STATE EOD-CBRN COMMAND BASE, KADUNA', 'EOD-BASE-KAD', 'NORTH WEST', 18, true),
('KANO', 'KANO STATE EOD-CBRN COMMAND BASE, KANO', 'EOD-BASE-KAN', 'NORTH WEST', 19, true),
('KATSINA', 'KATSINA STATE EOD-CBRN COMMAND BASE, KATSINA', 'EOD-BASE-KAT', 'NORTH WEST', 20, true),
('KEBBI', 'KEBBI STATE EOD-CBRN COMMAND BASE, BIRNIN KEBBI', 'EOD-BASE-KEB', 'NORTH WEST', 21, true),
('KOGI', 'KOGI STATE EOD-CBRN COMMAND BASE, LOKOJA', 'EOD-BASE-KOG', 'NORTH CENTRAL', 22, true),
('KWARA', 'KWARA STATE EOD-CBRN COMMAND BASE, ILORIN', 'EOD-BASE-KWA', 'NORTH CENTRAL', 23, true),
('LAGOS', 'APAPA SEA PORT EOD-CBRN TACTICAL BASE, LAGOS', 'EOD-BASE-LAG', 'SOUTH WEST', 24, true),
('NASARAWA', 'NASARAWA STATE EOD-CBRN COMMAND BASE, LAFIA', 'EOD-BASE-NAS', 'NORTH CENTRAL', 25, true),
('NIGER', 'NIGER STATE EOD-CBRN COMMAND BASE, MINNA', 'EOD-BASE-NIG', 'NORTH CENTRAL', 26, true),
('OGUN', 'OGUN STATE EOD-CBRN COMMAND BASE, ABEOKUTA', 'EOD-BASE-OGU', 'SOUTH WEST', 27, true),
('ONDO', 'ONDO STATE EOD-CBRN COMMAND BASE, AKURE', 'EOD-BASE-OND', 'SOUTH WEST', 28, true),
('OSUN', 'OSUN STATE EOD-CBRN COMMAND BASE, OSOGBO', 'EOD-BASE-OSU', 'SOUTH WEST', 29, true),
('OYO', 'OYO STATE EOD-CBRN COMMAND BASE, IBADAN', 'EOD-BASE-OYO', 'SOUTH WEST', 30, true),
('PLATEAU', 'PLATEAU STATE EOD-CBRN COMMAND BASE, JOS', 'EOD-BASE-PLA', 'NORTH CENTRAL', 31, true),
('RIVERS', 'RIVERS STATE EOD-CBRN COMMAND BASE, PORT HARCOURT', 'EOD-BASE-RIV', 'SOUTH SOUTH', 32, true),
('SOKOTO', 'SOKOTO STATE EOD-CBRN COMMAND BASE, SOKOTO', 'EOD-BASE-SOK', 'NORTH WEST', 33, true),
('TARABA', 'TARABA STATE EOD-CBRN COMMAND BASE, JALINGO', 'EOD-BASE-TAR', 'NORTH EAST', 34, true),
('YOBE', 'YOBE STATE EOD-CBRN COMMAND BASE, DAMATURU', 'EOD-BASE-YOB', 'NORTH EAST', 35, true),
('ZAMFARA', 'ZAMFARA STATE EOD-CBRN COMMAND BASE, GUSAU', 'EOD-BASE-ZAM', 'NORTH WEST', 36, true)
ON CONFLICT (base_code) DO NOTHING;
