-- 商品マッチングと店舗情報の確認

-- 1. 既存のproductsテーブルを確認
SELECT 
    id,
    name,
    category,
    created_at
FROM products 
ORDER BY id;

-- 2. 最新のstaging_importsの商品名を確認
SELECT DISTINCT
    raw_product_name,
    raw_category,
    COUNT(*) as row_count
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969'
GROUP BY raw_product_name, raw_category
ORDER BY row_count DESC;

-- 3. store_locationsの最新データを確認
SELECT 
    id,
    product_id,
    address,
    branch_name,
    created_at
FROM store_locations 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. menu_itemsの最新データを確認
SELECT 
    id,
    product_id,
    name,
    created_at
FROM menu_items 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. 商品ID 7（びっくりドンキー）の関連データを確認
SELECT 
    'products' as table_name,
    id,
    name,
    category
FROM products 
WHERE id = 7
UNION ALL
SELECT 
    'store_locations' as table_name,
    id,
    address as name,
    branch_name as category
FROM store_locations 
WHERE product_id = 7
UNION ALL
SELECT 
    'menu_items' as table_name,
    id,
    name,
    '' as category
FROM menu_items 
WHERE product_id = 7
ORDER BY table_name, id;
