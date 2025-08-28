-- Fix handle_new_user function to handle duplicate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Get the base username from metadata or email
  base_username := COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1));
  final_username := base_username;
  
  -- Check if username already exists and find a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::text;
    counter := counter + 1;
  END LOOP;
  
  -- Insert the profile with the unique username
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, final_username, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;