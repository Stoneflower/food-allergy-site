-- ビューのSECURITY属性を詳細に確認
-- Supabaseが検出している可能性のある隠れた属性をチェック

-- ==============================================
-- 1. pg_classからビューの詳細属性を確認
-- ==============================================

SELECT 
  n.nspname as schema_name,
  c.relname as view_name,
  c.relkind as object_type,
  c.reloptions as options,
  c.relacl as access_privileges,
  pg_get_userbyid(c.relowner) as owner
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
  AND c.relkind = 'v'
ORDER BY c.relname;

-- ==============================================
-- 2. ビューの完全な定義を確認（prettified）
-- ==============================================

SELECT 
  viewname,
  pg_get_viewdef(viewname::regclass, true) as full_definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY viewname;

-- ==============================================
-- 3. ビュー定義内のすべてのキーワードをチェック
-- ==============================================

SELECT 
  viewname,
  definition,
  CASE 
    WHEN definition ILIKE '%SECURITY%DEFINER%' THEN '❌ Found SECURITY DEFINER'
    WHEN definition ILIKE '%SECURITY%INVOKER%' THEN '✅ SECURITY INVOKER'
    WHEN definition ILIKE '%SECURITY%' THEN '⚠️ Contains SECURITY keyword'
    ELSE '✅ No SECURITY keyword'
  END as security_check
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY viewname;

-- ==============================================
-- 4. ビューのルール（rewrite rules）を確認
-- ==============================================

SELECT 
  c.relname as view_name,
  r.rulename as rule_name,
  pg_get_ruledef(r.oid, true) as rule_definition
FROM pg_rewrite r
JOIN pg_class c ON r.ev_class = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY c.relname, r.rulename;

-- ==============================================
-- 5. ビューに関連する依存関係を確認
-- ==============================================

SELECT 
  n.nspname || '.' || c.relname as view_name,
  d.deptype as dependency_type,
  dn.nspname || '.' || dc.relname as depends_on
FROM pg_depend d
JOIN pg_class c ON d.refobjid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_class dc ON d.objid = dc.oid
LEFT JOIN pg_namespace dn ON dc.relnamespace = dn.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
  AND c.relkind = 'v'
ORDER BY view_name;

-- ==============================================
-- 6. 最終まとめ
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Deep security check completed';
  RAISE NOTICE 'Review the results above';
  RAISE NOTICE '===================================';
END $$;

