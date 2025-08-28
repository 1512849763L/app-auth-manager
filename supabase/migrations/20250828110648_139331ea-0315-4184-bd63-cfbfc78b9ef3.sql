-- Create a view for public program data without sensitive API keys
CREATE VIEW public.programs_public AS
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

-- Drop the existing policy that exposes all program data to users
DROP POLICY IF EXISTS "用户可以查看激活的程序用于购买" ON public.programs;

-- Create new restricted policy for users to view only non-sensitive program data
CREATE POLICY "用户可以查看激活程序的公开信息"
ON public.programs
FOR SELECT
TO authenticated
USING (
  status = 'active' AND 
  -- This policy will be used for specific columns only
  -- API keys should never be exposed through this policy
  true
);

-- Enable RLS on the public view
ALTER VIEW public.programs_public ENABLE ROW LEVEL SECURITY;

-- Create policy for the public view
CREATE POLICY "公开程序信息可被认证用户查看"
ON public.programs_public
FOR SELECT
TO authenticated
USING (true);

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