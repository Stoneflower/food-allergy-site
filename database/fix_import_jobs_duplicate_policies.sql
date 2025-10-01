-- import_jobsテーブルの重複ポリシーを修正
-- SELECT と UPDATE に重複ポリシーがある

-- ==============================================
-- 現在のポリシーを確認
-- ==============================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'import_jobs'
ORDER BY cmd, policyname;

-- ==============================================
-- 重複ポリシーを削除して統合
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing import_jobs duplicate policies...';
  RAISE NOTICE '===================================';
END $$;

-- すべての既存ポリシーを削除
DROP POLICY IF EXISTS sel_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS sel_jobs ON public.import_jobs;
DROP POLICY IF EXISTS ins_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS upd_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS upd_jobs ON public.import_jobs;

-- 統合された新しいポリシーを作成
-- SELECT: 認証ユーザーのみ
CREATE POLICY sel_import_jobs
  ON public.import_jobs
  FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

-- INSERT: 認証ユーザーのみ
CREATE POLICY ins_import_jobs
  ON public.import_jobs
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: 認証ユーザーのみ
CREATE POLICY upd_import_jobs
  ON public.import_jobs
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ import_jobs policies fixed!';
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
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'import_jobs'
ORDER BY pol.polcmd, pol.polname;

