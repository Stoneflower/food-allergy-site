# Supabaseサポート問い合わせテンプレート

## Security Advisor警告が消えない問題

### 問題の詳細

Security Advisorで以下の警告が表示されていますが、PostgreSQL側では完全に修正済みです：

**警告内容**:
- Entity: `public.vw_company_card_eligible` (他のビューも該当する可能性あり)
- Issue: View is defined with the SECURITY DEFINER property
- Description: Detects views defined with the SECURITY DEFINER property

### 実施した対応

1. **ビューの再作成**: すべてのビューをDROPして、SECURITY DEFINERなしで再作成
2. **PostgreSQL側の確認**: 以下のクエリで確認済み

```sql
SELECT 
  viewname,
  CASE 
    WHEN definition ILIKE '%SECURITY%DEFINER%' THEN 'Found SECURITY DEFINER'
    ELSE 'No SECURITY keyword'
  END as security_check
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible');
```

**結果**: すべてのビューが `No SECURITY keyword` ✅

3. **ビューオプションの確認**:

```sql
SELECT 
  c.relname as view_name,
  c.reloptions as view_options
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('product_allergies_matrix_json', 'v_product_allergies', 'vw_company_card_eligible')
  AND c.relkind = 'v';
```

**結果**: すべてのビューで `view_options: null` ✅

4. **ブラウザのリフレッシュ**: Ctrl+F5でハードリフレッシュ実施済み

### 質問

PostgreSQL側では完全に修正されているにもかかわらず、Security Advisorで警告が表示され続けています。

- Security Advisorのスキャン更新頻度はどのくらいですか？
- キャッシュをクリアする方法はありますか？
- 手動でスキャンを再実行することは可能ですか？

### 環境情報

- **プロジェクトID**: [あなたのプロジェクトID]
- **リージョン**: [あなたのリージョン]
- **問題発生日時**: 2025年10月1日
- **PostgreSQLバージョン**: [バージョン確認: `SELECT version();`]

### 添付情報

以下のクエリ結果を添付：

```sql
-- 1. ビュー定義
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'vw_company_card_eligible';

-- 2. ビューオプション
SELECT c.relname, c.reloptions, c.relacl
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'vw_company_card_eligible';

-- 3. ビューのルール定義
SELECT r.rulename, pg_get_ruledef(r.oid, true)
FROM pg_rewrite r
JOIN pg_class c ON r.ev_class = c.oid
WHERE c.relname = 'vw_company_card_eligible';
```

---

よろしくお願いいたします。


