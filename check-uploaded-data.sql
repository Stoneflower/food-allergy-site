-- アップロードされたデータの確認

-- 1. 最新のimport_jobsを確認
SELECT 
    id,
    status,
    created_at,
    updated_at
FROM import_jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. 最新のstaging_importsを確認
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
    wheat
FROM staging_imports 
ORDER BY import_batch_id DESC, row_no
LIMIT 10;

-- 3. productsテーブルの確認
SELECT 
    id,
    name,
    brand,
    category,
    created_at
FROM products 
ORDER BY created_at DESC
LIMIT 10;

-- 4. store_locationsテーブルの確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY created_at DESC
LIMIT 10;

-- 5. menu_itemsテーブルの確認
SELECT 
    id,
    product_id,
    store_location_id,
    name,
    created_at
FROM menu_items 
ORDER BY created_at DESC
LIMIT 10;

-- 6. menu_item_allergiesテーブルの確認
SELECT 
    id,
    menu_item_id,
    allergy_slug,
    presence_type,
    created_at
FROM menu_item_allergies 
ORDER BY created_at DESC
LIMIT 10;

-- 7. 検索用ビューの確認
SELECT 
    product_name,
    brand,
    category,
    branch_name,
    address,
    menu_name,
    allergy_slug,
    presence_type
FROM v_product_allergies_long 
WHERE product_name LIKE '%びっくり%'
ORDER BY created_at DESC
LIMIT 10;