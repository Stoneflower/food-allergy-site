-- 特定のIDの店舗を削除

-- 削除前の確認
SELECT 
    id,
    address,
    product_id,
    created_at
FROM store_locations 
WHERE id IN (570, 571);

-- 特定のIDの店舗を削除
DELETE FROM store_locations 
WHERE id IN (570, 571);

-- 削除後の確認
SELECT COUNT(*) as total_count FROM store_locations;

-- 鳥取県、島根県の存在確認
SELECT 
    address,
    COUNT(*) as count
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
GROUP BY address;
