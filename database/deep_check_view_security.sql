-- ビューのSECURITY DEFINERプロパティを詳細に確認

-- 1. pg_classでビューのオプションを確認
SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options,
  CASE 
    WHEN c.reloptions IS NULL THEN 'No options set'
    ELSE array_to_string(c.reloptions, ', ')
  END as options_string
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN ('v_product_allergies', 'product_allergies_matrix_json', 'vw_company_card_eligible')
ORDER BY c.relname;

-- 2. すべてのビューのオプションを確認
SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
ORDER BY c.relname;

-- 3. ビューの完全な定義を確認（SECURITY DEFINERが定義に含まれているか）
\d+ v_product_allergies
\d+ product_allergies_matrix_json
\d+ vw_company_card_eligible

-- 4. pg_get_viewdefで完全な定義を取得
SELECT 
  'v_product_allergies' as view_name,
  pg_get_viewdef('public.v_product_allergies'::regclass, false) as definition;

SELECT 
  'product_allergies_matrix_json' as view_name,
  pg_get_viewdef('public.product_allergies_matrix_json'::regclass, false) as definition;

SELECT 
  'vw_company_card_eligible' as view_name,
  pg_get_viewdef('public.vw_company_card_eligible'::regclass, false) as definition;
