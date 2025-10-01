-- フィルタリング機能のセットアップ確認

-- 1. 全商品のカテゴリー設定状況
SELECT 
  p.id,
  p.name,
  p.category as 利用シーン,
  p.product_category_id,
  pc.name as カテゴリー名,
  COUNT(DISTINCT mi.id) as メニュー数
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
LEFT JOIN menu_items mi ON mi.product_id = p.id
GROUP BY p.id, p.name, p.category, p.product_category_id, pc.name
ORDER BY p.product_category_id, p.name;

-- 2. 香料アレルギー（fragrance）を持つ商品
SELECT 
  p.id,
  p.name as 会社名,
  p.product_category_id,
  pc.name as カテゴリー,
  pam.menu_name,
  pam.milk as 乳,
  pam.egg as 卵,
  pam.wheat as 小麦
FROM products p
LEFT JOIN product_categories pc ON p.product_category_id = pc.id
JOIN product_allergies_matrix pam ON p.id = pam.product_id
WHERE pam.milk = 'fragrance' 
   OR pam.egg = 'fragrance'
   OR pam.wheat = 'fragrance'
LIMIT 20;

-- 3. おかしカテゴリーの商品詳細
SELECT 
  p.id,
  p.name,
  p.category,
  p.product_category_id,
  mi.name as menu_name,
  pam.milk
FROM products p
LEFT JOIN menu_items mi ON mi.product_id = p.id
LEFT JOIN product_allergies_matrix pam ON pam.product_id = p.id AND pam.menu_item_id = mi.id
WHERE p.product_category_id = 1
ORDER BY p.id, mi.id;

