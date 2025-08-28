-- 添加邮箱配置相关的系统设置
INSERT INTO public.system_settings (key, value, description, category) VALUES
('email_enabled', 'true', '启用邮件服务', 'email'),
('email_service_provider', 'resend', '邮件服务提供商', 'email'),
('email_from_name', '卡密管理系统', '发件人名称', 'email'),
('email_from_address', 'noreply@yourdomain.com', '发件人邮箱地址', 'email'),
('email_reply_to', '', '回复邮箱地址', 'email'),
('email_welcome_enabled', 'true', '启用欢迎邮件', 'email'),
('email_expiry_enabled', 'true', '启用到期提醒邮件', 'email'),
('email_expiry_days', '7,3,1', '到期提醒天数（逗号分隔）', 'email'),
('email_daily_report_enabled', 'false', '启用每日邮件报告', 'email'),
('email_test_address', '', '测试邮件接收地址', 'email')
ON CONFLICT (key) DO NOTHING;