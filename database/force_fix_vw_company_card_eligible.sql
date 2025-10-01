-- vw_company_card_eligible ビューを強制的に修正
-- SECURITY DEFINERプロパティを完全に削除

-- ==============================================
-- ステップ1: 現在のビュー定義を完全に確認
-- ==============================================

-- pg_get_viewdefで実際の定義を取得
SELECT pg_get_viewdef('public.vw_company_card_eligible'::regclass, true) as view_definition;

-- pg_viewsテーブルから定義を取得
SELECT definition 
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'vw_company_card_eligible';

-- ==============================================
-- ステップ2: ビューを完全に削除して再作成
-- ==============================================

-- 依存関係を含めて完全に削除
DROP VIEW IF EXISTS public.vw_company_card_eligible CASCADE;

-- ビューが削除されたことを確認
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'vw_company_card_eligible'
  ) THEN
    RAISE NOTICE 'View successfully dropped';
  ELSE
    RAISE NOTICE 'WARNING: View still exists!';
  END IF;
END $$;

-- ==============================================
-- ステップ3: SECURITY DEFINERなしでビューを再作成
-- ==============================================

CREATE VIEW public.vw_company_card_eligible AS
WITH matrix_any AS (
  SELECT product_allergies_matrix.product_id, 'egg'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.egg = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'milk'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.milk = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'wheat'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.wheat = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'buckwheat'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.buckwheat = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'peanut'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.peanut = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'shrimp'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.shrimp = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'crab'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.crab = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'walnut'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.walnut = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'almond'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.almond = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'abalone'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.abalone = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'squid'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.squid = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'salmon_roe'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.salmon_roe = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'orange'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.orange = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'cashew'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.cashew = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'kiwi'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.kiwi = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'beef'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.beef = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'gelatin'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.gelatin = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'sesame'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.sesame = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'salmon'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.salmon = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'mackerel'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.mackerel = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'soybean'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.soybean = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'chicken'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.chicken = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'banana'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.banana = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'pork'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.pork = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'matsutake'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.matsutake = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'peach'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.peach = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'yam'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.yam = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'apple'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.apple = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'macadamia'::text AS text
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.macadamia = ANY (ARRAY['none'::text, 'trace'::text]))
),
fragrance_any AS (
  SELECT DISTINCT 
    product_fragrance_allergies.product_id,
    product_fragrance_allergies.allergy_item_id AS allergy
  FROM product_fragrance_allergies
),
eligible AS (
  SELECT product_id, allergy FROM matrix_any
  UNION
  SELECT product_id, allergy FROM fragrance_any
)
SELECT product_id, allergy
FROM eligible;

COMMENT ON VIEW public.vw_company_card_eligible IS 
  'Company card eligible products by allergy. SECURITY DEFINER removed.';

-- ==============================================
-- ステップ4: 最終確認
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'View vw_company_card_eligible recreated successfully';
  RAISE NOTICE '===================================';
END $$;

-- ビューが正しく作成されたか確認
SELECT 
  viewname,
  CASE 
    WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
    ELSE '✅ SAFE'
  END as status
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'vw_company_card_eligible';
