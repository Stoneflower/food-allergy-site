-- v_product_allergies ビューの現在の定義を取得

-- pg_viewsから定義を取得
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'v_product_allergies';

-- pg_get_viewdefから定義を取得
SELECT pg_get_viewdef('public.v_product_allergies'::regclass, true) as view_definition;

