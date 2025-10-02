-- productId 202「菓道」のデバッグ用SQLクエリ

-- 1. 基本的なproduct情報
SELECT COUNT(*) as product_count FROM products WHERE id = 202;

-- 2. productの詳細情報
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    p.created_at,
    p.updated_at
FROM products p
WHERE p.id = 202;

-- 3. menu_items情報
SELECT 
    mi.id,
    mi.product_id,
    mi.name,
    mi.price,
    mi.notes,
    mi.active
FROM menu_items mi
WHERE mi.product_id = 202
ORDER BY mi.id
LIMIT 10;

-- 4. product_allergies_matrix情報
SELECT 
    pam.product_id,
    pam.menu_item_id,
    pam.id,
    pam.menu_name,
    pam.egg,
    pam.milk,
    pam.wheat,
    pam.buckwheat,
    pam.peanut,
    pam.shrimp,
    pam.crab,
    pam.walnut,
    pam.almond,
    pam.abalone,
    pam.squid,
    pam.salmon_roe,
    pam.orange,
    pam.cashew,
    pam.kiwi,
    pam.beef,
    pam.gelatin,
    pam.sesame,
    pam.salmon,
    pam.mackerel,
    pam.soybean,
    pam.chicken,
    pam.banana,
    pam.pork,
    pam.matsutake,
    pam.peach,
    pam.yam,
    pam.apple,
    pam.created_at,
    pam.updated_at,
    pam.macadamia
FROM product_allergies_matrix pam
WHERE pam.product_id = 202
ORDER BY pam.menu_item_id
LIMIT 10;

-- 5. product_store_locations情報
SELECT 
    psl.product_id,
    psl.store_location_id,
    sl.address
FROM product_store_locations psl
JOIN store_locations sl ON psl.store_location_id = sl.id
WHERE psl.product_id = 202
LIMIT 10;

-- 6. product_allergies情報
SELECT 
    pa.product_id,
    pa.allergy_item_id,
    ai.name as allergy_name,
    ai.slug
FROM product_allergies pa
JOIN allergy_items ai ON pa.allergy_item_id::text = ai.id::text
WHERE pa.product_id = 202
LIMIT 10;

-- 7. アレルギー項目のnull値チェック
SELECT 
    pam.product_id,
    pam.menu_item_id,
    pam.menu_name,
    CASE 
        WHEN pam.egg IS NULL THEN 'egg: NULL'
        ELSE 'egg: ' || pam.egg
    END as egg_status,
    CASE 
        WHEN pam.milk IS NULL THEN 'milk: NULL'
        ELSE 'milk: ' || pam.milk
    END as milk_status,
    CASE 
        WHEN pam.wheat IS NULL THEN 'wheat: NULL'
        ELSE 'wheat: ' || pam.wheat
    END as wheat_status,
    CASE 
        WHEN pam.soybean IS NULL THEN 'soybean: NULL'
        ELSE 'soybean: ' || pam.soybean
    END as soybean_status,
    CASE 
        WHEN pam.sesame IS NULL THEN 'sesame: NULL'
        ELSE 'sesame: ' || pam.sesame
    END as sesame_status
FROM product_allergies_matrix pam
WHERE pam.product_id = 202
  AND (pam.egg IS NULL OR pam.milk IS NULL OR pam.wheat IS NULL 
       OR pam.soybean IS NULL OR pam.sesame IS NULL)
LIMIT 10;
