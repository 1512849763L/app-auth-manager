-- 创建独立的API验证系统

-- 1. 创建API认证表，存储程序的公私钥对
CREATE TABLE IF NOT EXISTS public.api_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  public_key text NOT NULL UNIQUE,
  private_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "管理员可以管理所有API认证" 
ON public.api_credentials 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'::user_role
));

-- 代理可以查看有权限程序的API认证
CREATE POLICY "代理可以查看有权限的API认证" 
ON public.api_credentials 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM agent_permissions ap 
  JOIN profiles p ON p.id = auth.uid()
  WHERE ap.agent_id = auth.uid() 
    AND ap.program_id = api_credentials.program_id 
    AND ap.can_view_keys = true 
    AND p.role = 'agent'::user_role
));

-- 2. 创建独立的卡密验证函数（不需要Supabase auth）
CREATE OR REPLACE FUNCTION public.verify_card_simple(
  p_card_key text,
  p_public_key text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  card_record card_keys%ROWTYPE;
  program_record programs%ROWTYPE;
  api_credential_record api_credentials%ROWTYPE;
BEGIN
  -- 验证公钥是否存在
  SELECT * INTO api_credential_record 
  FROM api_credentials 
  WHERE public_key = p_public_key;
  
  IF api_credential_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'API认证失败：无效的公钥');
  END IF;
  
  -- 获取卡密记录
  SELECT * INTO card_record 
  FROM card_keys 
  WHERE card_key = p_card_key 
    AND program_id = api_credential_record.program_id
    AND status IN ('unused', 'used')
    AND (expire_at IS NULL OR expire_at > now());
  
  IF card_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '卡密无效或已过期');
  END IF;
  
  -- 获取程序信息
  SELECT * INTO program_record 
  FROM programs 
  WHERE id = card_record.program_id;
  
  IF program_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '程序不存在');
  END IF;
  
  -- 返回验证成功信息
  RETURN json_build_object(
    'success', true,
    'message', '验证成功',
    'valid', true,
    'expire_at', card_record.expire_at,
    'used_machines', card_record.used_machines,
    'max_machines', card_record.max_machines,
    'program_id', card_record.program_id,
    'program_name', program_record.name,
    'duration_days', card_record.duration_days
  );
END;
$$;

-- 3. 创建独立的机器码绑定函数（不需要Supabase auth）
CREATE OR REPLACE FUNCTION public.bind_machine_simple(
  p_card_key text,
  p_machine_code text,
  p_public_key text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  card_record card_keys%ROWTYPE;
  current_machine_count integer;
  api_credential_record api_credentials%ROWTYPE;
BEGIN
  -- 验证公钥是否存在
  SELECT * INTO api_credential_record 
  FROM api_credentials 
  WHERE public_key = p_public_key;
  
  IF api_credential_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'API认证失败：无效的公钥');
  END IF;
  
  -- 获取卡密记录
  SELECT * INTO card_record 
  FROM card_keys 
  WHERE card_key = p_card_key 
    AND program_id = api_credential_record.program_id
    AND status = 'unused'
    AND (expire_at IS NULL OR expire_at > now())
  FOR UPDATE;
  
  IF card_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '卡密无效或已过期');
  END IF;
  
  -- 检查机器码是否已经绑定
  IF p_machine_code = ANY(card_record.bound_machine_codes) THEN
    RETURN json_build_object(
      'success', true, 
      'message', '机器码已绑定',
      'already_bound', true
    );
  END IF;
  
  -- 获取当前绑定的机器数量
  current_machine_count := array_length(card_record.bound_machine_codes, 1);
  IF current_machine_count IS NULL THEN
    current_machine_count := 0;
  END IF;
  
  -- 检查是否超出机器数量限制
  IF card_record.max_machines IS NOT NULL AND current_machine_count >= card_record.max_machines THEN
    RETURN json_build_object(
      'success', false, 
      'message', '已达到最大机器数量限制: ' || card_record.max_machines
    );
  END IF;
  
  -- 添加机器码到绑定列表
  UPDATE card_keys 
  SET 
    bound_machine_codes = array_append(bound_machine_codes, p_machine_code),
    used_machines = current_machine_count + 1,
    status = 'used',
    used_at = CASE WHEN status = 'unused' THEN now() ELSE used_at END,
    updated_at = now()
  WHERE id = card_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', '机器码绑定成功',
    'used_machines', current_machine_count + 1,
    'max_machines', card_record.max_machines
  );
END;
$$;

-- 4. 创建生成API密钥对的函数
CREATE OR REPLACE FUNCTION public.generate_api_credentials(p_program_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  public_key_str text;
  private_key_str text;
  result_record api_credentials%ROWTYPE;
BEGIN
  -- 生成32位随机公钥（以PUB开头）  
  public_key_str := 'PUB' || upper(encode(gen_random_bytes(16), 'hex'));
  
  -- 生成64位随机私钥（以PRV开头）
  private_key_str := 'PRV' || upper(encode(gen_random_bytes(32), 'hex'));
  
  -- 插入或更新API认证记录
  INSERT INTO api_credentials (program_id, public_key, private_key)
  VALUES (p_program_id, public_key_str, private_key_str)
  ON CONFLICT (program_id) 
  DO UPDATE SET 
    public_key = EXCLUDED.public_key,
    private_key = EXCLUDED.private_key,
    updated_at = now()
  RETURNING * INTO result_record;
  
  RETURN json_build_object(
    'success', true,
    'public_key', result_record.public_key,
    'private_key', result_record.private_key
  );
END;
$$;

-- 添加触发器
CREATE TRIGGER update_api_credentials_updated_at
BEFORE UPDATE ON public.api_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 为现有程序生成API密钥对
INSERT INTO api_credentials (program_id, public_key, private_key)
SELECT 
  id,
  'PUB' || upper(encode(gen_random_bytes(16), 'hex')),
  'PRV' || upper(encode(gen_random_bytes(32), 'hex'))
FROM programs
ON CONFLICT (program_id) DO NOTHING;