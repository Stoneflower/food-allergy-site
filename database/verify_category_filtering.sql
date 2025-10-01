-- 商品カテゴリーフィルタリングのデータを検証

-- 1. おかしカテゴリーの商品とそのメニューアイテムを確認
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.category as利用シーン,
  p.product_category_id,
  pc.name as 商品カテゴリー,
  COUNT(mi.id) as メニュー数
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
LEFT JOIN menu_items mi ON mi.product_id = p.id
WHERE p.product_category_id = 1
GROUP BY p.id, p.name, p.category, p.product_category_id, pc.name;

-- 2. 商品202「菓道」の詳細データ（RestaurantContextで取得される形式）
SELECT 
  p.id,
  p.name,
  p.brand,
  p.category,
  p.product_category_id,
  p.description,
  p.source_url,
  p.source_url2,
  p.image_url,
  json_agg(DISTINCT jsonb_build_object(
    'id', mi.id,
    'name', mi.name,
    'product_id', mi.product_id
  )) as menu_items
FROM products p
LEFT JOIN menu_items mi ON mi.product_id = p.id
WHERE p.id = 202
GROUP BY p.id;

-- 3. 商品201「日清シスコ」の詳細データ
SELECT 
  p.id,
  p.name,
  p.brand,
  p.category,
  p.product_category_id,
  json_agg(DISTINCT jsonb_build_object(
    'id', mi.id,
    'name', mi.name,
    'product_id', mi.product_id
  )) as menu_items
FROM products p
LEFT JOIN menu_items mi ON mi.product_id = p.id
WHERE p.id = 201
GROUP BY p.id;

