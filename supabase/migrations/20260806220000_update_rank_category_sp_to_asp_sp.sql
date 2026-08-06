-- =============================================================================
-- Migration: 20260806220000_update_rank_category_sp_to_asp_sp.sql
-- Description: Update rank_category check constraint to PC_INSPECTOR, ASP_SP, CSP_CP
-- =============================================================================

-- 1. Drop existing check constraint
ALTER TABLE public.personnel DROP CONSTRAINT IF EXISTS personnel_rank_category_check;

-- 2. Rank classification function
CREATE OR REPLACE FUNCTION public.get_rank_category(p_rank TEXT)
RETURNS TEXT AS $$
DECLARE
  r TEXT := UPPER(TRIM(COALESCE(p_rank, '')));
BEGIN
  IF r IN ('CSP', 'ACP', 'DCP', 'CP', 'AIG', 'DIG', 'IGP', 'CHIEF SUPERINTENDENT', 'ASSISTANT COMMISSIONER', 'DEPUTY COMMISSIONER', 'COMMISSIONER OF POLICE') OR r LIKE '%CSP%' OR r LIKE '%COMMISSIONER%' OR r LIKE '%CHIEF SUPERINTENDENT%' THEN
    RETURN 'CSP_CP';
  ELSIF r IN ('ASP', 'ASP I', 'ASP II', 'DSP', 'SP', 'SUPERINTENDENT', 'ASSISTANT SUPERINTENDENT', 'DEPUTY SUPERINTENDENT') OR r LIKE '%ASP%' OR r LIKE '%DSP%' OR r LIKE '%SUPERINTENDENT%' THEN
    RETURN 'ASP_SP';
  ELSE
    RETURN 'PC_INSPECTOR';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Update existing records FIRST
UPDATE public.personnel
SET rank_category = public.get_rank_category(rank);

-- 4. Add updated check constraint
ALTER TABLE public.personnel ADD CONSTRAINT personnel_rank_category_check CHECK (rank_category IN ('PC_INSPECTOR', 'ASP_SP', 'CSP_CP'));

-- 5. Trigger to calculate rank_category automatically
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
