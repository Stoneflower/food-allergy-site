-- menu_item_allergies と menu_items の重複ポリシーを修正
-- FOR ALLポリシーが原因で複数のポリシーが評価されている

-- ==============================================
-- 1. menu_item_allergies を修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing menu_item_allergies...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to menu_item_allergies" ON public.menu_item_allergies;
DROP POLICY IF EXISTS "Allow authenticated users to manage menu_item_allergies" ON public.menu_item_allergies;
DROP POLICY IF EXISTS "allow delete menu_item_allergies for import" ON public.menu_item_allergies;

-- SELECT: 全員が読み取り可能
CREATE POLICY "Allow public read access to menu_item_allergies"
  ON public.menu_item_allergies
  FOR SELECT
  USING (true);

-- INSERT: 認証ユーザーのみ
CREATE POLICY "Allow authenticated users to insert menu_item_allergies"
  ON public.menu_item_allergies
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: 認証ユーザーのみ
CREATE POLICY "Allow authenticated users to update menu_item_allergies"
  ON public.menu_item_allergies
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- DELETE: 認証ユーザーのみ（インポート用も統合）
CREATE POLICY "Allow authenticated users to delete menu_item_allergies"
  ON public.menu_item_allergies
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 2. menu_items を修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing menu_items...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS "Allow public read access to menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "allow delete menu_items for import" ON public.menu_items;

-- SELECT: 全員が読み取り可能
CREATE POLICY "Allow public read access to menu_items"
  ON public.menu_items
  FOR SELECT
  USING (true);

-- INSERT: 認証ユーザーのみ
CREATE POLICY "Allow authenticated users to insert menu_items"
  ON public.menu_items
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: 認証ユーザーのみ
CREATE POLICY "Allow authenticated users to update menu_items"
  ON public.menu_items
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- DELETE: 認証ユーザーのみ（インポート用も統合）
CREATE POLICY "Allow authenticated users to delete menu_items"
  ON public.menu_items
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ Both menu tables fixed!';
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
  AND pc.relname IN ('menu_item_allergies', 'menu_items')
ORDER BY pc.relname, 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

