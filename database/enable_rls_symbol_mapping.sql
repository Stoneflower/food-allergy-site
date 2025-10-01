-- Row Level Security (RLS) を symbol_mapping_suggestions テーブルに有効化
-- Supabaseのセキュリティ警告対応

-- ステップ1: RLSを有効化（テーブルが既に存在する前提）
ALTER TABLE symbol_mapping_suggestions ENABLE ROW LEVEL SECURITY;

-- ステップ2: 既存のポリシーを削除（冪等性のため）
DROP POLICY IF EXISTS "Allow public read access to symbol_mapping_suggestions" ON symbol_mapping_suggestions;
DROP POLICY IF EXISTS "Allow authenticated users to insert symbol_mapping_suggestions" ON symbol_mapping_suggestions;
DROP POLICY IF EXISTS "Allow authenticated users to update symbol_mapping_suggestions" ON symbol_mapping_suggestions;
DROP POLICY IF EXISTS "Allow authenticated users to delete symbol_mapping_suggestions" ON symbol_mapping_suggestions;
DROP POLICY IF EXISTS "Allow authenticated users to manage symbol_mapping_suggestions" ON symbol_mapping_suggestions;

-- ステップ3: ポリシーを作成

-- ポリシー1: すべてのユーザーが読み取り可能（公開データとして扱う）
CREATE POLICY "Allow public read access to symbol_mapping_suggestions"
  ON symbol_mapping_suggestions
  FOR SELECT
  USING (true);

-- ポリシー2: 認証済みユーザーは全操作可能（簡易版）
CREATE POLICY "Allow authenticated users to manage symbol_mapping_suggestions"
  ON symbol_mapping_suggestions
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'RLS has been successfully enabled on symbol_mapping_suggestions table.';
  RAISE NOTICE 'Public users can read data. Authenticated users can manage data.';
END $$;

