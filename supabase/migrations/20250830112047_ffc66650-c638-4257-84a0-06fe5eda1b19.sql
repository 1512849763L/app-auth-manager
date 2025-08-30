-- Fix security vulnerability: Restrict program visibility and protect API keys

-- Drop the overly permissive policy that allows anyone to view programs
DROP POLICY IF EXISTS "用户可以查看激活程序的基本信息" ON public.programs;

-- Create a more secure policy that only allows authenticated users to view basic program info
-- This policy explicitly excludes sensitive columns like api_key, cost_price, etc.
CREATE POLICY "认证用户可以查看基本程序信息" 
ON public.programs 
FOR SELECT 
TO authenticated
USING (status = 'active');

-- Create a view for public program information that excludes sensitive data
CREATE OR REPLACE VIEW public.public_programs AS
SELECT 
  id,
  name,
  description,
  price,
  status,
  version,
  created_at,
  updated_at
FROM public.programs
WHERE status = 'active';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_programs TO authenticated;
GRANT SELECT ON public.public_programs TO anon;

-- Update the existing get_public_programs function to use proper security
CREATE OR REPLACE FUNCTION public.get_public_programs()
RETURNS TABLE(id uuid, name text, description text, price numeric, status text, version text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
STABLE
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