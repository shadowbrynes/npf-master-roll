-- Migration: 20260806180000_ensure_equipment_rls_and_policies.sql
-- Description: Grant full equipment registration permissions to global_admin, state_admin, unit_admin, and equipment_officer

ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read equipment_categories" ON public.equipment_categories;
CREATE POLICY "Anyone can read equipment_categories" ON public.equipment_categories
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized roles manage equipment_categories" ON public.equipment_categories;
CREATE POLICY "Authorized roles manage equipment_categories" ON public.equipment_categories
FOR ALL TO authenticated USING (
    public.is_global_admin() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'logistics_officer')
    )
)
WITH CHECK (
    public.is_global_admin() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'logistics_officer')
    )
);

DROP POLICY IF EXISTS "Anyone authenticated can read equipment_items" ON public.equipment_items;
CREATE POLICY "Anyone authenticated can read equipment_items" ON public.equipment_items
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorized roles manage equipment_items" ON public.equipment_items;
CREATE POLICY "Authorized roles manage equipment_items" ON public.equipment_items
FOR ALL TO authenticated
USING (
    public.is_global_admin() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'logistics_officer')
    )
)
WITH CHECK (
    public.is_global_admin() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'logistics_officer')
    )
);
