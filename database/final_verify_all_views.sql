-- すべてのビューを最終確認
-- SECURITY DEFINER が本当に削除されているか徹底チェック

-- ==============================================
-- 1. pg_viewsから定義を確認
-- ==============================================

SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition ILIKE '%SECURITY%DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as definition_check,
  LENGTH(definition) as definition_length
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY viewname;

-- ==============================================
-- 2. pg_classからビューオプションを確認
-- ==============================================

SELECT 
  c.relname as view_name,
  c.reloptions as options,
  CASE 
    WHEN c.reloptions IS NULL THEN '✅ No options'
    WHEN array_to_string(c.reloptions, ',') ILIKE '%security%definer%' THEN '❌ Has security_definer option'
    ELSE '⚠️ Has other options'
  END as option_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
  AND c.relkind = 'v'
ORDER BY c.relname;

-- ==============================================
-- 3. すべてのpublicビューをチェック
-- ==============================================

SELECT 
  viewname,
  CASE 
    WHEN definition ILIKE '%SECURITY%DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN definition ILIKE '%SECURITY%DEFINER%' THEN 0 ELSE 1 END,
  viewname;

-- ==============================================
-- 4. ビューの完全な定義を表示
-- ==============================================

DO $$
DECLARE
  view_rec RECORD;
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Full view definitions:';
  RAISE NOTICE '===================================';
  
  FOR view_rec IN 
    SELECT viewname 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
    ORDER BY viewname
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'View: %', view_rec.viewname;
    RAISE NOTICE 'Definition: %', (SELECT definition FROM pg_views WHERE viewname = view_rec.viewname AND schemaname = 'public');
  END LOOP;
END $$;

