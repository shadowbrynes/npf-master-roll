-- =============================================================================
-- Migration: 20260806230000_command_management_master_enhancement.sql
-- Description: Command Intelligence, Personnel Profile, Training, Custody & Movement Tracking
-- =============================================================================

-- 1. Personnel Trainings Table
CREATE TABLE IF NOT EXISTS public.personnel_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE NOT NULL,
    course_name TEXT NOT NULL,
    category TEXT DEFAULT 'CBRN' CHECK (category IN ('CBRN', 'EOD', 'Bomb Disposal', 'Hazmat', 'Tactical', 'Leadership', 'Other')),
    provider TEXT,
    completion_date DATE,
    expiry_date DATE,
    certificate_storage_path TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending_verification')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Personnel Promotions History Table
CREATE TABLE IF NOT EXISTS public.personnel_promotions_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID REFERENCES public.personnel(id) ON DELETE CASCADE NOT NULL,
    previous_rank TEXT NOT NULL,
    new_rank TEXT NOT NULL,
    promotion_date DATE NOT NULL,
    authority TEXT,
    document_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Equipment Custody & Movement History Extensions
ALTER TABLE public.equipment_items
ADD COLUMN IF NOT EXISTS custodian_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS custodian_name TEXT,
ADD COLUMN IF NOT EXISTS custodian_rank TEXT,
ADD COLUMN IF NOT EXISTS custodian_service_no TEXT;

CREATE TABLE IF NOT EXISTS public.equipment_movement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment_items(id) ON DELETE CASCADE NOT NULL,
    asset_tag TEXT NOT NULL,
    previous_custodian_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    new_custodian_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
    previous_location TEXT,
    new_location TEXT,
    movement_date TIMESTAMPTZ DEFAULT now(),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    receiving_officer TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.personnel_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_promotions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_movement_history ENABLE ROW LEVEL SECURITY;

-- RLS: Trainings
DROP POLICY IF EXISTS "Authenticated users view trainings" ON public.personnel_trainings;
CREATE POLICY "Authenticated users view trainings" ON public.personnel_trainings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized manage trainings" ON public.personnel_trainings;
CREATE POLICY "Authorized manage trainings" ON public.personnel_trainings FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'personnel_officer'))
);

-- RLS: Promotions History
DROP POLICY IF EXISTS "Authenticated users view promotions" ON public.personnel_promotions_history;
CREATE POLICY "Authenticated users view promotions" ON public.personnel_promotions_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized manage promotions" ON public.personnel_promotions_history;
CREATE POLICY "Authorized manage promotions" ON public.personnel_promotions_history FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'personnel_officer'))
);

-- RLS: Equipment Movements
DROP POLICY IF EXISTS "Authenticated users view equipment movements" ON public.equipment_movement_history;
CREATE POLICY "Authenticated users view equipment movements" ON public.equipment_movement_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized insert equipment movements" ON public.equipment_movement_history;
CREATE POLICY "Authorized insert equipment movements" ON public.equipment_movement_history FOR INSERT TO authenticated WITH CHECK (
    public.is_global_admin() OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer'))
);
