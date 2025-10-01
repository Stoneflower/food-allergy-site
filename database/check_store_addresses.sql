-- 商品の店舗住所を確認（エリアフィルター問題のデバッグ）

-- 日清シスコと菓道の店舗住所を確認
SELECT 
  p.id,
  p.name,
  sl.branch_name,
  sl.address,
  sl.store_list_url
FROM products p
LEFT JOIN store_locations sl ON sl.product_id = p.id
WHERE p.id IN (201, 202)
ORDER BY p.id, sl.id;

-- 店舗住所がない商品を確認
SELECT 
  p.id,
  p.name,
  COUNT(sl.id) as store_count
FROM products p
LEFT JOIN store_locations sl ON sl.product_id = p.id
WHERE p.id IN (201, 202)
GROUP BY p.id, p.name;

