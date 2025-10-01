-- allergy_settingsテーブルのポリシーとテーブル構造を確認

-- ==============================================
-- 1. テーブル構造を確認
-- ==============================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'allergy_settings'
ORDER BY ordinal_position;

-- ==============================================
-- 2. 現在のポリシー定義を確認
-- ==============================================

SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'allergy_settings'
ORDER BY pol.polname;

