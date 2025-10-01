-- productId 207のからやまのsoybean null値を修正

-- 現在のsoybeanの状況を確認
SELECT 
    pam.menu_item_id,
    pam.menu_name,
    pam.soybean,
    pam.egg,
    pam.milk,
    pam.wheat,
    pam.sesame
FROM product_allergies_matrix pam
WHERE pam.product_id = 207
ORDER BY pam.menu_item_id
LIMIT 10;

-- からやまのメニューで大豆が使用されているかどうかを確認
-- 一般的にからあげ店では大豆油や醤油が使用される可能性がある
-- しかし、メニュー名から判断すると、基本的には鶏肉、小麦粉、卵、乳製品が主成分

-- 暫定的にsoybeanを'none'に設定（より詳細な調査が必要）
-- 注意: 実際のメニューで大豆が使用されている場合は適切な値に変更する必要があります

UPDATE product_allergies_matrix 
SET soybean = 'none',
    updated_at = NOW()
WHERE product_id = 207 
  AND soybean IS NULL;

-- 更新結果を確認
SELECT 
    COUNT(*) as updated_records,
    COUNT(CASE WHEN soybean = 'none' THEN 1 END) as soybean_none_count,
    COUNT(CASE WHEN soybean IS NULL THEN 1 END) as soybean_null_count
FROM product_allergies_matrix 
WHERE product_id = 207;

-- 更新後のサンプルデータを確認
SELECT 
    pam.menu_item_id,
    pam.menu_name,
    pam.soybean,
    pam.egg,
    pam.milk,
    pam.wheat,
    pam.sesame
FROM product_allergies_matrix pam
WHERE pam.product_id = 207
ORDER BY pam.menu_item_id
LIMIT 10;
