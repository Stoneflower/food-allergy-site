-- soyカラムのデータをsoybeanにコピーしてから、soyカラムを削除

-- ==============================================
-- 1. 現在の状態を確認
-- ==============================================

SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN soy IS NOT NULL THEN 1 END) as soy_not_null,
  COUNT(CASE WHEN soybean IS NOT NULL THEN 1 END) as soybean_not_null
FROM staging_imports;

-- ==============================================
-- 2. soyのデータをsoybeanにコピー
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Copying soy data to soybean...';
  RAISE NOTICE '===================================';
END $$;

UPDATE staging_imports
SET soybean = soy
WHERE soy IS NOT NULL;

-- ==============================================
-- 3. soyカラムを削除
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Dropping soy column...';
END $$;

ALTER TABLE staging_imports
DROP COLUMN soy;

-- ==============================================
-- 4. 確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Column merge completed!';
  RAISE NOTICE 'soy → soybean (data copied)';
  RAISE NOTICE 'soy column dropped';
END $$;

-- soybeanカラムのみ存在することを確認
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'staging_imports'
  AND column_name IN ('soy', 'soybean')
ORDER BY column_name;

-- データが正しくコピーされたか確認
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN soybean IS NOT NULL THEN 1 END) as soybean_not_null,
  COUNT(CASE WHEN soybean = 'direct' THEN 1 END) as soybean_direct
FROM staging_imports;

