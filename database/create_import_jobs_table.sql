-- import_jobsテーブルの作成
-- CSVアップロードのジョブ管理用テーブル

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0
);

-- RLSを有効化
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（重複回避）
DROP POLICY IF EXISTS sel_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS ins_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS upd_import_jobs ON public.import_jobs;

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

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);

-- テーブル作成確認
SELECT 
  'import_jobs' as table_name,
  COUNT(*) as row_count
FROM import_jobs;

-- ポリシー確認
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'import_jobs'
ORDER BY pol.polcmd, pol.polname;


















