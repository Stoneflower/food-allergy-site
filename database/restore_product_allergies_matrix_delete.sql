-- product_allergies_matrixのDELETEポリシーも元の動作に戻す
-- アップロード処理で既存データを削除できるようにする

-- ==============================================
-- 現在のDELETEポリシーを確認
-- ==============================================

SELECT 
  policyname,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix'
  AND cmd = 'DELETE';

-- ==============================================
-- DELETEポリシーを修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Restoring product_allergies_matrix DELETE policy...';
  RAISE NOTICE 'Allowing anonymous users to delete';
  RAISE NOTICE '===================================';
END $$;

-- 既存のDELETEポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to delete product_allergies_matrix" ON public.product_allergies_matrix;

-- 全ユーザーがDELETEできるポリシーを作成
CREATE POLICY "Allow all users to delete product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR DELETE
  USING (true);

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ DELETE policy restored!';
  RAISE NOTICE 'Anonymous users can now delete data';
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
    WHEN qual = 'true' OR with_check = 'true' THEN '✅ All users'
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

