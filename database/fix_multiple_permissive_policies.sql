-- Multiple Permissive Policiesの警告を修正
-- allergy_itemsテーブルのポリシーを再構成

-- ==============================================
-- 問題: anonロールのSELECTアクションに対して2つのポリシーが評価される
-- 解決: ポリシーを明確に分離
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Fixing Multiple Permissive Policies...';
  RAISE NOTICE 'Table: allergy_items';
  RAISE NOTICE '===================================';
END $$;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow public read access to allergy_items" ON public.allergy_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage allergy_items" ON public.allergy_items;

-- ==============================================
-- 新しいポリシー構成
-- ==============================================

-- 1. 全員がSELECTできる（公開読み取り）
CREATE POLICY "Allow public read access to allergy_items"
  ON public.allergy_items
  FOR SELECT
  USING (true);

-- 2. 認証ユーザーがINSERTできる
CREATE POLICY "Allow authenticated users to insert allergy_items"
  ON public.allergy_items
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 3. 認証ユーザーがUPDATEできる
CREATE POLICY "Allow authenticated users to update allergy_items"
  ON public.allergy_items
  FOR UPDATE
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- 4. 認証ユーザーがDELETEできる
CREATE POLICY "Allow authenticated users to delete allergy_items"
  ON public.allergy_items
  FOR DELETE
  USING ((SELECT auth.role()) = 'authenticated');

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE '✅ Multiple Permissive Policies fixed!';
  RAISE NOTICE 'Each action now has exactly one policy';
  RAISE NOTICE '===================================';
END $$;

-- ポリシーを確認
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  pol.polroles::regrole[] as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'allergy_items'
ORDER BY 
  CASE pol.polcmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

