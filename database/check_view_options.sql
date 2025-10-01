-- ビューの詳細オプションを確認
-- SECURITY DEFINERがビューオプションに設定されていないか確認

-- ==============================================
-- ビューのオプションを確認
-- ==============================================

SELECT 
  c.relname as view_name,
  c.reloptions as view_options,
  pg_get_viewdef(c.oid, true) as full_definition
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'product_allergies_matrix_json'
  AND c.relkind = 'v';

-- ==============================================
-- すべてのビューのオプションを確認
-- ==============================================

SELECT 
  n.nspname as schema_name,
  c.relname as view_name,
  c.reloptions as view_options,
  CASE 
    WHEN c.reloptions IS NULL THEN '✅ No options'
    WHEN array_to_string(c.reloptions, ',') LIKE '%security_definer%' THEN '❌ Has security_definer option'
    ELSE '✅ Has other options'
  END as option_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
  AND c.relkind = 'v'
ORDER BY c.relname;

