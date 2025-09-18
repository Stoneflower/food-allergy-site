-- 手動でstore_locationsデータを作成

-- 1. 既存のproductsテーブルから商品IDを確認
SELECT id, name, brand, category 
FROM products 
WHERE name LIKE '%びっくり%' OR name LIKE '%ドンキー%';

-- 2. store_locationsにデータを挿入
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
VALUES 
    (7, 'ハンバーグレストラン', '兵庫県', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '大阪府', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '京都府', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '東京都', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '神奈川県', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '愛知県', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '福岡県', 'https://example.com', 'https://example.com/stores'),
    (7, 'ハンバーグレストラン', '沖縄県', 'https://example.com', 'https://example.com/stores')
ON CONFLICT (product_id, branch_name, address) DO NOTHING;

-- 3. 挿入結果を確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY address;

-- 4. 検索テスト用のクエリ
SELECT 
    p.name as product_name,
    p.brand,
    p.category,
    sl.branch_name,
    sl.address
FROM products p
LEFT JOIN store_locations sl ON p.id = sl.product_id
WHERE p.name LIKE '%びっくり%' OR p.name LIKE '%ドンキー%';
