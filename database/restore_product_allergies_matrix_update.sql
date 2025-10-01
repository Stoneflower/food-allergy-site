-- product_allergies_matrixのUPDATEポリシーを元の動作に戻す
-- アップロード処理でアレルギー情報を更新できるようにする

-- ==============================================
-- UPDATEポリシーを修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Restoring product_allergies_matrix UPDATE policy...';
  RAISE NOTICE 'Allowing anonymous users to update';
  RAISE NOTICE '===================================';
END $$;

-- 既存のUPDATEポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to update product_allergies_matrix" ON public.product_allergies_matrix;

-- 全ユーザーがUPDATEできるポリシーを作成
CREATE POLICY "Allow all users to update product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ UPDATE policy restored!';
  RAISE NOTICE 'Anonymous users can now update allergy data';
END $$;

-- すべてのポリシーを確認
SELECT 
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  CASE 
    WHEN (qual = 'true' OR qual IS NULL) AND (with_check = 'true' OR with_check IS NULL) THEN '✅ All users'
    WHEN qual IS NULL AND with_check = 'true' THEN '✅ All users'
    WHEN qual = 'true' AND with_check IS NULL THEN '✅ All users'
    ELSE '🔐 Restricted'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix'
ORDER BY 
  CASE cmd
    WHEN 'r' THEN 1
    WHEN 'a' THEN 2
    WHEN 'w' THEN 3
    WHEN 'd' THEN 4
  END;

