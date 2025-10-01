# PostgreSQL関数のセキュリティ設定ガイド

## 警告メッセージ

```
Entity: public.set_updated_at
Issue: Function public.set_updated_at has a role mutable search_path
Description: Detects functions where the search_path parameter is not set.
```

## 問題の説明

### なぜ危険なのか？

`search_path`が設定されていない関数は、以下のセキュリティリスクがあります：

1. **検索パス注入攻撃**
   - 悪意のあるユーザーが関数実行前に`search_path`を変更
   - 意図しないスキーマのオブジェクトを参照させることが可能

2. **予期しない動作**
   - 関数がどのスキーマのテーブル/関数を参照するか不明確
   - 環境によって動作が変わる可能性

### 例: 攻撃シナリオ

```sql
-- 攻撃者が悪意のあるスキーマを作成
CREATE SCHEMA malicious;
CREATE TABLE malicious.users (id INT, is_admin BOOLEAN DEFAULT true);

-- search_pathを変更
SET search_path = malicious, public;

-- 関数実行時、意図せず malicious.users を参照してしまう
```

## 解決方法

### オプション1: スクリプトで一括修正（推奨）

SupabaseのSQL Editorで実行：

```sql
-- database/fix_function_search_path.sql を実行
```

このスクリプトは：
- `set_updated_at()` 関数を修正
- `update_updated_at_column()` 関数を修正（存在する場合）
- その他の関数をチェック
- 修正が必要な関数をリスト表示

### オプション2: 手動で修正

#### 基本パターン

```sql
-- 修正前（危険）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 修正後（安全）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ← これを追加
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

#### 重要なポイント

1. **`SET search_path = public, pg_temp`** を追加
   - `public`: publicスキーマを明示的に指定
   - `pg_temp`: 一時オブジェクト用（必須）

2. **`SECURITY DEFINER`** を使用する場合は必須
   - 関数の所有者権限で実行される
   - より厳格なセキュリティが必要

## 確認方法

### 現在の関数定義を確認

```sql
-- 特定の関数の定義を表示
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'set_updated_at'
  AND pronamespace = 'public'::regnamespace;
```

### すべての関数のsearch_path状態を確認

```sql
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ SAFE'
    ELSE '⚠️ NEEDS FIX'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
ORDER BY status, p.proname;
```

## トラブルシューティング

### エラー: "function does not exist"

関数が別の名前で定義されている可能性があります。

```sql
-- すべての関数を確認
SELECT 
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

### エラー: "cannot drop function because other objects depend on it"

トリガーなどが依存している場合は `CASCADE` が必要です：

```sql
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
-- 再作成後、トリガーを再設定する必要があります
```

### トリガーの再作成

関数を`CASCADE`で削除した場合、トリガーも削除されます。再作成が必要です：

```sql
-- 例: products テーブルのトリガー
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

## ベストプラクティス

### 1. 常にsearch_pathを設定

```sql
CREATE OR REPLACE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp  -- ← 常に設定
AS $$
BEGIN
  -- 関数の処理
END;
$$;
```

### 2. SECURITY DEFINERを使う場合は特に注意

```sql
CREATE OR REPLACE FUNCTION admin_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- 所有者権限で実行
SET search_path = public, pg_temp  -- ← 必須！
AS $$
BEGIN
  -- 管理者操作
END;
$$;
```

### 3. スキーマを明示的に指定

```sql
-- より安全な書き方
CREATE OR REPLACE FUNCTION safe_function()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- テーブル名にスキーマを明示
  UPDATE public.users SET updated_at = NOW();
  -- 関数呼び出しにもスキーマを明示
  PERFORM public.another_function();
END;
$$;
```

## 参考資料

- [PostgreSQL Security Best Practices - Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Understanding search_path in PostgreSQL](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [SECURITY DEFINER vs SECURITY INVOKER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

## まとめ

| 項目 | 推奨設定 |
|------|---------|
| search_path | `SET search_path = public, pg_temp` |
| SECURITY | `SECURITY DEFINER` または `SECURITY INVOKER` を明示 |
| スキーマ参照 | テーブル名にスキーマを明示（例: `public.users`） |
| 権限 | 必要最小限の権限のみ付与 |


