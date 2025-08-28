-- 启用pg_cron扩展（用于定时任务）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 启用pg_net扩展（用于HTTP请求）
CREATE EXTENSION IF NOT EXISTS pg_net;

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