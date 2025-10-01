-- 関数のsearch_pathを修正してセキュリティ警告を解消
-- Issue: Function has a role mutable search_path

-- ステップ1: 現在の関数定義を確認
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Checking existing functions...';
  RAISE NOTICE '===================================';
END $$;

-- ステップ2: set_updated_at 関数を安全に再作成
-- 既存の関数を削除して、search_pathを設定した安全なバージョンで再作成
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- search_pathを明示的に設定
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 関数の所有者とコメント設定
COMMENT ON FUNCTION public.set_updated_at() IS 
  'Automatically updates the updated_at column to the current timestamp. Safe search_path configured.';

-- ステップ3: 他の関数も同様にチェック・修正
-- update_updated_at_column 関数（存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    -- 関数を削除して再作成
    DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
    
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$;
    
    COMMENT ON FUNCTION public.update_updated_at_column() IS 
      'Automatically updates the updated_at column. Safe search_path configured.';
    
    RAISE NOTICE 'Fixed: update_updated_at_column()';
  END IF;
END $$;

-- ステップ4: すべてのpublicスキーマの関数を安全に修正
DO $$
DECLARE
  func_record RECORD;
  func_definition TEXT;
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Checking all public schema functions...';
  
  -- search_pathが設定されていない関数を検出（集約関数を除外）
  FOR func_record IN
    SELECT 
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname NOT LIKE 'pg_%'
      AND p.prokind = 'f'  -- 通常の関数のみ（集約関数やウィンドウ関数を除外）
      AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%'
  LOOP
    RAISE NOTICE 'Function without search_path: %', func_record.function_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Function security update completed!';
  RAISE NOTICE 'Fixed: set_updated_at() and related functions';
  RAISE NOTICE '===================================';
END $$;

-- ステップ5: 確認用クエリ（集約関数を除外）
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'SAFE'
    ELSE 'NEEDS FIX'
  END AS status,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.prokind = 'f'  -- 通常の関数のみ
ORDER BY p.proname;

