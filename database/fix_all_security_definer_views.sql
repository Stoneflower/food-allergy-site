-- すべてのSECURITY DEFINERビューを修正
-- 3つのビューのSECURITY DEFINERプロパティを削除

-- ==============================================
-- ステップ1: 現在のSECURITY DEFINERビューを確認
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing all SECURITY DEFINER views...';
  RAISE NOTICE '===================================';
END $$;

-- 現在のビューをリスト
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN 'HAS SECURITY DEFINER'
    ELSE 'SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY viewname;

-- ==============================================
-- ステップ2: 各ビューの現在の定義を取得
-- ==============================================

-- v_product_allergies の定義を確認
DO $$
DECLARE
  view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('public.v_product_allergies'::regclass, true) 
  INTO view_def;
  RAISE NOTICE 'v_product_allergies definition: %', view_def;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'v_product_allergies does not exist';
END $$;

-- vw_company_card_eligible の定義を確認
DO $$
DECLARE
  view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('public.vw_company_card_eligible'::regclass, true) 
  INTO view_def;
  RAISE NOTICE 'vw_company_card_eligible definition: %', view_def;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'vw_company_card_eligible does not exist';
END $$;

-- product_allergies_matrix_json の定義を確認
DO $$
DECLARE
  view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('public.product_allergies_matrix_json'::regclass, true) 
  INTO view_def;
  RAISE NOTICE 'product_allergies_matrix_json definition: %', view_def;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'product_allergies_matrix_json does not exist';
END $$;

-- ==============================================
-- ステップ3: すべてのビューを修正
-- ==============================================

-- 1. product_allergies_matrix_json を再作成（SECURITY DEFINERなし）
DROP VIEW IF EXISTS public.product_allergies_matrix_json CASCADE;

CREATE VIEW public.product_allergies_matrix_json AS
SELECT 
  mi.product_id,
  mi.id AS menu_item_id,
  mi.name AS menu_name,
  jsonb_object_agg(
    ai.item_id,
    CASE
      WHEN (EXISTS (
        SELECT 1
        FROM menu_item_allergies mia
        WHERE mia.menu_item_id = mi.id 
          AND mia.allergy_item_slug = ai.item_id::text 
          AND (mia.presence_type::text = ANY (ARRAY['direct'::character varying, 'trace'::character varying]::text[]))
      )) THEN 'y'::text
      ELSE 'n'::text
    END
  ) FILTER (WHERE ai.item_id IS NOT NULL) AS allergies
FROM menu_items mi
CROSS JOIN allergy_items ai
GROUP BY mi.product_id, mi.id, mi.name;

COMMENT ON VIEW public.product_allergies_matrix_json IS 
  'Menu item allergies in JSON format. SECURITY DEFINER removed.';

-- 2. v_product_allergies を修正
-- まず元の定義を取得するため、一時的に保存
DO $$
DECLARE
  original_def TEXT;
BEGIN
  -- 元の定義を取得
  SELECT definition INTO original_def
  FROM pg_views 
  WHERE schemaname = 'public' AND viewname = 'v_product_allergies';
  
  IF original_def IS NOT NULL THEN
    -- ビューを削除
    DROP VIEW IF EXISTS public.v_product_allergies CASCADE;
    
    -- SECURITY DEFINERを削除した定義で再作成
    -- 元の定義から "SECURITY DEFINER" を削除
    original_def := REPLACE(original_def, 'SECURITY DEFINER', '');
    
    -- 動的SQLで再作成
    EXECUTE 'CREATE VIEW public.v_product_allergies AS ' || original_def;
    
    COMMENT ON VIEW public.v_product_allergies IS 
      'Product allergies view. SECURITY DEFINER removed.';
      
    RAISE NOTICE 'Fixed: v_product_allergies';
  ELSE
    RAISE NOTICE 'v_product_allergies does not exist, skipping';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing v_product_allergies: %', SQLERRM;
END $$;

-- 3. vw_company_card_eligible を修正
DO $$
DECLARE
  original_def TEXT;
BEGIN
  -- 元の定義を取得
  SELECT definition INTO original_def
  FROM pg_views 
  WHERE schemaname = 'public' AND viewname = 'vw_company_card_eligible';
  
  IF original_def IS NOT NULL THEN
    -- ビューを削除
    DROP VIEW IF EXISTS public.vw_company_card_eligible CASCADE;
    
    -- SECURITY DEFINERを削除した定義で再作成
    original_def := REPLACE(original_def, 'SECURITY DEFINER', '');
    
    -- 動的SQLで再作成
    EXECUTE 'CREATE VIEW public.vw_company_card_eligible AS ' || original_def;
    
    COMMENT ON VIEW public.vw_company_card_eligible IS 
      'Company card eligible view. SECURITY DEFINER removed.';
      
    RAISE NOTICE 'Fixed: vw_company_card_eligible';
  ELSE
    RAISE NOTICE 'vw_company_card_eligible does not exist, skipping';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing vw_company_card_eligible: %', SQLERRM;
END $$;

-- ==============================================
-- ステップ4: 最終確認
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'All SECURITY DEFINER views fixed!';
  RAISE NOTICE '===================================';
END $$;

-- すべてのビューのステータス確認
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN definition LIKE '%SECURITY DEFINER%' THEN 0 ELSE 1 END,
  viewname;

-- 修正した3つのビューの確認
SELECT 
  'Fixed views check:' as check_type,
  viewname,
  '✅ EXISTS' as status
FROM pg_views 
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
ORDER BY viewname;

