-- すべてのビューにSECURITY INVOKERオプションを設定
-- PostgreSQL 15以降で推奨される方法

-- ==============================================
-- ステップ1: 現在のビューオプションを確認
-- ==============================================

SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN ('v_product_allergies', 'product_allergies_matrix_json', 'vw_company_card_eligible')
ORDER BY c.relname;

-- ==============================================
-- ステップ2: v_product_allergiesにSECURITY INVOKERを設定
-- ==============================================

ALTER VIEW public.v_product_allergies SET (security_invoker = true);

-- ==============================================
-- ステップ3: product_allergies_matrix_jsonにSECURITY INVOKERを設定
-- ==============================================

ALTER VIEW public.product_allergies_matrix_json SET (security_invoker = true);

-- ==============================================
-- ステップ4: vw_company_card_eligibleにSECURITY INVOKERを設定
-- ==============================================

ALTER VIEW public.vw_company_card_eligible SET (security_invoker = true);

-- ==============================================
-- ステップ5: 修正後のビューオプションを確認
-- ==============================================

SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE 
    WHEN c.reloptions IS NULL THEN '⚠️ No options set'
    WHEN c.reloptions::text LIKE '%security_invoker%' THEN '✅ SECURITY INVOKER enabled'
    ELSE '❌ SECURITY INVOKER not set'
  END as security_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN ('v_product_allergies', 'product_allergies_matrix_json', 'vw_company_card_eligible')
ORDER BY c.relname;

-- ==============================================
-- ステップ6: すべてのpublicビューのセキュリティ状態を確認
-- ==============================================

SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE 
    WHEN c.reloptions IS NULL THEN '⚠️ No security_invoker option'
    WHEN c.reloptions::text LIKE '%security_invoker=true%' THEN '✅ SECURITY INVOKER = true'
    WHEN c.reloptions::text LIKE '%security_invoker=false%' THEN '❌ SECURITY INVOKER = false'
    ELSE '⚠️ Unknown status'
  END as security_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
ORDER BY c.relname;

-- ==============================================
-- 完了メッセージ
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'All views updated with security_invoker = true';
  RAISE NOTICE '===================================';
END $$;




