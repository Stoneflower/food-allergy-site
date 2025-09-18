-- store_locationsテーブルの詳細調査

-- 1. store_locationsテーブルの全データを確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY id DESC;

-- 2. productsテーブルからびっくりドンキーのIDを確認
SELECT id, name, brand, category 
FROM products 
WHERE name LIKE '%びっくり%' OR name LIKE '%ドンキー%';

-- 3. staging_importsから最新のデータを確認
SELECT DISTINCT 
    raw_product_name,
    raw_branch_name,
    raw_address
FROM staging_imports 
WHERE raw_product_name LIKE '%びっくり%' OR raw_product_name LIKE '%ドンキー%'
ORDER BY raw_address;

-- 4. テーブルの件数を再確認
SELECT 
    'store_locations' as table_name, 
    COUNT(*) as count 
FROM store_locations;