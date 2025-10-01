-- productId 207のアレルギー判定テスト

-- 1. 現在のアレルギー設定を確認（主要なアレルギー項目）
SELECT 
    pam.menu_item_id,
    pam.menu_name,
    -- 主要なアレルギー項目の値を確認
    pam.egg,
    pam.milk,
    pam.wheat,
    pam.soybean,
    pam.sesame,
    pam.apple,
    pam.chicken,
    pam.pork
FROM product_allergies_matrix pam
WHERE pam.product_id = 207
  AND pam.menu_item_id IN (17715, 17716, 17717, 17718, 17719) -- 最初の5つのメニュー
ORDER BY pam.menu_item_id;

-- 2. productId 207で"direct"が設定されているアレルギー項目を確認
SELECT 
    'egg' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND egg = 'direct'
UNION ALL
SELECT 
    'milk' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND milk = 'direct'
UNION ALL
SELECT 
    'wheat' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND wheat = 'direct'
UNION ALL
SELECT 
    'soybean' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND soybean = 'direct'
UNION ALL
SELECT 
    'sesame' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND sesame = 'direct'
UNION ALL
SELECT 
    'apple' as allergy_type,
    COUNT(*) as direct_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND apple = 'direct'
ORDER BY direct_count DESC;

-- 3. productId 207で"none"が設定されているアレルギー項目を確認
SELECT 
    'egg' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND egg = 'none'
UNION ALL
SELECT 
    'milk' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND milk = 'none'
UNION ALL
SELECT 
    'wheat' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND wheat = 'none'
UNION ALL
SELECT 
    'soybean' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND soybean = 'none'
UNION ALL
SELECT 
    'sesame' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND sesame = 'none'
UNION ALL
SELECT 
    'apple' as allergy_type,
    COUNT(*) as none_count
FROM product_allergies_matrix 
WHERE product_id = 207 AND apple = 'none'
ORDER BY none_count DESC;
