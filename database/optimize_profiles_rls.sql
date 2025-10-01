-- profilesテーブルのRLSポリシーを最適化
-- auth.uid()を各行ごとに再評価しないように修正

-- ==============================================
-- ステップ1: 現在のポリシーを削除
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Optimizing profiles RLS policies...';
  RAISE NOTICE '===================================';
END $$;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

-- ==============================================
-- ステップ2: 最適化されたポリシーを作成
-- ==============================================

-- SELECT ポリシー（最適化版）
CREATE POLICY profiles_select_self
  ON public.profiles
  FOR SELECT
  USING (id = (select auth.uid()));

-- INSERT ポリシー（最適化版）
CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- UPDATE ポリシー（最適化版）
CREATE POLICY profiles_update_self
  ON public.profiles
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ==============================================
-- ステップ3: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'RLS policies optimized successfully!';
  RAISE NOTICE 'auth.uid() is now evaluated once per query';
  RAISE NOTICE '===================================';
END $$;

-- 最適化後のポリシーを確認
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
  CASE 
    WHEN pg_get_expr(pol.polqual, pol.polrelid) LIKE '%(SELECT auth.uid())%' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%(SELECT auth.uid())%'
    THEN '✅ Optimized'
    WHEN pg_get_expr(pol.polqual, pol.polrelid) LIKE '%auth.uid()%' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%auth.uid()%'
    THEN '❌ Not optimized'
    ELSE '✅ No auth.uid()'
  END as optimization_status
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'profiles'
ORDER BY pol.polname;

