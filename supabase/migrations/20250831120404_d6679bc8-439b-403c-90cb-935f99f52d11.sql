-- 修复函数安全设置
ALTER FUNCTION public.verify_card_simple(text, text) SET search_path TO 'public';
ALTER FUNCTION public.bind_machine_simple(text, text, text) SET search_path TO 'public';
ALTER FUNCTION public.generate_api_credentials(uuid) SET search_path TO 'public';