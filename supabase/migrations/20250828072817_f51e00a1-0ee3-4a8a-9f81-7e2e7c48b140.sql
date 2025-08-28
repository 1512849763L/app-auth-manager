-- Update RLS policies to allow users to view programs and manage their own card keys
-- Allow users to view active programs for purchasing
CREATE POLICY "用户可以查看激活的程序用于购买" 
ON public.programs 
FOR SELECT 
USING (status = 'active');

-- Allow users to view their own card keys
CREATE POLICY "用户可以查看自己的卡密" 
ON public.card_keys 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to update their own card keys (for unbinding, clearing IP, etc.)
CREATE POLICY "用户可以更新自己的卡密" 
ON public.card_keys 
FOR UPDATE 
USING (user_id = auth.uid());

-- Allow users to insert orders
CREATE POLICY "用户可以创建订单" 
ON public.orders 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Allow users to insert balance records (for tracking transactions)
CREATE POLICY "用户可以创建余额记录" 
ON public.balance_records 
FOR INSERT 
WITH CHECK (user_id = auth.uid());