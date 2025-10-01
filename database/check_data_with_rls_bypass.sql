-- RLSをバイパスして実際のデータを確認
-- データが物理的に削除されたか、RLSで見えないだけかを判定

-- ==============================================
-- 1. 現在のロールとRLS状態を確認
-- ==============================================

SELECT 
  current_user as current_role,
  current_setting('role') as session_role;

-- product_allergies_matrixのRLS状態
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix';

-- ==============================================
-- 2. 通常のクエリ（RLSが適用される）
-- ==============================================

SELECT 
  'With RLS:' as query_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN product_id = 205 THEN 1 END) as product_205_count
FROM product_allergies_matrix;

-- ==============================================
-- 3. RLSをバイパスして確認（管理者のみ可能）
-- ==============================================

-- RLSを一時的に無効化してデータを確認
-- 注意: これはpostgresロールまたはテーブル所有者のみ実行可能

SET LOCAL ROLE postgres;

SELECT 
  'Without RLS (postgres role):' as query_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN product_id = 205 THEN 1 END) as product_205_count
FROM product_allergies_matrix;

-- product_id = 205のデータを表示
SELECT *
FROM product_allergies_matrix
WHERE product_id = 205
LIMIT 5;

-- すべてのproduct_idを確認
SELECT 
  product_id,
  COUNT(*) as row_count
FROM product_allergies_matrix
GROUP BY product_id
ORDER BY product_id
LIMIT 20;

RESET ROLE;

