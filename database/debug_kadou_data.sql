-- 菓道（ID: 202）のデータを詳細に確認

-- 1. 基本情報
SELECT 
  id,
  name,
  category as 利用シーン,
  product_category_id as 商品カテゴリーID
FROM products 
WHERE id = 202;

-- 2. product_allergies_matrixのデータ（香料アレルギー確認）
SELECT 
  product_id,
  menu_item_id,
  menu_name,
  milk as 乳アレルギー,
  egg as 卵アレルギー,
  wheat as 小麦アレルギー
FROM product_allergies_matrix
WHERE product_id = 202
LIMIT 5;

-- 3. menu_itemsの確認
SELECT 
  id,
  product_id,
  name as menu_name
FROM menu_items
WHERE product_id = 202
LIMIT 5;

-- 4. 香料に乳が含まれている商品を探す
SELECT 
  p.id,
  p.name,
  pam.menu_name,
  pam.milk
FROM products p
JOIN product_allergies_matrix pam ON p.id = pam.product_id
WHERE pam.milk = 'fragrance'
LIMIT 10;

