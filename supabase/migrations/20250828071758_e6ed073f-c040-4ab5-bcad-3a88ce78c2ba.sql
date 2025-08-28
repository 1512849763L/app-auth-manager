-- Create system settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system settings
CREATE POLICY "管理员可以查看所有系统设置" 
ON public.system_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

CREATE POLICY "管理员可以管理所有系统设置" 
ON public.system_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Insert default payment settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('yipay_merchant_id', '', '易支付商户ID', 'payment'),
('yipay_merchant_key', '', '易支付商户密钥', 'payment'),
('yipay_api_url', '', '易支付API地址', 'payment'),
('yipay_callback_url', '', '易支付回调地址', 'payment'),
('yipay_enabled', 'false', '是否启用易支付', 'payment'),
('system_name', '卡密授权系统', '系统名称', 'general'),
('system_logo', '', '系统Logo地址', 'general'),
('auto_approve_orders', 'false', '是否自动审批订单', 'general'),
('default_card_duration', '30', '默认卡密有效期(天)', 'general');

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();