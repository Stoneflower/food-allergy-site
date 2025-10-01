-- 商品カテゴリーフィルター問題のデバッグ

-- 1. 各カテゴリーの商品数を確認
SELECT 
  pc.id as category_id,
  pc.name as category_name,
  COUNT(p.id) as product_count
FROM product_categories pc
LEFT JOIN products p ON p.product_category_id = pc.id
GROUP BY pc.id, pc.name
ORDER BY pc.id;

-- 2. カテゴリー未設定（CSV商品）の数
SELECT 
  COUNT(*) as csv_product_count,
  string_agg(DISTINCT p.name, ', ') as product_names
FROM products p
WHERE p.product_category_id IS NULL;

-- 3. 全商品のカテゴリー設定状況
SELECT 
  p.id,
  p.name,
  p.category as 利用シーン,
  p.product_category_id,
  pc.name as 商品カテゴリー,
  CASE 
    WHEN p.product_category_id IS NULL THEN 'CSV商品'
    ELSE 'カテゴリー設定済み'
  END as status
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
ORDER BY p.product_category_id NULLS FIRST, p.id
LIMIT 20;

