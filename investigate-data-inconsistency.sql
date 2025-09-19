-- データ不整合の詳細調査

-- 1. イチゴホイップトースト関連のメニュー一覧
SELECT 
  mi.id,
  mi.name,
  mi.product_id,
  pam.milk,
  pam.egg,
  pam.wheat,
  pam.menu_item_id
FROM menu_items mi
LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE mi.name LIKE '%イチゴホイップトースト%'
ORDER BY mi.id;

-- 2. 同じメニュー名で複数のレコードがあるかチェック
SELECT 
  menu_name,
  COUNT(*) as count,
  STRING_AGG(DISTINCT milk, ', ') as milk_values,
  STRING_AGG(DISTINCT egg, ', ') as egg_values,
  STRING_AGG(DISTINCT wheat, ', ') as wheat_values
FROM product_allergies_matrix
WHERE menu_name LIKE '%イチゴホイップトースト%'
GROUP BY menu_name
HAVING COUNT(*) > 1;

-- 3. menu_item_idの重複チェック
SELECT 
  menu_item_id,
  COUNT(*) as count
FROM product_allergies_matrix
WHERE menu_item_id IS NOT NULL
GROUP BY menu_item_id
HAVING COUNT(*) > 1;
