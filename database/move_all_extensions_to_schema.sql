-- すべての拡張機能をpublicスキーマから専用スキーマに移動
-- Supabaseのセキュリティ警告対応（一括処理版）

-- ステップ1: 専用スキーマ 'extensions' を作成
CREATE SCHEMA IF NOT EXISTS extensions;

-- ステップ2: publicスキーマにある全拡張機能を確認
DO $$
DECLARE
  ext_record RECORD;
  extensions_moved INTEGER := 0;
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Starting extension migration...';
  RAISE NOTICE '===================================';
  
  -- publicスキーマの拡張機能をループ処理
  FOR ext_record IN 
    SELECT e.extname
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY e.extname
  LOOP
    BEGIN
      -- 拡張機能を削除して再作成
      EXECUTE format('DROP EXTENSION IF EXISTS %I CASCADE', ext_record.extname);
      EXECUTE format('CREATE EXTENSION IF NOT EXISTS %I SCHEMA extensions', ext_record.extname);
      
      extensions_moved := extensions_moved + 1;
      RAISE NOTICE 'Moved: % → extensions schema', ext_record.extname;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to move %: %', ext_record.extname, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'Total extensions moved: %', extensions_moved;
  RAISE NOTICE '===================================';
END $$;

-- ステップ3: search_pathを更新
ALTER DATABASE postgres SET search_path TO public, extensions;

-- ステップ4: 確認用クエリ
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Current extensions:';
END $$;

SELECT 
  e.extname AS extension_name,
  n.nspname AS schema_name,
  e.extversion AS version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY n.nspname, e.extname;


