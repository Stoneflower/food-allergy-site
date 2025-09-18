-- store_locationsデータを復元

-- 1. 既存のproductsテーブルから商品情報を確認
SELECT id, name, brand, category 
FROM products 
ORDER BY id;

-- 2. 既存のmenu_itemsから店舗情報を推測
SELECT DISTINCT 
    p.id as product_id,
    p.name as product_name,
    p.brand,
    p.category
FROM products p
JOIN menu_items mi ON p.id = mi.product_id
ORDER BY p.id;

-- 3. staging_importsから店舗情報を復元
SELECT DISTINCT 
    raw_product_name,
    raw_branch_name,
    raw_address
FROM staging_imports 
WHERE raw_product_name IS NOT NULL
ORDER BY raw_product_name, raw_address;

-- 4. store_locationsにデータを復元
INSERT INTO store_locations (product_id, branch_name, address, source_url, store_list_url)
SELECT DISTINCT
    p.id as product_id,
    COALESCE(si.raw_branch_name, p.brand, '店舗') as branch_name,
    COALESCE(si.raw_address, '住所未設定') as address,
    'https://example.com' as source_url,
    'https://example.com/stores' as store_list_url
FROM products p
LEFT JOIN staging_imports si ON p.name = si.raw_product_name
WHERE p.id IS NOT NULL
ON CONFLICT (product_id, branch_name, address) DO NOTHING;

-- 5. 復元結果を確認
SELECT 
    id,
    product_id,
    branch_name,
    address,
    created_at
FROM store_locations 
ORDER BY product_id, address;
