-- Extension
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Helpers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_support()
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.get_my_role();
  RETURN v_role IN ('admin', 'support');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
DECLARE
  v_year text;
  v_seq integer;
  v_result text;
BEGIN
  v_year := to_char(now(), 'YYYY');
  v_seq := nextval('public.order_number_seq');
  v_result := 'WZ-' || v_year || '-' || lpad(v_seq::text, 6, '0');
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
