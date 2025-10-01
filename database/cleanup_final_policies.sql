-- 最後の重複ポリシーを修正
-- staging_imports, store_locations, user_allergy_settings

-- ==============================================
-- 1. staging_imports - 重複INSERTポリシー統合
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Cleaning up staging_imports...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS ins_staging ON public.staging_imports;
DROP POLICY IF EXISTS ins_staging_imports ON public.staging_imports;
DROP POLICY IF EXISTS sel_staging ON public.staging_imports;
DROP POLICY IF EXISTS sel_staging_imports ON public.staging_imports;

-- 統一されたポリシーセット
CREATE POLICY sel_staging_imports
  ON public.staging_imports FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY ins_staging_imports
  ON public.staging_imports FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. store_locations - 重複INSERTポリシー統合
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up store_locations...';
END $$;

DROP POLICY IF EXISTS ins_store_locations ON public.store_locations;
DROP POLICY IF EXISTS ins_store_locations_any ON public.store_locations;
DROP POLICY IF EXISTS sel_store_locations ON public.store_locations;
DROP POLICY IF EXISTS upd_store_locations ON public.store_locations;
DROP POLICY IF EXISTS upd_store_locations_any ON public.store_locations;
DROP POLICY IF EXISTS del_store_locations ON public.store_locations;

-- 統一されたポリシーセット
CREATE POLICY sel_store_locations
  ON public.store_locations FOR SELECT USING (true);

CREATE POLICY ins_store_locations
  ON public.store_locations FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY upd_store_locations
  ON public.store_locations FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY del_store_locations
  ON public.store_locations FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 3. user_allergy_settings - FOR ALL分離
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE 'Cleaning up user_allergy_settings...';
END $$;

DROP POLICY IF EXISTS "Allow public read access to user_allergy_settings" ON public.user_allergy_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage user_allergy_settings" ON public.user_allergy_settings;

CREATE POLICY "Allow public read access to user_allergy_settings"
  ON public.user_allergy_settings FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert user_allergy_settings"
  ON public.user_allergy_settings FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to update user_allergy_settings"
  ON public.user_allergy_settings FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated users to delete user_allergy_settings"
  ON public.user_allergy_settings FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ All 3 tables cleaned up!';
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
  AND pc.relname IN ('staging_imports', 'store_locations', 'user_allergy_settings')
ORDER BY pc.relname, 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

