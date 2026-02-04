-- import_jobsテーブルのRLSポリシーを一時的に緩和
-- CSVアップロードが動作するようにする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS sel_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS ins_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS upd_import_jobs ON public.import_jobs;

-- 一時的に緩和されたポリシーを作成（認証不要）
CREATE POLICY sel_import_jobs
  ON public.import_jobs
  FOR SELECT
  USING (true);

CREATE POLICY ins_import_jobs
  ON public.import_jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY upd_import_jobs
  ON public.import_jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ポリシー確認
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
  AND pc.relname = 'import_jobs'
ORDER BY pol.polcmd, pol.polname;