-- 添加用户购买卡密的RLS策略
CREATE POLICY "用户可以购买卡密" 
ON public.card_keys 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 同时修复现有的一些约束问题