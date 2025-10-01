# Row Level Security (RLS) セットアップガイド

## 概要
Supabaseのセキュリティベストプラクティスに従い、すべてのpublicテーブルにRow Level Security (RLS)を有効化します。

## 警告メッセージへの対応

以下のような警告が表示された場合：
```
Entity: public.symbol_mapping_suggestions
Issue: Table public.symbol_mapping_suggestions is public, but RLS has not been enabled.
```

このガイドに従ってRLSを有効化してください。

## セットアップ手順

### オプション1: すべてのテーブルに一括適用（推奨）

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. `database/enable_rls_all_tables.sql` の内容をコピー＆ペースト
5. 「Run」ボタンをクリックして実行

このスクリプトは以下のテーブルにRLSを設定します：
- `allergy_items`
- `users`
- `user_allergy_settings`
- `products`
- `product_allergies`
- `product_safety_results`
- `store_locations`
- `symbol_mapping_suggestions`
- `product_store_locations`
- `search_performance_log` (存在する場合)

### オプション2: 個別のテーブルに適用

特定のテーブル（例: `symbol_mapping_suggestions`）のみにRLSを適用する場合：

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `database/enable_rls_symbol_mapping.sql` の内容をコピー＆ペースト
3. 「Run」ボタンをクリック

## RLSポリシーの説明

### 公開データテーブル
以下のテーブルは誰でも読み取り可能です（SELECT）：
- `allergy_items` - アレルギー項目マスタ
- `products` - 商品情報
- `product_allergies` - 商品のアレルギー情報
- `store_locations` - 店舗情報
- `symbol_mapping_suggestions` - 記号マッピング提案

追加・更新・削除は認証済みユーザーのみ可能です。

### ユーザー専用データテーブル
以下のテーブルは各ユーザーが自分のデータのみアクセス可能です：
- `users` - ユーザー情報
- `user_allergy_settings` - ユーザーのアレルギー設定
- `product_safety_results` - ユーザーごとの安全性判定結果

## RLS状態の確認

以下のSQLでRLSの有効状態を確認できます：

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## トラブルシューティング

### エラー: "permission denied for table"
- RLSポリシーが正しく設定されていない可能性があります
- 認証状態を確認してください（ログインが必要な操作の場合）

### エラー: "function update_updated_at_column() does not exist"
- `src/database/allergy-schema.sql` を先に実行する必要があります
- このファイルに `update_updated_at_column()` 関数の定義が含まれています

### 警告が消えない場合
1. Supabaseダッシュボードを再読み込み
2. テーブルエディタで対象テーブルを確認
3. 「Policies」タブでポリシーが正しく設定されているか確認

## セキュリティ考慮事項

1. **公開データ**: アレルギー情報や商品情報は公開データとして扱い、誰でも読み取り可能にしています
2. **個人データ**: ユーザーのアレルギー設定などは、本人のみがアクセス可能です
3. **管理者権限**: 現在は認証済みユーザーが商品データを編集可能ですが、将来的には管理者ロールを実装することを推奨します

## 今後の改善案

- 管理者ロールの実装（特定ユーザーのみが商品データを編集可能）
- 監査ログの実装（誰がいつデータを変更したかの記録）
- より細かいアクセス制御（例: 企業ごとのデータ管理）

## 参考資料

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

