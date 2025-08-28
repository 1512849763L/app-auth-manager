-- Update current user to admin role
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE id = '5740ddc0-f018-432b-875e-50486a380540';