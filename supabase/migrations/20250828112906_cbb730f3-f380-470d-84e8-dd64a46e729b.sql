-- 修复use_recharge_card函数中的type字段值
CREATE OR REPLACE FUNCTION public.use_recharge_card(card_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  card_record recharge_cards%ROWTYPE;
  user_profile profiles%ROWTYPE;
  new_balance numeric;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  IF user_profile IS NULL THEN
    RETURN json_build_object('success', false, 'message', '用户不存在');
  END IF;

  -- Get and lock the recharge card
  SELECT * INTO card_record FROM recharge_cards 
  WHERE code = card_code AND status = 'unused'
  FOR UPDATE;
  
  IF card_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', '卡密不存在或已使用');
  END IF;
  
  -- Check if card is expired
  IF card_record.expire_at IS NOT NULL AND card_record.expire_at < now() THEN
    -- Mark as expired
    UPDATE recharge_cards SET status = 'expired', updated_at = now() 
    WHERE id = card_record.id;
    RETURN json_build_object('success', false, 'message', '卡密已过期');
  END IF;
  
  -- Calculate new balance
  new_balance := user_profile.balance + card_record.amount;
  
  -- Update user balance
  UPDATE profiles SET balance = new_balance, updated_at = now() 
  WHERE id = auth.uid();
  
  -- Mark card as used
  UPDATE recharge_cards 
  SET status = 'used', used_by = auth.uid(), used_at = now(), updated_at = now()
  WHERE id = card_record.id;
  
  -- Create balance record with correct type
  INSERT INTO balance_records (user_id, type, amount, balance_before, balance_after, description)
  VALUES (
    auth.uid(), 
    'recharge', 
    card_record.amount, 
    user_profile.balance, 
    new_balance,
    '充值卡密充值: ' || card_code
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', '充值成功', 
    'amount', card_record.amount,
    'new_balance', new_balance
  );
END;
$function$;