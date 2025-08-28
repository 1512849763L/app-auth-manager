-- 创建邮箱验证码表
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 为邮箱和验证码创建索引
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_code ON public.email_verifications(verification_code);
CREATE INDEX idx_email_verifications_expires ON public.email_verifications(expires_at);

-- 启用RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略（暂时允许所有人访问，用于验证流程）
CREATE POLICY "任何人都可以创建验证码记录" 
ON public.email_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "任何人都可以查看和更新验证码记录" 
ON public.email_verifications 
FOR ALL 
USING (true);

-- 创建邮件发送记录表
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  card_id UUID REFERENCES public.card_keys(id),
  user_id UUID
);

-- 为邮件日志创建索引
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);

-- 启用RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有邮件日志
CREATE POLICY "管理员可以查看所有邮件日志" 
ON public.email_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 系统可以插入邮件日志
CREATE POLICY "系统可以插入邮件日志" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true);

-- 创建定时任务来检查即将到期的卡密（每天早上9点执行）
SELECT cron.schedule(
  'check-expiring-cards-daily',
  '0 9 * * *', -- 每天早上9点
  $$
  SELECT
    net.http_post(
        url:='https://sqcvacdpdjeooqyrblbu.supabase.co/functions/v1/check-expiring-cards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxY3ZhY2RwZGplb29xeXJibGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNjMzOTUsImV4cCI6MjA3MTkzOTM5NX0.XuaH6Q9OnWZIG-lnXORc8Y6XretmmynPCiaDNdf5NAA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);