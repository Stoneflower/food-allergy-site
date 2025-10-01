-- 残りのMultiple Permissive Policies警告を修正
-- product_allergies, product_allergies_matrix, product_categories

-- ==============================================
-- 1. product_allergies - 重複INSERTポリシーを統合
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing product_allergies...';
  RAISE NOTICE '===================================';
END $$;

-- 既存の重複INSERTポリシーを削除
DROP POLICY IF EXISTS "pa insert JP" ON public.product_allergies;
DROP POLICY IF EXISTS pa_insert_all ON public.product_allergies;

-- 1つの統一されたINSERTポリシーを作成
CREATE POLICY pa_insert_all
  ON public.product_allergies
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. product_allergies_matrix - FOR ALL分離
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing product_allergies_matrix...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to product_allergies_matrix" ON public.product_allergies_matrix;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_allergies_matrix" ON public.product_allergies_matrix;

CREATE POLICY "Allow public read access to product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 3. product_categories - FOR ALL分離
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing product_categories...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_categories" ON public.product_categories;

CREATE POLICY "Allow public read access to product_categories"
  ON public.product_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert product_categories"
  ON public.product_categories
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update product_categories"
  ON public.product_categories
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product_categories"
  ON public.product_categories
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ All 3 tables fixed!';
  RAISE NOTICE '===================================';
END $$;

-- 修正後のポリシーを確認
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
  AND pc.relname IN ('product_allergies', 'product_allergies_matrix', 'product_categories')
ORDER BY pc.relname, 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

