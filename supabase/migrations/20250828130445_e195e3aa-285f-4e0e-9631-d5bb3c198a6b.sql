-- 创建文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('avatars', 'avatars', true, 5242880, '{"image/jpeg","image/png","image/webp"}'),
  ('system-assets', 'system-assets', true, 10485760, '{"image/jpeg","image/png","image/webp","image/ico","image/x-icon"}');

-- 创建头像存储策略
CREATE POLICY "公开读取头像" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "用户可上传自己的头像" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "用户可更新自己的头像" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "用户可删除自己的头像" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 创建系统资源存储策略
CREATE POLICY "公开读取系统资源" ON storage.objects
FOR SELECT USING (bucket_id = 'system-assets');

CREATE POLICY "管理员可管理系统资源" ON storage.objects
FOR ALL USING (
  bucket_id = 'system-assets' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 为profiles表添加头像字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 添加网站图标系统设置
INSERT INTO system_settings (key, value, description, category) 
VALUES 
  ('site_favicon_url', '', '网站图标URL', 'general'),
  ('site_logo_url', '', '网站Logo URL', 'general')
ON CONFLICT (key) DO NOTHING;