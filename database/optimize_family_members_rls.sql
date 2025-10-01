-- family_membersテーブルのRLSポリシーを最適化
-- auth.uid()を各行ごとに再評価しないように修正

-- ==============================================
-- ステップ1: 現在のポリシーを確認
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
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'family_members'
ORDER BY pol.polname;

-- ==============================================
-- ステップ2: 既存のポリシーを削除
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Optimizing family_members RLS policies...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS family_members_select_own ON public.family_members;
DROP POLICY IF EXISTS family_members_insert_own ON public.family_members;
DROP POLICY IF EXISTS family_members_update_own ON public.family_members;
DROP POLICY IF EXISTS family_members_delete_own ON public.family_members;

-- ==============================================
-- ステップ3: 最適化されたポリシーを作成
-- ==============================================

-- SELECT ポリシー（最適化版）
CREATE POLICY family_members_select_own
  ON public.family_members
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- INSERT ポリシー（最適化版）
CREATE POLICY family_members_insert_own
  ON public.family_members
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE ポリシー（最適化版）
CREATE POLICY family_members_update_own
  ON public.family_members
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- DELETE ポリシー（最適化版）
CREATE POLICY family_members_delete_own
  ON public.family_members
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ==============================================
-- ステップ4: 最終確認
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
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
  CASE 
    WHEN pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%SELECT auth.uid()%' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%SELECT auth.uid()%'
    THEN '✅ Optimized (subquery)'
    WHEN pg_get_expr(pol.polqual, pol.polrelid) ~ 'auth\.uid\(\s*\)(?!\s*AS)' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) ~ 'auth\.uid\(\s*\)(?!\s*AS)'
    THEN '❌ Not optimized (direct call)'
    ELSE '✅ Safe'
  END as optimization_status
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'family_members'
ORDER BY pol.polname;

