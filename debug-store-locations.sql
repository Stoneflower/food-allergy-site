-- store_locationsテーブルが空の原因を調査

-- 1. staging_importsの最新データを確認
SELECT 
    import_batch_id,
    row_no,
    raw_product_name,
    raw_category,
    raw_address,
    raw_branch_name
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969'
ORDER BY row_no 
LIMIT 5;

-- 2. productsテーブルの最新データを確認
SELECT 
    id,
    name,
    category,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. store_locationsテーブルの全データを確認
SELECT 
    id,
    product_id,
    address,
    branch_name,
    created_at
FROM store_locations 
ORDER BY created_at DESC;

-- 4. import_jobsの最新ジョブの詳細を確認
SELECT 
    id,
    status,
    started_at,
    finished_at,
    source_file_name,
    stats
FROM import_jobs 
WHERE id = 'd48f9586-1d04-4a12-8b86-e541fdd43969';

-- 5. staging_importsの住所データを確認
SELECT 
    COUNT(*) as total_rows,
    COUNT(raw_address) as rows_with_address,
    COUNT(CASE WHEN raw_address IS NOT NULL AND raw_address != '' THEN 1 END) as non_empty_addresses
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969';

-- 6. staging_importsの商品名とカテゴリを確認
SELECT 
    COUNT(*) as total_rows,
    COUNT(raw_product_name) as rows_with_product_name,
    COUNT(raw_category) as rows_with_category,
    COUNT(DISTINCT raw_product_name) as unique_product_names,
    COUNT(DISTINCT raw_category) as unique_categories
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969';

-- 7. 商品名とカテゴリの具体例を確認
SELECT DISTINCT
    raw_product_name,
    raw_category,
    raw_address
FROM staging_imports 
WHERE import_batch_id = 'd48f9586-1d04-4a12-8b86-e541fdd43969'
LIMIT 10;
