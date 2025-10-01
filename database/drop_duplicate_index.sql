-- 重複インデックスを削除
-- ix_pa_pid_pt を削除し、ix_product_allergies_pid_pt を残す
-- 理由: より説明的な名前の方が保守性が高い

-- ==============================================
-- ステップ1: 削除前の確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Dropping duplicate index...';
  RAISE NOTICE 'Keeping: ix_product_allergies_pid_pt (descriptive name)';
  RAISE NOTICE 'Dropping: ix_pa_pid_pt (shorter name)';
  RAISE NOTICE '===================================';
END $$;

-- 削除前のインデックス一覧
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
  AND indexname IN ('ix_pa_pid_pt', 'ix_product_allergies_pid_pt')
ORDER BY indexname;

-- ==============================================
-- ステップ2: 重複インデックスを削除
-- ==============================================

DROP INDEX IF EXISTS public.ix_pa_pid_pt;

-- ==============================================
-- ステップ3: 削除後の確認
-- ==============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'product_allergies'
      AND indexname = 'ix_pa_pid_pt'
  ) THEN
    RAISE NOTICE '✓ ix_pa_pid_pt successfully dropped';
  ELSE
    RAISE WARNING 'Index ix_pa_pid_pt still exists!';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'product_allergies'
      AND indexname = 'ix_product_allergies_pid_pt'
  ) THEN
    RAISE NOTICE '✓ ix_product_allergies_pid_pt is still present';
  ELSE
    RAISE WARNING 'Index ix_product_allergies_pid_pt was removed!';
  END IF;
END $$;

-- 残っているインデックスを確認
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
ORDER BY indexname;

-- ==============================================
-- ステップ4: パフォーマンスへの影響確認
-- ==============================================

-- product_allergiesテーブルのすべてのインデックスのサイズ
SELECT 
  schemaname,
  tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND relname = 'product_allergies'
ORDER BY indexrelname;

-- ==============================================
-- 最終メッセージ
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Duplicate index removed successfully!';
  RAISE NOTICE 'Remaining index: ix_product_allergies_pid_pt';
  RAISE NOTICE '===================================';
END $$;

