-- vw_company_card_eligible ビューを作成
-- SECURITY DEFINERなしで安全に作成

-- ==============================================
-- ステップ1: 既存のビューを削除（存在する場合）
-- ==============================================

DROP VIEW IF EXISTS public.vw_company_card_eligible CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Creating vw_company_card_eligible view...';
END $$;

-- ==============================================
-- ステップ2: SECURITY DEFINERなしでビューを作成
-- ==============================================

CREATE VIEW public.vw_company_card_eligible AS
WITH matrix_any AS (
  SELECT product_allergies_matrix.product_id, 'egg'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.egg = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'milk'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.milk = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'wheat'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.wheat = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'buckwheat'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.buckwheat = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'peanut'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.peanut = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'shrimp'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.shrimp = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'crab'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.crab = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'walnut'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.walnut = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'almond'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.almond = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'abalone'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.abalone = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'squid'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.squid = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'salmon_roe'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.salmon_roe = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'orange'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.orange = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'cashew'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.cashew = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'kiwi'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.kiwi = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'beef'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.beef = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'gelatin'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.gelatin = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'sesame'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.sesame = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'salmon'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.salmon = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'mackerel'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.mackerel = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'soybean'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.soybean = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'chicken'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.chicken = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'banana'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.banana = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'pork'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.pork = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'matsutake'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.matsutake = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'peach'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.peach = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'yam'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.yam = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'apple'::text AS allergy
  FROM product_allergies_matrix
  WHERE (product_allergies_matrix.apple = ANY (ARRAY['none'::text, 'trace'::text]))
  UNION ALL
  SELECT product_allergies_matrix.product_id, 'macadamia'::text AS allergy
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
  'Company card eligible products by allergy. Safe - no SECURITY DEFINER.';

-- ==============================================
-- ステップ3: 最終確認
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'View vw_company_card_eligible created successfully';
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

