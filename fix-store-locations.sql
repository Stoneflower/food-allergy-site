-- store_locationsテーブルにデータを作成

-- 1. 最新のstaging_importsからユニークな店舗情報を取得
SELECT DISTINCT 
    raw_product_name,
    raw_category,
    raw_branch_name,
    raw_address
FROM staging_imports 
WHERE import_batch_id = '415ab7c3-fa0e-449d-bf83-c69f4344223a'
ORDER BY raw_address;

-- 2. productsテーブルからびっくりドンキーのIDを確認
SELECT id, name, brand, category 
FROM products 
WHERE name = 'びっくりドンキー';

-- 3. store_locationsテーブルにデータを挿入
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
SELECT 
    7 as product_id,  -- びっくりドンキーのproduct_id
    'ハンバーグレストラン' as branch_name,
    raw_address,
    'https://example.com' as source_url,
    'https://example.com/stores' as store_list_url
FROM (
    SELECT DISTINCT raw_address
    FROM staging_imports 
    WHERE import_batch_id = '415ab7c3-fa0e-449d-bf83-c69f4344223a'
) AS unique_addresses
ON CONFLICT (product_id, address) DO NOTHING;

-- 4. 作成されたstore_locationsを確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY created_at DESC;
