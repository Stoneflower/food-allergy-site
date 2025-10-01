-- product_allergies_matrixのINSERTポリシーを元の動作に戻す
-- 匿名ユーザーもINSERTできるようにする（アップロード機能のため）

-- ==============================================
-- 現在のポリシーを確認
-- ==============================================

SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix'
ORDER BY cmd, policyname;

-- ==============================================
-- INSERTポリシーを修正
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Restoring product_allergies_matrix INSERT policy...';
  RAISE NOTICE 'Allowing anonymous users to insert';
  RAISE NOTICE '===================================';
END $$;

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Allow authenticated users to insert product_allergies_matrix" ON public.product_allergies_matrix;

-- 全ユーザーがINSERTできるポリシーを作成
CREATE POLICY "Allow all users to insert product_allergies_matrix"
  ON public.product_allergies_matrix
  FOR INSERT
  WITH CHECK (true);

-- ==============================================
-- 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ INSERT policy restored!';
  RAISE NOTICE 'Anonymous users can now insert data';
END $$;

-- 修正後のポリシーを確認
SELECT 
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
  END as command,
  with_check,
  CASE 
    WHEN with_check = 'true' THEN '✅ All users allowed'
    ELSE '🔐 Restricted'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'product_allergies_matrix'
ORDER BY cmd, policyname;

