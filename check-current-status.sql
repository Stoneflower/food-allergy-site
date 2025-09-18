-- 現在の状況を確認

-- 1. store_locationsテーブルの現在の状況
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY id DESC;

-- 2. productsテーブルの状況
SELECT 
    id,
    name,
    brand,
    category,
    created_at
FROM products 
ORDER BY id DESC;

-- 3. 各テーブルの件数
SELECT 
    'store_locations' as table_name, COUNT(*) as count FROM store_locations
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 
    'menu_items' as table_name, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 
    'menu_item_allergies' as table_name, COUNT(*) as count FROM menu_item_allergies;