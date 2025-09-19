-- イチゴホイップトーストのアレルギー情報を修正

-- 1. 現在の状況確認
SELECT 
  mi.id,
  mi.name,
  pam.milk,
  pam.egg,
  pam.wheat
FROM menu_items mi
LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE mi.name LIKE '%イチゴホイップトースト%'
ORDER BY mi.id;

-- 2. イチゴホイップトーストのアレルギー情報を修正
-- 実際には乳成分が含まれているので、milkを'd'に変更
UPDATE product_allergies_matrix
SET milk = 'd'
WHERE menu_name LIKE '%イチゴホイップトースト%'
  AND menu_name NOT LIKE '%モーニングセット%';

-- 3. 修正結果確認
SELECT 
  mi.id,
  mi.name,
  pam.milk,
  pam.egg,
  pam.wheat
FROM menu_items mi
LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE mi.name LIKE '%イチゴホイップトースト%'
ORDER BY mi.id;
