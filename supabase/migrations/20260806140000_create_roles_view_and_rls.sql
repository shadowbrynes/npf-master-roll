-- =============================================================================
-- Migration: 20260806140000_create_roles_view_and_rls.sql
-- Description: Create roles compatibility view and RLS policies for role lookup
-- =============================================================================

-- 1. Ensure user_roles has proper RLS for authenticated user role lookup
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_global_admin());

-- 2. Drop legacy table roles if present and create roles view pointing to user_roles
DROP TABLE IF EXISTS public.roles CASCADE;

CREATE OR REPLACE VIEW public.roles AS
SELECT 
    id,
    user_id,
    role,
    base_id,
    unit_id,
    created_at,
    updated_at
FROM public.user_roles;

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO anon;

-- 3. Ensure Global Administrator role assignment for naijajournal@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('6f5aa742-6583-4818-8d33-3c867cb7656d'::uuid, 'global_admin')
ON CONFLICT (user_id, role, base_id, unit_id) DO NOTHING;

UPDATE public.profiles
SET role = 'global_admin', financial_access_granted = true
WHERE id = '6f5aa742-6583-4818-8d33-3c867cb7656d'::uuid;
