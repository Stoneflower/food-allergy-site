-- 残りのテーブルのRLSポリシーを最適化
-- symbol_mapping_suggestions と product_store_locations

-- ==============================================
-- ステップ1: 現在のポリシーを確認
-- ==============================================

-- symbol_mapping_suggestionsのポリシー
SELECT 
  'symbol_mapping_suggestions' as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'symbol_mapping_suggestions'
ORDER BY pol.polname;

-- product_store_locationsのポリシー
SELECT 
  'product_store_locations' as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'product_store_locations'
ORDER BY pol.polname;

-- ==============================================
-- ステップ2: symbol_mapping_suggestions を最適化
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Optimizing symbol_mapping_suggestions...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to symbol_mapping_suggestions" ON public.symbol_mapping_suggestions;
DROP POLICY IF EXISTS "Allow authenticated users to manage symbol_mapping_suggestions" ON public.symbol_mapping_suggestions;

-- 公開読み取りポリシー（最適化不要 - auth関数を使用していない）
CREATE POLICY "Allow public read access to symbol_mapping_suggestions"
  ON public.symbol_mapping_suggestions
  FOR SELECT
  USING (true);

-- 認証ユーザー管理ポリシー（最適化版）
CREATE POLICY "Allow authenticated users to manage symbol_mapping_suggestions"
  ON public.symbol_mapping_suggestions
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ3: product_store_locations を最適化
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Optimizing product_store_locations...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to product_store_locations" ON public.product_store_locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_store_locations" ON public.product_store_locations;

-- 公開読み取りポリシー（最適化不要）
CREATE POLICY "Allow public read access to product_store_locations"
  ON public.product_store_locations
  FOR SELECT
  USING (true);

-- 認証ユーザー管理ポリシー（最適化版）
CREATE POLICY "Allow authenticated users to manage product_store_locations"
  ON public.product_store_locations
  FOR ALL
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- ステップ4: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'All RLS policies optimized!';
  RAISE NOTICE '===================================';
END $$;

-- 最適化後のポリシーを確認
SELECT 
  pc.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN '*' THEN 'ALL'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
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
  AND pc.relname IN ('symbol_mapping_suggestions', 'product_store_locations')
ORDER BY pc.relname, pol.polname;

