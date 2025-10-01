-- アップロード処理に関連するすべてのテーブルのポリシーを確認
-- menu_items, menu_item_allergies, product_allergies, 
-- product_trace_allergies, product_fragrance_allergies

-- ==============================================
-- 各テーブルのINSERT/DELETEポリシーを確認
-- ==============================================

-- menu_items
SELECT 
  'menu_items' as table_name,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'r' THEN 'SELECT'
  END as command,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
    WHEN qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%' THEN '🔐 Auth only'
    ELSE '⚠️ Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'menu_items'
  AND cmd IN ('a', 'd')
ORDER BY cmd;

-- menu_item_allergies
SELECT 
  'menu_item_allergies' as table_name,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
    WHEN 'w' THEN 'UPDATE'
  END as command,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
    WHEN qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%' THEN '🔐 Auth only'
    ELSE '⚠️ Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'menu_item_allergies'
  AND cmd IN ('a', 'd')
ORDER BY cmd;

-- product_allergies
SELECT 
  'product_allergies' as table_name,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
  END as command,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
    WHEN qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%' THEN '🔐 Auth only'
    ELSE '⚠️ Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
  AND cmd IN ('a', 'd')
ORDER BY cmd;

-- product_trace_allergies
SELECT 
  'product_trace_allergies' as table_name,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
  END as command,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
    WHEN qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%' THEN '🔐 Auth only'
    ELSE '⚠️ Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_trace_allergies'
  AND cmd IN ('a', 'd')
ORDER BY cmd;

-- product_fragrance_allergies
SELECT 
  'product_fragrance_allergies' as table_name,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
  END as command,
  CASE 
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
    WHEN qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%' THEN '🔐 Auth only'
    ELSE '⚠️ Other'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_fragrance_allergies'
  AND cmd IN ('a', 'd')
ORDER BY cmd;

-- ==============================================
-- 制限されているポリシーをハイライト表示
-- ==============================================

SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN 'a' THEN 'INSERT'
    WHEN 'd' THEN 'DELETE'
  END as command,
  '⚠️ BLOCKED FOR ANON' as warning
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('menu_items', 'menu_item_allergies', 'product_allergies', 
                    'product_trace_allergies', 'product_fragrance_allergies')
  AND cmd IN ('a', 'd')
  AND (qual ILIKE '%authenticated%' OR with_check ILIKE '%authenticated%')
ORDER BY tablename, cmd;

