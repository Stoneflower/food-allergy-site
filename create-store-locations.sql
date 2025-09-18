-- store_locationsテーブルにデータを作成（簡単版）

-- 1. 最新のstaging_importsからユニークな住所を取得
SELECT DISTINCT raw_address
FROM staging_imports 
ORDER BY raw_address;

-- 2. store_locationsテーブルにデータを挿入
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
    WHERE raw_product_name = 'びっくりドンキー'
) AS unique_addresses;

-- 3. 作成されたstore_locationsを確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY address;
