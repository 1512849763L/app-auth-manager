-- 创建程序管理表
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  api_key TEXT NOT NULL UNIQUE,
  version TEXT DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建卡密表
CREATE TABLE public.card_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_key TEXT NOT NULL UNIQUE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired', 'banned')),
  expire_at TIMESTAMP WITH TIME ZONE,
  duration_days INTEGER DEFAULT 30,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建代理权限表
CREATE TABLE public.agent_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  can_generate_keys BOOLEAN DEFAULT true,
  can_view_keys BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, program_id)
);

-- 创建订单表
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  program_id UUID REFERENCES public.programs(id) NOT NULL,
  card_key_id UUID REFERENCES public.card_keys(id),
  amount DECIMAL(10,2) NOT NULL,
  cost_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_method TEXT DEFAULT 'balance',
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建余额记录表
CREATE TABLE public.balance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'consume', 'refund', 'commission')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_after DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用行级安全
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_records ENABLE ROW LEVEL SECURITY;

-- 创建程序表策略
CREATE POLICY "管理员可以查看所有程序" ON public.programs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "管理员可以管理所有程序" ON public.programs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "代理可以查看有权限的程序" ON public.programs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.agent_permissions ap 
    JOIN public.profiles p ON p.id = auth.uid() 
    WHERE ap.agent_id = auth.uid() AND ap.program_id = programs.id AND p.role = 'agent'
  )
);

-- 创建卡密表策略
CREATE POLICY "管理员可以查看所有卡密" ON public.card_keys FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "管理员可以管理所有卡密" ON public.card_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "代理可以查看有权限的卡密" ON public.card_keys FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.agent_permissions ap 
    JOIN public.profiles p ON p.id = auth.uid() 
    WHERE ap.agent_id = auth.uid() AND ap.program_id = card_keys.program_id AND p.role = 'agent'
  )
);

CREATE POLICY "代理可以生成有权限的卡密" ON public.card_keys FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agent_permissions ap 
    JOIN public.profiles p ON p.id = auth.uid() 
    WHERE ap.agent_id = auth.uid() AND ap.program_id = card_keys.program_id AND ap.can_generate_keys = true AND p.role = 'agent'
  )
);

-- 创建代理权限表策略
CREATE POLICY "管理员可以管理所有代理权限" ON public.agent_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "代理可以查看自己的权限" ON public.agent_permissions FOR SELECT USING (
  agent_id = auth.uid()
);

-- 创建订单表策略
CREATE POLICY "用户可以查看自己的订单" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "管理员可以查看所有订单" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 创建余额记录表策略
CREATE POLICY "用户可以查看自己的余额记录" ON public.balance_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "管理员可以查看所有余额记录" ON public.balance_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_keys_updated_at
  BEFORE UPDATE ON public.card_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 创建生成随机卡密的函数
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
$$ LANGUAGE plpgsql;