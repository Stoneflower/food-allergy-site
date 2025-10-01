-- 最終バッチのRLSポリシー最適化
-- product_allergies_matrix, product_categories, restaurants, 
-- search_performance_log, user_allergy_settings

-- ==============================================
-- ステップ1: バッチ最適化開始
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Final batch RLS optimization...';
  RAISE NOTICE 'Tables: 5 remaining tables';
  RAISE NOTICE '===================================';
END $$;

-- ==============================================
-- 1. product_allergies_matrix
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to product_allergies_matrix" ON public.product_allergies_matrix;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_allergies_matrix" ON public.product_allergies_matrix;

CREATE POLICY "Allow public read access to product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. product_categories
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_categories" ON public.product_categories;

CREATE POLICY "Allow public read access to product_categories"
  ON public.product_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage product_categories"
  ON public.product_categories
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 3. restaurants
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow authenticated users to manage restaurants" ON public.restaurants;

CREATE POLICY "Allow public read access to restaurants"
  ON public.restaurants
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage restaurants"
  ON public.restaurants
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 4. search_performance_log
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to search_performance_log" ON public.search_performance_log;
DROP POLICY IF EXISTS "Allow authenticated users to insert search_performance_log" ON public.search_performance_log;

CREATE POLICY "Allow public read access to search_performance_log"
  ON public.search_performance_log
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert search_performance_log"
  ON public.search_performance_log
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 5. user_allergy_settings
-- ==============================================

DROP POLICY IF EXISTS "Allow public read access to user_allergy_settings" ON public.user_allergy_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_allergy_settings" ON public.user_allergy_settings;

CREATE POLICY "Allow public read access to user_allergy_settings"
  ON public.user_allergy_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage user_allergy_settings"
  ON public.user_allergy_settings
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ Final 5 tables optimized!';
  RAISE NOTICE '===================================';
END $$;

-- 最適化後のポリシーを確認
SELECT 
  pc.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
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
  AND pc.relname IN ('product_allergies_matrix', 'product_categories', 'restaurants', 
                     'search_performance_log', 'user_allergy_settings')
ORDER BY pc.relname, pol.polname;

