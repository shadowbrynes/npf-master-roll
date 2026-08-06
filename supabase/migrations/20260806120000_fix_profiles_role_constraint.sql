-- Fix profiles role check constraint for Global Admin role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('global_admin', 'state_admin', 'unit_admin', 'equipment_officer', 'personnel', 'auditor', 'super_admin'));
