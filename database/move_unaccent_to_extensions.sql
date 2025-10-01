-- unaccent拡張機能をpublicスキーマから専用スキーマに移動
-- Supabaseのセキュリティ警告対応

-- ステップ1: 専用スキーマ 'extensions' を作成（既に存在する場合はスキップ）
CREATE SCHEMA IF NOT EXISTS extensions;

-- ステップ2: unaccent拡張機能を extensions スキーマに移動
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'unaccent' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- publicスキーマからunaccentを削除して、extensionsスキーマに再インストール
    DROP EXTENSION IF EXISTS unaccent CASCADE;
    CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
    
    RAISE NOTICE 'unaccent has been moved to the extensions schema.';
  ELSIF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'unaccent'
  ) THEN
    RAISE NOTICE 'unaccent is already installed in a non-public schema.';
  ELSE
    -- unaccentがインストールされていない場合は、extensionsスキーマにインストール
    CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
    RAISE NOTICE 'unaccent has been installed in the extensions schema.';
  END IF;
END $$;

-- ステップ3: search_pathを更新（既に含まれている場合は重複しない）
-- これにより、アプリケーションからunaccent関数を引き続き使用できます
ALTER DATABASE postgres SET search_path TO public, extensions;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'unaccent migration completed!';
  RAISE NOTICE 'Extension is now in the "extensions" schema.';
  RAISE NOTICE '===================================';
END $$;


