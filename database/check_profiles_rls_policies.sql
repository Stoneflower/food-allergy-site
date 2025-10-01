-- profilesテーブルのRLSポリシーを確認

-- ==============================================
-- 1. profilesテーブルのすべてのポリシーを確認
-- ==============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- ==============================================
-- 2. ポリシーの詳細定義を取得
-- ==============================================

SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE 
    WHEN pol.polpermissive THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'profiles'
ORDER BY pol.polname;

