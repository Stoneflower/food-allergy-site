-- allergy_settingsテーブルのRLSポリシーを最適化
-- auth.uid()を各行ごとに再評価しないように修正

-- ==============================================
-- ステップ1: 既存のポリシーを削除
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Optimizing allergy_settings RLS policies...';
  RAISE NOTICE '===================================';
END $$;

DROP POLICY IF EXISTS allergy_settings_select_own ON public.allergy_settings;
DROP POLICY IF EXISTS allergy_settings_insert_own ON public.allergy_settings;
DROP POLICY IF EXISTS allergy_settings_update_own ON public.allergy_settings;

-- ==============================================
-- ステップ2: 最適化されたポリシーを作成
-- ==============================================

-- SELECT ポリシー（最適化版）
CREATE POLICY allergy_settings_select_own
  ON public.allergy_settings
  FOR SELECT
  USING (
    (profile_type = 'user' AND profile_id = (SELECT auth.uid()))
    OR
    (profile_type = 'member' AND member_id IN (
      SELECT id FROM family_members WHERE user_id = (SELECT auth.uid())
    ))
  );

-- INSERT ポリシー（最適化版）
CREATE POLICY allergy_settings_insert_own
  ON public.allergy_settings
  FOR INSERT
  WITH CHECK (
    (profile_type = 'user' AND profile_id = (SELECT auth.uid()))
    OR
    (profile_type = 'member' AND member_id IN (
      SELECT id FROM family_members WHERE user_id = (SELECT auth.uid())
    ))
  );

-- UPDATE ポリシー（最適化版）
CREATE POLICY allergy_settings_update_own
  ON public.allergy_settings
  FOR UPDATE
  USING (
    (profile_type = 'user' AND profile_id = (SELECT auth.uid()))
    OR
    (profile_type = 'member' AND member_id IN (
      SELECT id FROM family_members WHERE user_id = (SELECT auth.uid())
    ))
  )
  WITH CHECK (
    (profile_type = 'user' AND profile_id = (SELECT auth.uid()))
    OR
    (profile_type = 'member' AND member_id IN (
      SELECT id FROM family_members WHERE user_id = (SELECT auth.uid())
    ))
  );

-- ==============================================
-- ステップ3: 最終確認
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '✅ allergy_settings RLS policies optimized!';
END $$;

-- 最適化後のポリシーを確認
SELECT 
  pol.polname as policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
  END as command,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
  CASE 
    WHEN pg_get_expr(pol.polqual, pol.polrelid) ILIKE '%SELECT auth.uid()%' 
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%SELECT auth.uid()%'
    THEN '✅ Optimized'
    ELSE '❌ Not optimized'
  END as status
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' 
  AND pc.relname = 'allergy_settings'
ORDER BY pol.polname;
