-- 複数テーブルのRLSポリシーを一括最適化
-- allergy_items, country_allergy_items, menu_item_allergies, menu_items

-- ==============================================
-- ステップ1: 現在のポリシーパターンを確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Batch optimizing RLS policies...';
  RAISE NOTICE 'Tables: allergy_items, country_allergy_items,';
  RAISE NOTICE '        menu_item_allergies, menu_items';
  RAISE NOTICE '===================================';
END $$;

-- ==============================================
-- ステップ2: allergy_items を最適化
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to allergy_items" ON public.allergy_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage allergy_items" ON public.allergy_items;

CREATE POLICY "Allow public read access to allergy_items"
  ON public.allergy_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage allergy_items"
  ON public.allergy_items
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ3: country_allergy_items を最適化
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to country_allergy_items" ON public.country_allergy_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage country_allergy_items" ON public.country_allergy_items;

CREATE POLICY "Allow public read access to country_allergy_items"
  ON public.country_allergy_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage country_allergy_items"
  ON public.country_allergy_items
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ4: menu_item_allergies を最適化
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to menu_item_allergies" ON public.menu_item_allergies;
DROP POLICY IF EXISTS "Allow authenticated users to manage menu_item_allergies" ON public.menu_item_allergies;
DROP POLICY IF EXISTS "allow delete menu_item_allergies for import" ON public.menu_item_allergies;

CREATE POLICY "Allow public read access to menu_item_allergies"
  ON public.menu_item_allergies
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage menu_item_allergies"
  ON public.menu_item_allergies
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 既存のインポート用削除ポリシーも最適化して再作成
CREATE POLICY "allow delete menu_item_allergies for import"
  ON public.menu_item_allergies
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ5: menu_items を最適化
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "allow delete menu_items for import" ON public.menu_items;

CREATE POLICY "Allow public read access to menu_items"
  ON public.menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage menu_items"
  ON public.menu_items
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 既存のインポート用削除ポリシーも最適化して再作成
CREATE POLICY "allow delete menu_items for import"
  ON public.menu_items
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ6: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ All 4 tables optimized!';
  RAISE NOTICE '===================================';
END $$;

-- 最適化後のポリシーを確認
SELECT 
  pc.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  CASE 
    WHEN pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%SELECT auth.%' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%SELECT auth.%'
    THEN '✅ Optimized'
    WHEN pg_get_expr(pol.polqual, pol.polrelid) ~ 'auth\.' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) ~ 'auth\.'
    THEN '❌ Not optimized'
    ELSE '✅ No auth functions'
  END as status
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname IN ('allergy_items', 'country_allergy_items', 'menu_item_allergies', 'menu_items')
ORDER BY pc.relname, pol.polname;

