-- product_allergies_matrixのすべてのポリシーを確認
-- INSERT/DELETEが正常に動作するか

-- ==============================================
-- 1. すべてのポリシーを確認
-- ==============================================

SELECT 
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  permissive,
  roles,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix'
ORDER BY cmd, policyname;

-- ==============================================
-- 2. テーブル全体のレコード数を確認
-- ==============================================

SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT product_id) as unique_products,
  MIN(product_id) as min_product_id,
  MAX(product_id) as max_product_id
FROM product_allergies_matrix;

-- ==============================================
-- 3. product_id = 205 付近のデータを確認
-- ==============================================

SELECT 
  product_id,
  COUNT(*) as row_count
FROM product_allergies_matrix
WHERE product_id BETWEEN 200 AND 210
GROUP BY product_id
ORDER BY product_id;

-- ==============================================
-- 4. 最近削除された可能性のあるデータを確認
-- ==============================================

-- productsテーブルに存在するが、product_allergies_matrixに存在しない商品
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.category,
  CASE 
    WHEN pam.product_id IS NULL THEN '❌ No allergy data'
    ELSE '✅ Has allergy data'
  END as allergy_data_status
FROM products p
LEFT JOIN (
  SELECT DISTINCT product_id 
  FROM product_allergies_matrix
) pam ON p.id = pam.product_id
WHERE p.id BETWEEN 200 AND 210
ORDER BY p.id;

