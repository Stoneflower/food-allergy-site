-- 緊急復元用SQL

-- 1. びっくりドンキーの基本的な店舗情報を復元
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
VALUES 
    (7, 'ハンバーグレストラン', '兵庫県', 'https://example.com', 'https://example.com/stores')
ON CONFLICT (product_id, branch_name, address) DO NOTHING;

-- 2. 復元結果を確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7;

-- 3. 検索テスト用のデータ
SELECT 
    p.name as product_name,
    p.brand,
    p.category,
    sl.branch_name,
    sl.address
FROM products p
LEFT JOIN store_locations sl ON p.id = sl.product_id
WHERE p.name LIKE '%びっくり%' OR p.name LIKE '%ドンキー%';
