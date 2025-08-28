-- Create recharge cards table for balance top-up
CREATE TABLE public.recharge_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  created_by uuid NOT NULL,
  used_by uuid NULL,
  used_at timestamp with time zone NULL,
  expire_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recharge_cards
ALTER TABLE public.recharge_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for recharge_cards
CREATE POLICY "管理员可以管理所有充值卡密" 
ON public.recharge_cards 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "管理员可以查看所有充值卡密" 
ON public.recharge_cards 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "用户可以查看自己使用的充值卡密" 
ON public.recharge_cards 
FOR SELECT 
USING (used_by = auth.uid());

CREATE POLICY "用户可以更新未使用的充值卡密进行充值" 
ON public.recharge_cards 
FOR UPDATE 
USING (status = 'unused' AND (expire_at IS NULL OR expire_at > now()));

-- Add trigger for updated_at
CREATE TRIGGER update_recharge_cards_updated_at
  BEFORE UPDATE ON public.recharge_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate recharge card code
CREATE OR REPLACE FUNCTION public.generate_recharge_card_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..20 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i % 4 = 0 AND i < 20 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to use recharge card
CREATE OR REPLACE FUNCTION public.use_recharge_card(card_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Create balance record
  INSERT INTO balance_records (user_id, type, amount, balance_before, balance_after, description)
  VALUES (
    auth.uid(), 
    'income', 
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
$$;