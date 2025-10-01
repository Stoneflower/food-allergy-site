# Supabase セキュリティ設定ガイド

## 1. Leaked Password Protection（パスワード漏洩保護）

### 警告メッセージ
```
Entity: Auth
Issue: Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.
Description: Leaked password protection is currently disabled.
```

### 設定方法

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニュー「Authentication」→「Policies」をクリック
4. 「Password Protection」セクションを探す
5. 「Enable Leaked Password Protection」をオンに切り替え
6. 保存

### この機能について

- **目的**: HaveIBeenPwned.orgのデータベースと照合し、過去に漏洩したパスワードの使用を防ぐ
- **影響**: ユーザー登録時・パスワード変更時に自動チェック
- **推奨**: 本番環境では必ず有効化すること

---

## 2. Row Level Security (RLS)

### 警告メッセージ
```
Entity: public.[table_name]
Issue: Table public.[table_name] is public, but RLS has not been enabled.
```

### 設定方法

詳細は `database/RLS_SETUP.md` を参照してください。

#### クイック設定（全テーブル一括）

```sql
-- database/enable_rls_all_tables.sql を実行
```

#### 個別テーブルの設定

```sql
-- 例: symbol_mapping_suggestions
-- database/enable_rls_symbol_mapping.sql を実行
```

---

## 3. その他の推奨セキュリティ設定

### 3.1 メール確認の有効化

**設定場所**: Authentication → Settings → Email

- ✅ Enable Email Confirmations
- ✅ Secure Email Change
- ✅ Email OTP

### 3.2 パスワードポリシー

**設定場所**: Authentication → Policies → Password Requirements

推奨設定:
- Minimum Length: 8文字以上
- Require Uppercase: 有効
- Require Lowercase: 有効
- Require Numbers: 有効
- Require Special Characters: 有効（推奨）

### 3.3 レート制限

**設定場所**: Authentication → Rate Limits

推奨設定:
- Sign Up: 5 attempts per hour
- Sign In: 10 attempts per hour
- Password Recovery: 3 attempts per hour

### 3.4 セッション設定

**設定場所**: Authentication → Sessions

推奨設定:
- Session Timeout: 604800秒（7日間）
- Refresh Token Rotation: 有効
- Reuse Interval: 10秒

---

## 4. データベースセキュリティ

### 4.1 接続セキュリティ

- ✅ SSL接続の強制
- ✅ IPホワイトリスト（必要に応じて）
- ✅ 本番環境では`service_role`キーを環境変数で管理

### 4.2 APIキーの管理

**重要**: 以下のキーは絶対にコミットしない
- `service_role` key（サーバーサイドのみ）
- `anon` key（フロントエンドで使用可能だが公開リポジトリには含めない）

`.env`ファイルの例:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`.gitignore`に追加:
```
.env
.env.local
```

---

## 5. セキュリティチェックリスト

本番環境デプロイ前の確認事項:

- [ ] RLSがすべてのpublicテーブルで有効
- [ ] Leaked Password Protection有効
- [ ] メール確認有効
- [ ] 強固なパスワードポリシー設定
- [ ] レート制限設定
- [ ] APIキーが環境変数で管理されている
- [ ] SSL接続強制
- [ ] 不要なテーブル・カラムの削除
- [ ] ログ監視の設定
- [ ] バックアップの自動化

---

## 6. モニタリング

### 6.1 ログの確認

**設定場所**: Logs → Auth Logs

定期的に以下を確認:
- 不審なログイン試行
- パスワードリセットの頻度
- エラーログ

### 6.2 使用量の監視

**設定場所**: Settings → Usage

確認項目:
- データベースサイズ
- API呼び出し数
- ストレージ使用量
- 帯域幅

---

## 7. インシデント対応

### セキュリティ侵害が疑われる場合

1. **即座に実行**
   - すべてのAPIキーをローテーション
   - 疑わしいユーザーセッションを無効化
   - RLSポリシーの再確認

2. **調査**
   - Auth Logsを確認
   - Database Logsを確認
   - 不審なアクティビティの特定

3. **対処**
   - 影響を受けたユーザーに通知
   - パスワードリセットを強制
   - 必要に応じてSupabaseサポートに連絡

---

## 参考資料

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui#security-best-practices)
- [Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)


