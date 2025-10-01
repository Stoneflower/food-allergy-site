-- 残りのすべての重複ポリシーを一括クリーンアップ
-- product_fragrance_allergies, product_store_locations, product_trace_allergies, 
-- products, restaurants

-- ==============================================
-- 1. product_fragrance_allergies
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Cleaning up product_fragrance_allergies...';
  RAISE NOTICE '===================================';
END $$;

-- すべての既存ポリシーを削除
DROP POLICY IF EXISTS "pfa select public" ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS pfa_read ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS "pfa insert JP" ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS pfa_write ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS "pfa delete JP" ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS pfa_update ON public.product_fragrance_allergies;
DROP POLICY IF EXISTS pfa_delete ON public.product_fragrance_allergies;

-- 統一されたポリシーセット
CREATE POLICY pfa_read
  ON public.product_fragrance_allergies FOR SELECT USING (true);

CREATE POLICY pfa_write
  ON public.product_fragrance_allergies FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY pfa_update
  ON public.product_fragrance_allergies FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY pfa_delete
  ON public.product_fragrance_allergies FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. product_store_locations
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up product_store_locations...';
END $$;

DROP POLICY IF EXISTS "Allow public read access to product_store_locations" ON public.product_store_locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_store_locations" ON public.product_store_locations;

CREATE POLICY "Allow public read access to product_store_locations"
  ON public.product_store_locations FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert product_store_locations"
  ON public.product_store_locations FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update product_store_locations"
  ON public.product_store_locations FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product_store_locations"
  ON public.product_store_locations FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 3. product_trace_allergies
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up product_trace_allergies...';
END $$;

DROP POLICY IF EXISTS "pta select public" ON public.product_trace_allergies;
DROP POLICY IF EXISTS pta_read ON public.product_trace_allergies;
DROP POLICY IF EXISTS "pta insert JP" ON public.product_trace_allergies;
DROP POLICY IF EXISTS pta_write ON public.product_trace_allergies;
DROP POLICY IF EXISTS "pta delete JP" ON public.product_trace_allergies;
DROP POLICY IF EXISTS pta_update ON public.product_trace_allergies;
DROP POLICY IF EXISTS pta_delete ON public.product_trace_allergies;

CREATE POLICY pta_read
  ON public.product_trace_allergies FOR SELECT USING (true);

CREATE POLICY pta_write
  ON public.product_trace_allergies FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY pta_update
  ON public.product_trace_allergies FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY pta_delete
  ON public.product_trace_allergies FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 4. products
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up products...';
END $$;

-- すべての既存ポリシーを削除
DROP POLICY IF EXISTS "anon insert products" ON public.products;
DROP POLICY IF EXISTS ins_products ON public.products;
DROP POLICY IF EXISTS "anon update products" ON public.products;
DROP POLICY IF EXISTS upd_products ON public.products;
DROP POLICY IF EXISTS "anon delete products" ON public.products;
DROP POLICY IF EXISTS products_delete ON public.products;
DROP POLICY IF EXISTS "public read products" ON public.products;
DROP POLICY IF EXISTS "products select public" ON public.products;
DROP POLICY IF EXISTS sel_products ON public.products;
DROP POLICY IF EXISTS products_read ON public.products;
DROP POLICY IF EXISTS products_insert ON public.products;
DROP POLICY IF EXISTS products_update ON public.products;
DROP POLICY IF EXISTS "products update minimal" ON public.products;

-- 統一されたポリシーセット
CREATE POLICY products_read
  ON public.products FOR SELECT USING (true);

CREATE POLICY products_insert
  ON public.products FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY products_update
  ON public.products FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY products_delete
  ON public.products FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 5. restaurants
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up restaurants...';
END $$;

DROP POLICY IF EXISTS "Allow public read access to restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow authenticated users to manage restaurants" ON public.restaurants;

CREATE POLICY "Allow public read access to restaurants"
  ON public.restaurants FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update restaurants"
  ON public.restaurants FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete restaurants"
  ON public.restaurants FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ All 5 tables cleaned up!';
  RAISE NOTICE '===================================';
END $$;

-- すべてのテーブルのポリシーカウントを確認
SELECT 
  pc.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  COUNT(*) OVER (PARTITION BY pc.relname, pol.polcmd) as policy_count_per_action
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname IN ('product_fragrance_allergies', 'product_store_locations', 
                     'product_trace_allergies', 'products', 'restaurants')
ORDER BY pc.relname, 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

