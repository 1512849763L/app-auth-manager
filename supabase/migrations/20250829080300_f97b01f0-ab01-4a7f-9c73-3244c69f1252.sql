-- 首先删除名为"123"的程序相关的订单
DELETE FROM orders WHERE program_id = '05eedfc0-82ab-4288-b7c1-ba001476e7a9';

-- 删除相关的卡密
DELETE FROM card_keys WHERE program_id = '05eedfc0-82ab-4288-b7c1-ba001476e7a9';

-- 删除相关的代理权限
DELETE FROM agent_permissions WHERE program_id = '05eedfc0-82ab-4288-b7c1-ba001476e7a9';

-- 现在删除程序
DELETE FROM programs WHERE id = '05eedfc0-82ab-4288-b7c1-ba001476e7a9';

-- 添加套餐配置表
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有套餐配置
CREATE POLICY "管理员可以管理所有套餐配置" 
ON public.subscription_packages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- 用户可以查看激活的套餐
CREATE POLICY "用户可以查看激活的套餐" 
ON public.subscription_packages 
FOR SELECT 
USING (is_active = true);

-- 创建更新时间触发器
CREATE TRIGGER update_subscription_packages_updated_at
BEFORE UPDATE ON public.subscription_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 插入默认套餐配置
INSERT INTO public.subscription_packages (name, description, duration_days, price_multiplier, sort_order) VALUES
('1天体验版', '短期体验，适合测试', 1, 0.1, 1),
('7天短期版', '一周时长，适合短期使用', 7, 0.5, 2),
('30天标准版', '标准月卡，最常用套餐', 30, 1.0, 3),
('90天季度版', '三个月时长，性价比高', 90, 2.5, 4),
('365天年度版', '全年时长，最大优惠', 365, 8.0, 5);