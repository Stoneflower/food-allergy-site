-- 削除処理の詳細確認

-- 1. 鳥取県、島根県の詳細情報
SELECT 
    id,
    product_id,
    address,
    phone,
    created_at,
    updated_at
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, created_at;

-- 2. 鳥取県、島根県の作成日時確認
SELECT 
    address,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
GROUP BY address;

-- 3. 最近作成されたレコード（過去1時間以内）
SELECT 
    id,
    product_id,
    address,
    phone,
    created_at
FROM store_locations 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. 鳥取県、島根県のproduct_id確認
SELECT DISTINCT
    address,
    product_id
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, product_id;
