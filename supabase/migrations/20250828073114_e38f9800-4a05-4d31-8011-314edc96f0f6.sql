-- Insert a test program for demonstration
INSERT INTO public.programs (name, price, cost_price, description, api_key, created_by, status, version)
VALUES (
  '测试软件授权',
  29.99,
  5.00,
  '这是一个测试程序，包含完整的授权验证功能。支持多种验证方式，包括硬件绑定、IP验证等。',
  'test_api_key_' || generate_random_uuid(),
  '5740ddc0-f018-432b-875e-50486a380540',
  'active',
  '1.0.0'
),
(
  '高级工具包',
  99.99,
  20.00,
  '功能强大的高级工具包，提供专业级的软件保护和授权管理功能。适合企业级应用。',
  'premium_api_key_' || generate_random_uuid(),
  '5740ddc0-f018-432b-875e-50486a380540',
  'active',
  '2.1.0'
),
(
  '基础版授权',
  9.99,
  2.00,
  '入门级授权软件，适合个人开发者和小型项目使用。简单易用，功能完备。',
  'basic_api_key_' || generate_random_uuid(),
  '5740ddc0-f018-432b-875e-50486a380540',
  'active',
  '1.5.2'
);

-- Give the current user some balance to test purchasing
UPDATE public.profiles 
SET balance = 500.00 
WHERE id = '5740ddc0-f018-432b-875e-50486a380540';

-- Add balance record for the initial balance
INSERT INTO public.balance_records (user_id, amount, type, description, balance_before, balance_after)
VALUES (
  '5740ddc0-f018-432b-875e-50486a380540',
  500.00,
  'income',
  '系统初始余额',
  0.00,
  500.00
);