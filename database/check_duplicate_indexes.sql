-- 重複インデックスを確認
-- product_allergiesテーブルのインデックスを詳しく調査

-- ==============================================
-- 1. product_allergiesテーブルのすべてのインデックスを確認
-- ==============================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
ORDER BY indexname;

-- ==============================================
-- 2. インデックスの詳細情報を取得
-- ==============================================

SELECT 
  i.relname as index_name,
  a.attname as column_name,
  am.amname as index_type,
  ix.indisunique as is_unique,
  ix.indisprimary as is_primary,
  pg_get_indexdef(i.oid) as index_definition
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_am am ON i.relam = am.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'product_allergies'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY i.relname, a.attname;

-- ==============================================
-- 3. 重複している2つのインデックスを比較
-- ==============================================

SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname = 'ix_pa_pid_pt' THEN '📝 Shorter name'
    WHEN indexname = 'ix_product_allergies_pid_pt' THEN '📝 Descriptive name'
    ELSE '📝 Other'
  END as note
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies'
  AND indexname IN ('ix_pa_pid_pt', 'ix_product_allergies_pid_pt')
ORDER BY indexname;

-- ==============================================
-- 4. インデックスのサイズを確認
-- ==============================================

SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND relname = 'product_allergies'
  AND indexrelname IN ('ix_pa_pid_pt', 'ix_product_allergies_pid_pt')
ORDER BY indexrelname;
