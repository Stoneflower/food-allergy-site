-- staging_importsテーブルのsoyカラムをsoybeanにリネーム
-- カラム名を統一

-- ==============================================
-- カラムのリネーム
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Renaming soy column to soybean...';
  RAISE NOTICE '===================================';
END $$;

-- soyカラムをsoybeanにリネーム
ALTER TABLE staging_imports 
RENAME COLUMN soy TO soybean;

-- ==============================================
-- 確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Column renamed successfully!';
END $$;

-- カラムが正しくリネームされたか確認
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'staging_imports'
  AND column_name IN ('soy', 'soybean')
ORDER BY column_name;

