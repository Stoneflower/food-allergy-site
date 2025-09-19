-- 既存データの手動更新用SQL

-- 1. びっくりドンキー（product_id=7）の最新バッチIDを取得
SELECT 
  si.import_batch_id,
  COUNT(*) as row_count,
  MAX(si.created_at) as latest_import
FROM staging_imports si
WHERE si.raw_product_name = 'びっくりドンキー'
GROUP BY si.import_batch_id
ORDER BY latest_import DESC
LIMIT 1;

-- 2. 最新バッチIDを使ってproduct_allergies_matrixを更新
-- （上記のクエリ結果のimport_batch_idを下記のUUIDに置き換えて実行）
-- SELECT upsert_product_allergies_matrix(7, 'ここに最新のバッチIDを入力');

-- 3. 更新結果を確認
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
