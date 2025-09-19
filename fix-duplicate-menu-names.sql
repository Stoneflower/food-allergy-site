-- 重複メニュー名の修正SQL

-- 1. 現在の重複メニューを確認
SELECT 
  mi.id,
  mi.name,
  pam.milk,
  pam.egg,
  pam.wheat
FROM menu_items mi
JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE mi.name LIKE '%いきいき乳酸菌ヨーデル%'
ORDER BY mi.id;

-- 2. 重複メニューの名前を修正（テイクアウトの区別を追加）
UPDATE menu_items 
SET name = 'いきいき乳酸菌ヨーデル（店内のみ）'
WHERE id = 6885 AND name = 'いきいき乳酸菌ヨーデル';

UPDATE menu_items 
SET name = 'いきいき乳酸菌ヨーデル（テイクアウト可）'
WHERE id = 6959 AND name = 'いきいき乳酸菌ヨーデル (2)';

-- 3. product_allergies_matrixのmenu_nameも更新
UPDATE product_allergies_matrix 
SET menu_name = 'いきいき乳酸菌ヨーデル（店内のみ）'
WHERE menu_item_id = 6885;

UPDATE product_allergies_matrix 
SET menu_name = 'いきいき乳酸菌ヨーデル（テイクアウト可）'
WHERE menu_item_id = 6959;

-- 4. 修正結果を確認
SELECT 
  mi.id,
  mi.name,
  pam.milk,
  pam.egg,
  pam.wheat
FROM menu_items mi
JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE mi.name LIKE '%いきいき乳酸菌ヨーデル%'
ORDER BY mi.id;
