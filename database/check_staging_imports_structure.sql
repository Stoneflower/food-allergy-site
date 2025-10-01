-- staging_importsテーブルの構造を確認

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'staging_imports'
ORDER BY ordinal_position;

-- サンプルデータも確認
SELECT *
FROM staging_imports
ORDER BY created_at DESC
LIMIT 3;

