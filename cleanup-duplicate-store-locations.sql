-- store_locationsテーブルの重複削除
-- 同じproduct_id + address + phoneの組み合わせで、最新のもの（created_atが最新）のみを残す

-- 1. まず重複の状況を確認
SELECT 
    product_id,
    address,
    phone,
    COUNT(*) as duplicate_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM store_locations 
WHERE address IS NOT NULL AND phone IS NOT NULL
GROUP BY product_id, address, phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, product_id, address, phone;

-- 2. 重複削除（最新のもの以外を削除）
WITH ranked_locations AS (
    SELECT 
        id,
        product_id,
        address,
        phone,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY product_id, address, phone 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM store_locations
    WHERE address IS NOT NULL AND phone IS NOT NULL
)
DELETE FROM store_locations 
WHERE id IN (
    SELECT id 
    FROM ranked_locations 
    WHERE rn > 1
);

-- 3. 削除後の確認
SELECT 
    product_id,
    address,
    phone,
    COUNT(*) as count_after_cleanup
FROM store_locations 
WHERE address IS NOT NULL AND phone IS NOT NULL
GROUP BY product_id, address, phone
HAVING COUNT(*) > 1
ORDER BY count_after_cleanup DESC, product_id, address, phone;

-- 4. 全体の件数確認
SELECT 
    'Before cleanup' as status,
    COUNT(*) as total_count
FROM store_locations
UNION ALL
SELECT 
    'After cleanup' as status,
    COUNT(*) as total_count
FROM store_locations;
