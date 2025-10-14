-- SECURITY DEFINERビューが存在しないことを確認

-- 1. pg_viewsでSECURITY DEFINERをチェック
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as security_check,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('v_product_allergies', 'product_allergies_matrix_json', 'vw_company_card_eligible')
ORDER BY viewname;

-- 2. pg_classでビューのオプションを確認
SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE 
    WHEN c.reloptions IS NULL THEN '✅ No options (SAFE)'
    WHEN c.reloptions::text LIKE '%security_definer%' THEN '❌ HAS security_definer'
    ELSE '✅ SAFE'
  END as option_check
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN ('v_product_allergies', 'product_allergies_matrix_json', 'vw_company_card_eligible')
ORDER BY c.relname;

-- 3. pg_get_viewdefで完全な定義を確認
SELECT 
  'v_product_allergies' as view_name,
  pg_get_viewdef('public.v_product_allergies'::regclass, true) as full_definition;

SELECT 
  'product_allergies_matrix_json' as view_name,
  pg_get_viewdef('public.product_allergies_matrix_json'::regclass, true) as full_definition;

SELECT 
  'vw_company_card_eligible' as view_name,
  pg_get_viewdef('public.vw_company_card_eligible'::regclass, true) as full_definition;

-- 4. すべてのpublicビューのセキュリティ状態
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as security_check
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 1
    ELSE 2
  END,
  viewname;


