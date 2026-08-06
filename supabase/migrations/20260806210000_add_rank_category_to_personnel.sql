-- =============================================================================
-- Migration: 20260806210000_add_rank_category_to_personnel.sql
-- Description: Add rank_category column, trigger, and migration to segment personnel
-- =============================================================================

-- 1. Add rank_category column
ALTER TABLE public.personnel
ADD COLUMN IF NOT EXISTS rank_category TEXT DEFAULT 'PC_INSPECTOR' CHECK (rank_category IN ('PC_INSPECTOR', 'ASP_DSP', 'CSP_CP'));

-- 2. Rank classification function
CREATE OR REPLACE FUNCTION public.get_rank_category(p_rank TEXT)
RETURNS TEXT AS $$
DECLARE
  r TEXT := UPPER(TRIM(COALESCE(p_rank, '')));
BEGIN
  IF r IN ('CSP', 'ACP', 'DCP', 'CP', 'AIG', 'DIG', 'IGP', 'SP', 'CHIEF SUPERINTENDENT', 'SUPERINTENDENT', 'ASSISTANT COMMISSIONER', 'DEPUTY COMMISSIONER', 'COMMISSIONER OF POLICE') OR r LIKE '%CSP%' OR r LIKE '%COMMISSIONER%' OR r LIKE '%CHIEF SUPERINTENDENT%' THEN
    RETURN 'CSP_CP';
  ELSIF r IN ('ASP', 'ASP I', 'ASP II', 'DSP', 'ASSISTANT SUPERINTENDENT', 'DEPUTY SUPERINTENDENT') OR r LIKE '%ASP%' OR r LIKE '%DSP%' THEN
    RETURN 'ASP_DSP';
  ELSE
    RETURN 'PC_INSPECTOR';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger to calculate rank_category automatically
CREATE OR REPLACE FUNCTION public.trigger_set_rank_category()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank_category := public.get_rank_category(NEW.rank);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_rank_category ON public.personnel;
CREATE TRIGGER trg_set_rank_category
BEFORE INSERT OR UPDATE OF rank ON public.personnel
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_rank_category();

-- 4. Backfill existing records
UPDATE public.personnel
SET rank_category = public.get_rank_category(rank);
