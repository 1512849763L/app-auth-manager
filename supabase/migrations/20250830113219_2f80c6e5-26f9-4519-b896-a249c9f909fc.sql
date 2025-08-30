-- 创建简化的API认证函数，只需要卡密验证
CREATE OR REPLACE FUNCTION public.verify_card_key_simple(p_card_key text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  card_record card_keys%ROWTYPE;
  program_record programs%ROWTYPE;
BEGIN
  -- 获取卡密记录
  SELECT * INTO card_record FROM card_keys 
  WHERE card_key = p_card_key 
    AND status IN ('unused', 'used')
    AND (expire_at IS NULL OR expire_at > now());
  
  IF card_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '卡密无效或已过期');
  END IF;
  
  -- 获取程序信息
  SELECT * INTO program_record FROM programs 
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

-- 创建简化的机器码绑定函数，只需要卡密和机器码
CREATE OR REPLACE FUNCTION public.bind_machine_simple(p_card_key text, p_machine_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  card_record card_keys%ROWTYPE;
  current_machine_count integer;
BEGIN
  -- 获取卡密记录
  SELECT * INTO card_record FROM card_keys 
  WHERE card_key = p_card_key 
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