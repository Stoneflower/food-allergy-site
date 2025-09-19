-- メニュー名で検索してアレルギー情報を確認
SELECT 
  mi.id,
  mi.name,
  mi.product_id,
  mia.allergy_item_slug,
  mia.presence_type
FROM menu_items mi
LEFT JOIN menu_item_allergies mia ON mia.menu_item_id = mi.id
WHERE mi.name LIKE '%イチゴホイップトースト%'
ORDER BY mi.id, mia.allergy_item_slug;
