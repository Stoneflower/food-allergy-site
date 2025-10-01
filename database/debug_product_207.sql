-- productId 207のからやまの詳細調査

-- 簡単な確認から開始
-- productId 207が存在するかチェック
SELECT COUNT(*) as product_count FROM products WHERE id = 207;

-- 0. テーブル構造の確認
-- menu_itemsテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'menu_items' 
ORDER BY ordinal_position;

-- store_locationsテーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'store_locations' 
ORDER BY ordinal_position;

-- 1. 基本情報の確認
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.created_at,
    p.updated_at
FROM products p 
WHERE p.id = 207;

-- 2. アレルギー情報（matrix）の確認
SELECT 
    p.id as product_id,
    p.name as product_name,
    pam.menu_item_id,
    pam.*
FROM products p
LEFT JOIN product_allergies_matrix pam ON p.id = pam.product_id
WHERE p.id = 207
ORDER BY pam.menu_item_id;

-- 3. レガシーアレルギー情報の確認
SELECT 
    p.id as product_id,
    p.name as product_name,
    pa.*
FROM products p
LEFT JOIN product_allergies pa ON p.id = pa.product_id
WHERE p.id = 207
ORDER BY pa.allergy_item_id;

-- 4. メニューアイテムの確認
SELECT 
    p.id as product_id,
    p.name as product_name,
    mi.id as menu_item_id,
    mi.name as menu_item_name
FROM products p
LEFT JOIN menu_items mi ON p.id = mi.product_id
WHERE p.id = 207
ORDER BY mi.id;

-- 5. 店舗情報の確認
SELECT 
    p.id as product_id,
    p.name as product_name,
    sl.id as store_location_id,
    sl.address
FROM products p
LEFT JOIN product_store_locations psl ON p.id = psl.product_id
LEFT JOIN store_locations sl ON psl.store_location_id = sl.id
WHERE p.id = 207
ORDER BY sl.id;

-- 6. アレルギー項目の一覧確認
SELECT 
    ai.id,
    ai.slug,
    ai.name,
    ai.category
FROM allergy_items ai
ORDER BY ai.slug;

-- 7. productId 207のmatrixデータでnullでない項目のみ表示
SELECT 
    p.id as product_id,
    p.name as product_name,
    pam.menu_item_id,
    -- 各アレルギー項目の値を確認
    pam.egg,
    pam.milk,
    pam.wheat,
    pam.soybean,
    pam.peanut,
    pam.buckwheat,
    pam.shrimp,
    pam.crab,
    pam.walnut,
    pam.sesame,
    pam.salmon,
    pam.mackerel,
    pam.squid,
    pam.gelatin,
    pam.apple,
    pam.banana,
    pam.kiwi,
    pam.peach,
    pam.beef,
    pam.pork,
    pam.chicken,
    pam.salmon_roe,
    pam.almond,
    pam.cashew,
    pam.macadamia
FROM products p
LEFT JOIN product_allergies_matrix pam ON p.id = pam.product_id
WHERE p.id = 207
ORDER BY pam.menu_item_id;

-- 8. 最近のアレルギー設定変更履歴の確認
SELECT 
    p.id as product_id,
    p.name as product_name,
    pam.created_at,
    pam.updated_at,
    pam.menu_item_id
FROM products p
LEFT JOIN product_allergies_matrix pam ON p.id = pam.product_id
WHERE p.id = 207
ORDER BY pam.updated_at DESC;
