-- 既存のstore_locationsデータを確認

-- 1. 既存のstore_locationsデータを確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY created_at DESC;

-- 2. 最新のstaging_importsからユニークな住所を確認
SELECT DISTINCT raw_address
FROM staging_imports 
WHERE raw_product_name = 'びっくりドンキー'
ORDER BY raw_address;

-- 3. 既存データと新しいデータの差分を確認
SELECT DISTINCT raw_address
FROM staging_imports 
WHERE raw_product_name = 'びっくりドンキー'
AND raw_address NOT IN (
    SELECT address 
    FROM store_locations 
    WHERE product_id = 7
)
ORDER BY raw_address;
