-- symbol_mapping_suggestions テーブルの構造を確認するSQL

-- テーブルの存在確認
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'symbol_mapping_suggestions'
) as table_exists;

-- カラム情報の取得
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'symbol_mapping_suggestions'
ORDER BY ordinal_position;

-- RLSの状態確認
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename = 'symbol_mapping_suggestions';

-- 既存のポリシー確認
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
AND tablename = 'symbol_mapping_suggestions';


