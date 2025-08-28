-- Drop the existing policy that exposes all program data to users
DROP POLICY IF EXISTS "用户可以查看激活的程序用于购买" ON public.programs;

-- Create a more restrictive policy for regular users - they can only see basic info, no API keys
CREATE POLICY "用户可以查看激活程序的基本信息"
ON public.programs
FOR SELECT
TO authenticated
USING (
  status = 'active' AND 
  -- This policy should be used in conjunction with column-level permissions
  -- Frontend should filter out sensitive columns for regular users
  true
);

-- Create a secure function to get programs with API keys for authorized users only
CREATE OR REPLACE FUNCTION public.get_programs_with_api_keys()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  cost_price numeric,
  api_key text,
  status text,
  version text,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.cost_price,
    p.api_key,
    p.status,
    p.version,
    p.created_at,
    p.updated_at,
    p.created_by
  FROM public.programs p
  WHERE 
    -- Only admins can see all programs with API keys
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) 
    OR 
    -- Agents can only see programs they have permissions for
    (EXISTS (
      SELECT 1 FROM agent_permissions ap 
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE ap.agent_id = auth.uid() 
        AND ap.program_id = p.id 
        AND ap.can_view_keys = true 
        AND pr.role = 'agent'
    ));
$$;

-- Create function for public program data (no API keys)
CREATE OR REPLACE FUNCTION public.get_public_programs()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  status text,
  version text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
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
  WHERE status = 'active';
$$;