-- store_locationsデータを更新

-- 1. 既存のstore_locationsデータを更新（住所を追加）
UPDATE store_locations 
SET address = '沖縄県'
WHERE product_id = 7 
AND branch_name = 'ハンバーグレストラン'
AND address IS NULL;

-- 2. 新しい住所のデータを追加（既存データがない場合のみ）
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
SELECT 
    7 as product_id,
    'ハンバーグレストラン' as branch_name,
    raw_address,
    'https://example.com' as source_url,
    'https://example.com/stores' as store_list_url
FROM (
    SELECT DISTINCT raw_address
    FROM staging_imports 
    WHERE raw_product_name = 'びっくりドンキー'
    AND raw_address NOT IN (
        SELECT COALESCE(address, '') 
        FROM store_locations 
        WHERE product_id = 7
    )
) AS new_addresses;

-- 3. 更新後のstore_locationsを確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY address;
