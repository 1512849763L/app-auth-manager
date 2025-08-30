-- Fix the SECURITY DEFINER view security issue

-- Remove the problematic view
DROP VIEW IF EXISTS public.public_programs;

-- Update the get_public_programs function to be more secure with proper search_path
CREATE OR REPLACE FUNCTION public.get_public_programs()
RETURNS TABLE(id uuid, name text, description text, price numeric, status text, version text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.status,
    p.version,
    p.created_at,
    p.updated_at
  FROM public.programs p
  WHERE p.status = 'active';
$$;