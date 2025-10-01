-- product_allergies_matrix テーブルで product_id = 205 を確認

-- ==============================================
-- 1. product_id = 205 のレコードが存在するか
-- ==============================================

SELECT 
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ 存在します'
    ELSE '❌ 存在しません'
  END as status
FROM product_allergies_matrix
WHERE product_id = 205;

-- ==============================================
-- 2. product_id = 205 の詳細データ（存在する場合）
-- ==============================================

SELECT *
FROM product_allergies_matrix
WHERE product_id = 205
LIMIT 10;

-- ==============================================
-- 3. product_id = 205 の products テーブル情報
-- ==============================================

SELECT *
FROM products
WHERE id = 205;
