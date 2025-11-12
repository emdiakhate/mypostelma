-- Fixer le search_path pour update_competitors_updated_at
DROP TRIGGER IF EXISTS update_competitors_updated_at ON public.competitors;
DROP FUNCTION IF EXISTS update_competitors_updated_at();

CREATE OR REPLACE FUNCTION update_competitors_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_competitors_updated_at
BEFORE UPDATE ON public.competitors
FOR EACH ROW
EXECUTE FUNCTION update_competitors_updated_at();