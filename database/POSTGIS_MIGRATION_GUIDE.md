# 拡張機能の移行ガイド（PostGIS, unaccent, その他）

## 警告メッセージ

```
Entity: public.postgis / public.unaccent / public.[extension_name]
Issue: Extension [extension_name] is installed in the public schema. Move it to another schema.
Description: Detects extensions installed in the public schema.
```

このガイドは、PostGIS、unaccent、その他すべての拡張機能の移行に適用できます。

## ⚠️ 重要な注意事項

PostGISを別のスキーマに移動する操作は、既存のデータやアプリケーションに影響を与える可能性があります。

### 影響範囲

1. **既存のPostGISデータ** - ジオメトリカラムやインデックス
2. **ビューや関数** - PostGISに依存するデータベースオブジェクト
3. **アプリケーションコード** - PostGIS関数を使用しているコード

## オプション1: 個別の拡張機能を移動（推奨）

### 1-A. unaccent拡張機能のみ移動

`unaccent`は全文検索で使用される拡張機能で、通常は安全に移動できます。

```sql
-- database/move_unaccent_to_extensions.sql を実行
```

または手動で：
```sql
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
ALTER DATABASE postgres SET search_path TO public, extensions;
```

### 1-B. PostGIS拡張機能のみ移動

PostGISを使用していない、または新規プロジェクトの場合は、安全に移動できます。

```sql
-- database/move_postgis_to_extensions.sql を実行
```

または手動で：
```sql
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
ALTER DATABASE postgres SET search_path TO public, extensions;
```

### 1-C. すべての拡張機能を一括移動

すべての拡張機能をまとめて移動する場合：

```sql
-- database/move_all_extensions_to_schema.sql を実行
```

## オプション2: PostGISを積極的に使用している場合（慎重に）

既にPostGISデータ（ジオメトリカラム、空間インデックスなど）がある場合は、以下の手順を推奨します。

### 事前確認

```sql
-- PostGISテーブルの確認
SELECT 
  f_table_schema,
  f_table_name,
  f_geometry_column,
  srid,
  type
FROM geometry_columns;

-- PostGISに依存するビューの確認
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE definition LIKE '%ST_%'
  OR definition LIKE '%geometry%'
  OR definition LIKE '%geography%';
```

### 移行手順

1. **本番環境のバックアップを取る**
   ```bash
   # Supabaseダッシュボードから手動バックアップを作成
   ```

2. **テスト環境で実行**
   - まず開発環境やステージング環境で試す

3. **移行スクリプト実行**
   ```sql
   -- database/move_postgis_to_extensions.sql を実行
   ```

4. **動作確認**
   - アプリケーションの全機能をテスト
   - 特に地図表示や位置検索機能を確認

5. **問題があれば復元**
   ```sql
   -- ロールバックする場合
   DROP EXTENSION IF EXISTS postgis CASCADE;
   CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
   ```

## オプション3: 警告を無視する（非推奨だが実用的）

PostGISがpublicスキーマにあっても、実際のセキュリティリスクは限定的です。

### この選択肢を選ぶ場合

- 既存の大規模プロジェクトで移行リスクが高い
- PostGISを積極的に使用している
- セキュリティ監査が厳しくない環境

この場合、以下を実施：
1. Supabaseのセキュリティ警告を認識済みとしてマーク（可能な場合）
2. ドキュメントに理由を記載
3. 次回のメジャーアップグレード時に対応を検討

## 確認方法

### PostGISの現在のスキーマを確認

```sql
SELECT 
  e.extname AS extension_name,
  n.nspname AS schema_name,
  e.extversion AS version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname LIKE 'postgis%'
ORDER BY e.extname;
```

期待される結果（移行後）:
```
extension_name | schema_name | version
----------------|-------------|--------
postgis        | extensions  | 3.x.x
```

### search_pathの確認

```sql
SHOW search_path;
```

期待される結果:
```
"$user", public, extensions
```

## トラブルシューティング

### エラー: "extension postgis does not exist"

PostGISがインストールされていません。新規インストール：

```sql
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION postgis SCHEMA extensions;
```

### エラー: "cannot drop extension postgis because other objects depend on it"

依存するオブジェクトがあります。CASCADE削除が必要ですが、注意：

```sql
-- 依存オブジェクトを確認
SELECT 
  DISTINCT dependent_ns.nspname as dependent_schema,
  dependent_view.relname as dependent_view
FROM pg_depend 
JOIN pg_extension ext ON ext.oid = pg_depend.refobjid
JOIN pg_class dependent_view ON dependent_view.oid = pg_depend.objid
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
WHERE ext.extname = 'postgis';
```

### アプリケーションでPostGIS関数が見つからない

search_pathが更新されていない可能性：

```sql
-- データベースレベルで設定
ALTER DATABASE postgres SET search_path TO public, extensions;

-- または接続レベルで設定
SET search_path TO public, extensions;
```

## 推奨事項

### 新規プロジェクトの場合
✅ 最初から `extensions` スキーマにインストール

### 既存プロジェクトの場合
1. **PostGISを使用していない** → すぐに移行
2. **PostGISを軽度に使用** → テスト環境で確認後に移行
3. **PostGISを重度に使用** → 次のメジャーアップグレード時に計画的に移行

## 参考資料

- [PostgreSQL Extensions Best Practices](https://www.postgresql.org/docs/current/extend-extensions.html)
- [PostGIS Installation Guide](https://postgis.net/docs/postgis_installation.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/extensions)

