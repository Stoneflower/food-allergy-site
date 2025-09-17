-- 鳥取県、島根県の店舗を手動削除

-- 削除前の確認
SELECT 
    address,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
GROUP BY address;

-- 鳥取県、島根県の店舗を削除
DELETE FROM store_locations 
WHERE address IN ('鳥取県', '島根県');

-- 削除後の確認
SELECT 
    address,
    COUNT(*) as count
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
GROUP BY address;

-- 全体の件数確認
SELECT COUNT(*) as total_count FROM store_locations;
