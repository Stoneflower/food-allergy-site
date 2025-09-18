-- store_locationsの現在の状況を確認

-- 1. store_locationsテーブルの全データ
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY id DESC;

-- 2. productsテーブルからびっくりドンキーのIDを確認
SELECT 
    id,
    name,
    brand,
    category
FROM products 
WHERE name LIKE '%びっくり%' OR name LIKE '%ドンキー%';

-- 3. 最新のstaging_importsから住所情報を確認
SELECT DISTINCT 
    raw_address,
    COUNT(*) as count
FROM staging_imports 
WHERE raw_product_name LIKE '%びっくり%' OR raw_product_name LIKE '%ドンキー%'
GROUP BY raw_address
ORDER BY count DESC;

-- 4. 各テーブルの件数
SELECT 
    'store_locations' as table_name, COUNT(*) as count FROM store_locations
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 
    'staging_imports' as table_name, COUNT(*) as count FROM staging_imports;
