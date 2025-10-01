-- PostGIS拡張機能をpublicスキーマから専用スキーマに移動
-- Supabaseのセキュリティ警告対応

-- ステップ1: 専用スキーマ 'extensions' を作成
CREATE SCHEMA IF NOT EXISTS extensions;

-- ステップ2: PostGIS拡張機能を extensions スキーマに移動
-- 注意: この操作は既存のPostGISデータに影響を与える可能性があるため、
--       本番環境では事前にバックアップを取ることを強く推奨します

-- PostGISがpublicスキーマにインストールされているか確認
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'postgis' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- publicスキーマからPostGISを削除して、extensionsスキーマに再インストール
    DROP EXTENSION IF EXISTS postgis CASCADE;
    CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
    
    RAISE NOTICE 'PostGIS has been moved to the extensions schema.';
  ELSIF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'postgis'
  ) THEN
    RAISE NOTICE 'PostGIS is already installed in a non-public schema.';
  ELSE
    -- PostGISがインストールされていない場合は、extensionsスキーマにインストール
    CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
    RAISE NOTICE 'PostGIS has been installed in the extensions schema.';
  END IF;
END $$;

-- ステップ3: 他の拡張機能も同様に移動（存在する場合）
DO $$
BEGIN
  -- postgis_topology
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'postgis_topology' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    DROP EXTENSION IF EXISTS postgis_topology CASCADE;
    CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA extensions;
    RAISE NOTICE 'PostGIS Topology has been moved to the extensions schema.';
  END IF;

  -- postgis_tiger_geocoder
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'postgis_tiger_geocoder' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    DROP EXTENSION IF EXISTS postgis_tiger_geocoder CASCADE;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder SCHEMA extensions;
    RAISE NOTICE 'PostGIS Tiger Geocoder has been moved to the extensions schema.';
  END IF;
END $$;

-- ステップ4: search_pathを更新してextensionsスキーマを含める
-- これにより、アプリケーションからPostGIS関数を引き続き使用できます
ALTER DATABASE postgres SET search_path TO public, extensions;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'PostGIS migration completed!';
  RAISE NOTICE 'Extensions are now in the "extensions" schema.';
  RAISE NOTICE 'Search path has been updated.';
  RAISE NOTICE '===================================';
END $$;


