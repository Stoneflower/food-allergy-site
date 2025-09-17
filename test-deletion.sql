-- 削除処理のテスト

-- 1. 削除前の状態確認
SELECT 
    id,
    address,
    product_id,
    created_at
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, created_at;

-- 2. 削除処理の実行
DELETE FROM store_locations 
WHERE address IN ('鳥取県', '島根県');

-- 3. 削除後の状態確認
SELECT 
    id,
    address,
    product_id,
    created_at
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, created_at;

-- 4. 全体の件数確認
SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT address) as prefecture_count
FROM store_locations;
