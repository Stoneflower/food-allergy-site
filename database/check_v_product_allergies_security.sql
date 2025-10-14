-- v_product_allergies ビューのSECURITY DEFINER状態を確認

-- 1. ビューの定義を確認
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'v_product_allergies';

-- 2. ビューの詳細定義を確認
SELECT pg_get_viewdef('public.v_product_allergies'::regclass, true) as view_definition;

-- 3. pg_class経由でビューのオプションを確認
SELECT 
  c.relname AS view_name,
  c.reloptions AS view_options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname = 'v_product_allergies';

-- 4. すべてのビューでSECURITY DEFINERをチェック
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as security_check
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;


