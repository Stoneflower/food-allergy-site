-- Multiple Permissive Policies警告を一括修正
-- FOR ALLポリシーをアクション別に分離

-- ==============================================
-- 1. country_allergy_items を修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing country_allergy_items...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to country_allergy_items" ON public.country_allergy_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage country_allergy_items" ON public.country_allergy_items;

CREATE POLICY "Allow public read access to country_allergy_items"
  ON public.country_allergy_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert country_allergy_items"
  ON public.country_allergy_items
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update country_allergy_items"
  ON public.country_allergy_items
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete country_allergy_items"
  ON public.country_allergy_items
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. import_jobs の重複INSERTポリシーを修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing import_jobs...';
  RAISE NOTICE '===================================';
END $$;

-- 重複しているINSERTポリシーを削除
DROP POLICY IF EXISTS ins_jobs ON public.import_jobs;
DROP POLICY IF EXISTS ins_import_jobs ON public.import_jobs;

-- 1つの統一されたINSERTポリシーを作成
CREATE POLICY ins_import_jobs
  ON public.import_jobs
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 3. 他のテーブルも同様に修正（同じパターンのテーブル）
-- ==============================================

-- symbol_mapping_suggestionsも同じ問題があるかチェック
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'symbol_mapping_suggestions'
      AND policyname = 'Allow authenticated users to manage symbol_mapping_suggestions'
      AND cmd = 'ALL'
  ) THEN
    RAISE NOTICE 'Fixing symbol_mapping_suggestions...';
    
    DROP POLICY IF EXISTS "Allow public read access to symbol_mapping_suggestions" ON public.symbol_mapping_suggestions;
    DROP POLICY IF EXISTS "Allow authenticated users to manage symbol_mapping_suggestions" ON public.symbol_mapping_suggestions;
    
    CREATE POLICY "Allow public read access to symbol_mapping_suggestions"
      ON public.symbol_mapping_suggestions FOR SELECT USING (true);
    
    CREATE POLICY "Allow authenticated users to insert symbol_mapping_suggestions"
      ON public.symbol_mapping_suggestions FOR INSERT
      WITH CHECK ((SELECT auth.role()) = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to update symbol_mapping_suggestions"
      ON public.symbol_mapping_suggestions FOR UPDATE
      USING ((SELECT auth.role()) = 'authenticated')
      WITH CHECK ((SELECT auth.role()) = 'authenticated');
    
    CREATE POLICY "Allow authenticated users to delete symbol_mapping_suggestions"
      ON public.symbol_mapping_suggestions FOR DELETE
      USING ((SELECT auth.role()) = 'authenticated');
  END IF;
END $$;

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ All Multiple Permissive Policies fixed!';
  RAISE NOTICE '===================================';
END $$;

-- 修正したテーブルのポリシーを確認
SELECT 
  pc.relname as table_name,
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  COUNT(*) OVER (PARTITION BY pc.relname, pol.polcmd) as policy_count_per_action
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname IN ('country_allergy_items', 'import_jobs', 'symbol_mapping_suggestions')
ORDER BY pc.relname, 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

