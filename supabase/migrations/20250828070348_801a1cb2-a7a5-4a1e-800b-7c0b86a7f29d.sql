-- 修复RLS策略的无限递归问题
-- 首先删除有问题的策略
DROP POLICY IF EXISTS "管理员可以查看所有资料" ON public.profiles;
DROP POLICY IF EXISTS "管理员可以更新所有资料" ON public.profiles;

-- 创建安全定义函数来获取当前用户角色，避免递归
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 修复函数的search_path问题
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_card_key()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i % 4 = 0 AND i < 16 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 重新创建正确的策略
CREATE POLICY "管理员可以查看所有资料" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "管理员可以更新所有资料" ON public.profiles
FOR UPDATE USING (public.get_current_user_role() = 'admin');