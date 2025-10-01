-- Row Level Security (RLS) を product_store_locations テーブルに有効化
-- Supabaseのセキュリティ警告対応

-- ステップ1: RLSを有効化
ALTER TABLE product_store_locations ENABLE ROW LEVEL SECURITY;

-- ステップ2: 既存のポリシーを削除（冪等性のため）
DROP POLICY IF EXISTS "Allow public read access to product_store_locations" ON product_store_locations;
DROP POLICY IF EXISTS "Allow authenticated users to manage product_store_locations" ON product_store_locations;

-- ステップ3: ポリシーを作成

-- ポリシー1: すべてのユーザーが読み取り可能（公開データとして扱う）
CREATE POLICY "Allow public read access to product_store_locations"
  ON product_store_locations
  FOR SELECT
  USING (true);

-- ポリシー2: 認証済みユーザーは全操作可能
CREATE POLICY "Allow authenticated users to manage product_store_locations"
  ON product_store_locations
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'RLS has been successfully enabled on product_store_locations table.';
  RAISE NOTICE 'Public users can read data. Authenticated users can manage data.';
END $$;


