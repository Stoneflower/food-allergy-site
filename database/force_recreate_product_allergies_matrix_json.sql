-- product_allergies_matrix_json ビューを強制的に再作成
-- SECURITY DEFINER属性を完全に削除

-- ==============================================
-- ステップ1: ビューの現在の属性を確認
-- ==============================================

-- ビューのSECURITY属性をチェック
SELECT 
  c.relname as view_name,
  c.relkind as object_type,
  n.nspname as schema_name,
  CASE 
    WHEN c.relrowsecurity THEN 'Has RLS'
    ELSE 'No RLS'
  END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'product_allergies_matrix_json'
  AND c.relkind = 'v';

-- ==============================================
-- ステップ2: ビューを完全に削除
-- ==============================================

-- 依存関係を含めて完全削除
DROP VIEW IF EXISTS public.product_allergies_matrix_json CASCADE;

-- 削除を確認
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'product_allergies_matrix_json'
  ) THEN
    RAISE NOTICE '✓ View successfully dropped';
  ELSE
    RAISE WARNING 'View still exists after DROP!';
  END IF;
END $$;

-- ==============================================
-- ステップ3: ビューを通常モードで再作成（SECURITY DEFINERなし）
-- ==============================================

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

-- コメント設定
COMMENT ON VIEW public.product_allergies_matrix_json IS 
  'Menu item allergies in JSON format. No SECURITY DEFINER - uses invoker permissions.';

-- ==============================================
-- ステップ4: ビューの所有者とアクセス権を設定
-- ==============================================

-- ビューの所有者を確認（必要に応じて変更）
-- ALTER VIEW public.product_allergies_matrix_json OWNER TO postgres;

-- 公開アクセスを許可
GRANT SELECT ON public.product_allergies_matrix_json TO anon;
GRANT SELECT ON public.product_allergies_matrix_json TO authenticated;

-- ==============================================
-- ステップ5: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'View recreated successfully';
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
WHERE schemaname = 'public' AND viewname = 'product_allergies_matrix_json';

-- ビューが正常に作成されたことを確認
SELECT 
  'View exists:' as check_type,
  EXISTS(
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'product_allergies_matrix_json'
  ) as result;

-- ビューのサンプルデータを取得（正常に動作するか確認）
SELECT 
  'Sample data:' as check_type,
  COUNT(*) as row_count
FROM public.product_allergies_matrix_json
LIMIT 1;

