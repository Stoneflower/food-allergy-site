-- 検索で商品が出ない問題のデバッグ

-- 1. 最新のimport_jobsを確認
SELECT 
    id,
    status
FROM import_jobs 
ORDER BY id DESC 
LIMIT 3;

-- 2. 最新のstaging_importsを確認（最初の5行）
SELECT 
    import_batch_id,
    row_no,
    raw_product_name,
    raw_category,
    raw_branch_name,
    raw_address,
    raw_menu_name,
    egg,
    milk,
    wheat,
    created_at
FROM staging_imports 
ORDER BY created_at DESC, row_no
LIMIT 5;

-- 3. productsテーブルの確認
SELECT 
    id,
    name,
    brand,
    category,
    created_at
FROM products 
ORDER BY created_at DESC
LIMIT 5;

-- 4. store_locationsテーブルの確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY created_at DESC
LIMIT 5;

-- 5. menu_itemsテーブルの確認
SELECT 
    id,
    product_id,
    name,
    price,
    created_at
FROM menu_items 
ORDER BY created_at DESC
LIMIT 5;

-- 6. menu_item_allergiesテーブルの確認
SELECT 
    id,
    menu_item_id,
    presence_type,
    created_at
FROM menu_item_allergies 
ORDER BY created_at DESC
LIMIT 5;

-- 7. 検索用ビューの確認（びっくりドンキー関連）
SELECT 
    product_name,
    brand,
    category,
    branch_name,
    address,
    menu_name,
    allergy_slug,
    presence_type,
    created_at
FROM v_product_allergies_long 
WHERE product_name LIKE '%びっくり%' 
   OR product_name LIKE '%ドンキー%'
   OR brand LIKE '%ハンバーグ%'
ORDER BY created_at DESC
LIMIT 10;

-- 8. 全データの件数確認
SELECT 
    'import_jobs' as table_name, COUNT(*) as count FROM import_jobs
UNION ALL
SELECT 
    'staging_imports' as table_name, COUNT(*) as count FROM staging_imports
UNION ALL
SELECT 
    'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 
    'store_locations' as table_name, COUNT(*) as count FROM store_locations
UNION ALL
SELECT 
    'menu_items' as table_name, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 
    'menu_item_allergies' as table_name, COUNT(*) as count FROM menu_item_allergies
UNION ALL
SELECT 
    'v_product_allergies_long' as table_name, COUNT(*) as count FROM v_product_allergies_long;
