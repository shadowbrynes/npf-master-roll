-- Update CHECK constraint on dashboard_assets to allow 'background' and 'dashboard_display'
ALTER TABLE public.dashboard_assets
DROP CONSTRAINT IF EXISTS dashboard_assets_image_type_check;

ALTER TABLE public.dashboard_assets
ADD CONSTRAINT dashboard_assets_image_type_check
CHECK (image_type IN ('background', 'dashboard_background', 'dashboard_display', 'display', 'blended_hero', 'logo', 'badge'));
