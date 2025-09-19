-- staging_importsのデータを確認して問題を特定

-- 1. 最新のバッチIDを確認
SELECT 
  si.import_batch_id,
  COUNT(*) as row_count,
  MAX(si.created_at) as latest_import
FROM staging_imports si
WHERE si.raw_product_name = 'びっくりドンキー'
GROUP BY si.import_batch_id
ORDER BY latest_import DESC
LIMIT 3;

-- 2. 最新バッチの「いきいき乳酸菌ヨーデル」関連データを確認
-- （上記のクエリ結果の最新バッチIDを下記のUUIDに置き換えて実行）
-- SELECT 
--   si.row_no,
--   si.raw_menu_name,
--   si.milk,
--   si.egg,
--   si.wheat
-- FROM staging_imports si
-- WHERE si.import_batch_id = 'ここに最新のバッチIDを入力'
--   AND si.raw_menu_name LIKE '%いきいき乳酸菌ヨーデル%'
-- ORDER BY si.row_no;

-- 3. menu_itemsの「いきいき乳酸菌ヨーデル」関連データを確認
SELECT 
  mi.id,
  mi.name,
  mi.product_id
FROM menu_items mi
WHERE mi.name LIKE '%いきいき乳酸菌ヨーデル%'
ORDER BY mi.id;
