-- v_product_allergies ビューを再作成
-- SECURITY DEFINERなしで安全に作成

-- ==============================================
-- ステップ1: 既存のビューを削除
-- ==============================================

DROP VIEW IF EXISTS public.v_product_allergies CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Recreating v_product_allergies view...';
END $$;

-- ==============================================
-- ステップ2: SECURITY DEFINERなしでビューを再作成
-- ==============================================

CREATE VIEW public.v_product_allergies AS
SELECT 
  pa.id,
  pa.product_id,
  ai.slug AS allergy_code,
  ai.name AS allergy_name,
  pa.presence_type,
  pa.amount_level,
  pa.notes,
  pa.created_at
FROM product_allergies pa
JOIN allergy_items ai ON ai.id = pa.allergy_item_id_int;

-- コメント設定
COMMENT ON VIEW public.v_product_allergies IS 
  'Product allergies with allergy item details. No SECURITY DEFINER - uses invoker permissions.';

-- ==============================================
-- ステップ3: アクセス権を設定
-- ==============================================

GRANT SELECT ON public.v_product_allergies TO anon;
GRANT SELECT ON public.v_product_allergies TO authenticated;

-- ==============================================
-- ステップ4: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'View v_product_allergies recreated successfully';
  RAISE NOTICE '===================================';
END $$;

-- ビューの定義を確認
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as definition_check
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'v_product_allergies';

-- ビューが正常に動作するか確認
SELECT 
  'Sample data:' as check_type,
  COUNT(*) as row_count
FROM public.v_product_allergies
LIMIT 1;

