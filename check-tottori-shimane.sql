-- 鳥取県、島根県の詳細確認

-- 鳥取県、島根県の店舗詳細
SELECT 
    id,
    address,
    product_id,
    created_at,
    updated_at
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, id;
