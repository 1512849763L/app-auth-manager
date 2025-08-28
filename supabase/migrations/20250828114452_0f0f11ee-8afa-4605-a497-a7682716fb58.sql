-- 修复函数搜索路径安全问题
DROP FUNCTION IF EXISTS public.bind_machine_code(text, text, uuid);
DROP FUNCTION IF EXISTS public.verify_card_key_with_machine(text, text, uuid);

-- 重新创建机器码绑定验证函数
CREATE OR REPLACE FUNCTION public.bind_machine_code(
  p_card_key text,
  p_machine_code text,
  p_program_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  card_record card_keys%ROWTYPE;
  current_machine_count integer;
BEGIN
  -- 获取卡密记录
  SELECT * INTO card_record FROM card_keys 
  WHERE card_key = p_card_key 
    AND program_id = p_program_id
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
$function$;

-- 重新创建验证卡密和机器码的函数
CREATE OR REPLACE FUNCTION public.verify_card_key_with_machine(
  p_card_key text,
  p_machine_code text,
  p_program_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  card_record card_keys%ROWTYPE;
BEGIN
  -- 获取卡密记录
  SELECT * INTO card_record FROM card_keys 
  WHERE card_key = p_card_key 
    AND program_id = p_program_id;
  
  IF card_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '卡密不存在');
  END IF;
  
  -- 检查卡密是否过期
  IF card_record.expire_at IS NOT NULL AND card_record.expire_at <= now() THEN
    RETURN json_build_object('success', false, 'message', '卡密已过期');
  END IF;
  
  -- 检查机器码是否已绑定
  IF NOT (p_machine_code = ANY(card_record.bound_machine_codes)) THEN
    -- 如果机器码未绑定，尝试绑定
    RETURN bind_machine_code(p_card_key, p_machine_code, p_program_id);
  END IF;
  
  -- 机器码已绑定，返回验证成功
  RETURN json_build_object(
    'success', true,
    'message', '验证成功',
    'valid', true,
    'expire_at', card_record.expire_at,
    'used_machines', card_record.used_machines,
    'max_machines', card_record.max_machines
  );
END;
$function$;