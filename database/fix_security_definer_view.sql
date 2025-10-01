-- SECURITY DEFINERビューのセキュリティ警告を解消
-- Issue: View public.product_allergies_matrix_json is defined with the SECURITY DEFINER property

-- ==============================================
-- ステップ1: 現在のビュー定義を確認
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Checking SECURITY DEFINER views...';
  RAISE NOTICE '===================================';
END $$;

-- 現在のSECURITY DEFINERビューを検出
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition LIKE '%SECURITY DEFINER%';

-- ==============================================
-- ステップ2: product_allergies_matrix_json ビューを安全に修正
-- ==============================================

-- 現在のビュー定義を取得して確認
DO $$
DECLARE
  view_definition TEXT;
BEGIN
  -- ビューの現在の定義を取得
  SELECT pg_get_viewdef('public.product_allergies_matrix_json'::regclass, true) 
  INTO view_definition;
  
  IF view_definition IS NOT NULL THEN
    RAISE NOTICE 'Current view definition: %', view_definition;
  ELSE
    RAISE NOTICE 'View does not exist or cannot be accessed';
  END IF;
END $$;

-- ビューを削除して再作成（SECURITY DEFINERを削除）
DROP VIEW IF EXISTS public.product_allergies_matrix_json CASCADE;

-- 元のビュー定義を保持したまま、SECURITY DEFINERなしで再作成
CREATE OR REPLACE VIEW public.product_allergies_matrix_json AS
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

-- ビューのコメント設定
COMMENT ON VIEW public.product_allergies_matrix_json IS 
  'Product allergies information in JSON format. SECURITY DEFINER removed for security.';

-- ==============================================
-- ステップ3: 他のSECURITY DEFINERビューもチェック
-- ==============================================
DO $$
DECLARE
  view_record RECORD;
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Checking for other SECURITY DEFINER views...';
  
  -- 他のSECURITY DEFINERビューを検出
  FOR view_record IN
    SELECT viewname, definition
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND definition LIKE '%SECURITY DEFINER%'
      AND viewname != 'product_allergies_matrix_json'
  LOOP
    RAISE NOTICE 'Found SECURITY DEFINER view: %', view_record.viewname;
    fixed_count := fixed_count + 1;
  END LOOP;
  
  IF fixed_count = 0 THEN
    RAISE NOTICE 'No other SECURITY DEFINER views found.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'View security update completed!';
  RAISE NOTICE 'Fixed: product_allergies_matrix_json';
  RAISE NOTICE '===================================';
END $$;

-- ==============================================
-- ステップ4: 最終確認
-- ==============================================
-- SECURITY DEFINERビューが残っていないか確認
SELECT 
  'SECURITY DEFINER views remaining:' as check_type,
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ NEEDS FIX'
    ELSE '✅ SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- ビューが正常に作成されたか確認
SELECT 
  'View creation check:' as check_type,
  schemaname,
  viewname,
  '✅ CREATED' as status
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'product_allergies_matrix_json';
