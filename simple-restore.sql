-- 簡単なstore_locations復元

-- 1. びっくりドンキーの店舗情報を復元
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

-- 2. 復元結果を確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
WHERE product_id = 7
ORDER BY address;
