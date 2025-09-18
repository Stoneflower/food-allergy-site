-- アップロードされたデータの確認用SQL

-- 1. import_jobsテーブルの最新ジョブを確認
SELECT 
    id,
    status,
    started_at,
    finished_at,
    source_file_name
FROM import_jobs 
ORDER BY started_at DESC 
LIMIT 5;

-- 2. staging_importsテーブルの最新データを確認
SELECT 
    import_batch_id,
    row_no,
    raw_product_name,
    raw_category,
    raw_address,
    egg,
    milk,
    wheat
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969'
ORDER BY row_no 
LIMIT 10;

-- 3. productsテーブルの最新データを確認
SELECT 
    id,
    name,
    category,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. store_locationsテーブルの最新データを確認
SELECT 
    id,
    product_id,
    address,
    branch_name,
    created_at
FROM store_locations 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. menu_itemsテーブルの最新データを確認
SELECT 
    id,
    product_id,
    name,
    created_at
FROM menu_items 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. menu_item_allergiesテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'menu_item_allergies' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. menu_item_allergiesテーブルの最新データを確認（構造確認後）
SELECT * FROM menu_item_allergies 
ORDER BY id DESC 
LIMIT 10;

-- 8. 総データ数を確認
SELECT 
    'import_jobs' as table_name, 
    COUNT(*) as count 
FROM import_jobs
UNION ALL
SELECT 
    'staging_imports' as table_name, 
    COUNT(*) as count 
FROM staging_imports
UNION ALL
SELECT 
    'products' as table_name, 
    COUNT(*) as count 
FROM products
UNION ALL
SELECT 
    'store_locations' as table_name, 
    COUNT(*) as count 
FROM store_locations
UNION ALL
SELECT 
    'menu_items' as table_name, 
    COUNT(*) as count 
FROM menu_items
UNION ALL
SELECT 
    'menu_item_allergies' as table_name, 
    COUNT(*) as count 
FROM menu_item_allergies;
