-- store_locationsテーブルに直接データを挿入

-- 1. 直接データを挿入（ユニーク制約を回避）
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
VALUES 
    (7, 'ハンバーグレストラン', '沖縄県', 'https://example.com', 'https://example.com/stores');

-- 2. 挿入結果を確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7;

-- 3. テーブルの件数を確認
SELECT COUNT(*) as store_locations_count FROM store_locations;
