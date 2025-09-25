-- 検索パフォーマンステスト用のSQL

-- 1. 基本的なLIKE検索のテスト
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.id, p.name, p.brand, p.category
FROM products p
WHERE p.name ILIKE '%商品%' 
   OR p.brand ILIKE '%商品%'
   OR p.description ILIKE '%商品%'
LIMIT 20;

-- 2. 全文検索のテスト（既存のenglish設定）
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.name, p.brand, p.category
FROM products p
WHERE to_tsvector('english', 
  coalesce(p.name, '') || ' ' || 
  coalesce(p.product_title, '') || ' ' || 
  coalesce(p.brand, '') || ' ' || 
  coalesce(p.description, '')
) @@ plainto_tsquery('english', '商品')
LIMIT 20;

-- 3. 複合検索のテスト
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.name, pa.allergy_item_id
FROM products p
JOIN product_allergies pa ON p.id = pa.product_id
WHERE p.category = 'レストラン'
  AND pa.allergy_item_id = 'egg'
LIMIT 20;

-- 4. エリア検索のテスト
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.name, sl.address
FROM products p
JOIN store_locations sl ON p.id = sl.product_id
WHERE sl.address ILIKE '%東京%'
LIMIT 20;

-- 5. インデックスの使用状況確認
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('products', 'store_locations', 'product_allergies')
  AND indexname LIKE '%idx_%'
ORDER BY idx_scan DESC;

-- 6. インデックスのサイズ確認
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'store_locations', 'product_allergies')
  AND indexname LIKE '%idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 7. 検索パフォーマンスログの確認
SELECT 
  search_term,
  execution_time_ms,
  result_count,
  created_at
FROM search_performance_log
ORDER BY created_at DESC
LIMIT 10;

-- 8. 平均パフォーマンス統計
SELECT 
  COUNT(*) as total_searches,
  AVG(execution_time_ms) as avg_execution_time_ms,
  AVG(result_count) as avg_result_count,
  MIN(execution_time_ms) as min_execution_time_ms,
  MAX(execution_time_ms) as max_execution_time_ms
FROM search_performance_log
WHERE created_at > NOW() - INTERVAL '24 hours';
