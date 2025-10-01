-- 商品にproduct_category_idが設定されているか確認

-- 1. product_category_idが設定されている商品の数
SELECT 
  COUNT(*) as products_with_category,
  COUNT(CASE WHEN product_category_id = 1 THEN 1 END) as snack_count,
  COUNT(CASE WHEN product_category_id = 2 THEN 1 END) as meal_count,
  COUNT(CASE WHEN product_category_id = 3 THEN 1 END) as beverage_count
FROM products;

-- 2. product_category_idが設定されている商品の例
SELECT 
  p.id,
  p.name,
  p.product_category_id,
  pc.name as category_name,
  pc.icon
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
WHERE p.product_category_id IS NOT NULL
LIMIT 10;

-- 3. 最近作成された商品のカテゴリー設定状況
SELECT 
  p.id,
  p.name,
  p.product_category_id,
  pc.name as category_name,
  p.created_at
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
ORDER BY p.created_at DESC
LIMIT 10;

