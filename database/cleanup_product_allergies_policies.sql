-- product_allergiesテーブルのすべての重複ポリシーを統合
-- 古いポリシーと新しいポリシーが混在している

-- ==============================================
-- 現在のすべてのポリシーを確認
-- ==============================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
ORDER BY cmd, policyname;

-- ==============================================
-- すべての既存ポリシーを削除
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Cleaning up product_allergies policies...';
  RAISE NOTICE 'Removing all duplicate policies...';
  RAISE NOTICE '===================================';
END $$;

-- 古いポリシーを削除
DROP POLICY IF EXISTS "pa insert JP" ON public.product_allergies;
DROP POLICY IF EXISTS "pa select public" ON public.product_allergies;
DROP POLICY IF EXISTS "pa delete JP or NULL" ON public.product_allergies;
DROP POLICY IF EXISTS pa_insert_all ON public.product_allergies;
DROP POLICY IF EXISTS pa_select_all ON public.product_allergies;
DROP POLICY IF EXISTS product_allergies_read ON public.product_allergies;
DROP POLICY IF EXISTS product_allergies_insert ON public.product_allergies;
DROP POLICY IF EXISTS product_allergies_update ON public.product_allergies;
DROP POLICY IF EXISTS product_allergies_delete ON public.product_allergies;

-- ==============================================
-- 統一された新しいポリシーセットを作成
-- ==============================================

-- SELECT: 全員が読み取り可能
CREATE POLICY product_allergies_read
  ON public.product_allergies
  FOR SELECT
  USING (true);

-- INSERT: 認証ユーザーのみ
CREATE POLICY product_allergies_insert
  ON public.product_allergies
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: 認証ユーザーのみ
CREATE POLICY product_allergies_update
  ON public.product_allergies
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- DELETE: 認証ユーザーのみ
CREATE POLICY product_allergies_delete
  ON public.product_allergies
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ product_allergies cleaned up!';
  RAISE NOTICE 'All duplicate policies removed';
  RAISE NOTICE '===================================';
END $$;

-- 修正後のポリシーを確認
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  COUNT(*) OVER (PARTITION BY pol.polcmd) as policy_count_per_action,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'product_allergies'
ORDER BY 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END,
  pol.polname;

