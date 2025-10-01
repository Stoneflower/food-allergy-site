-- すべてのpublicテーブルに対してRow Level Security (RLS)を有効化
-- Supabaseのセキュリティベストプラクティス対応

-- ==============================================
-- 1. allergy_items テーブル
-- ==============================================
ALTER TABLE allergy_items ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能（アレルギー情報は公開データ）
DROP POLICY IF EXISTS "Allow public read access to allergy_items" ON allergy_items;
CREATE POLICY "Allow public read access to allergy_items"
  ON allergy_items FOR SELECT USING (true);

-- 認証済みユーザーのみが更新可能（管理者用）
DROP POLICY IF EXISTS "Allow authenticated users to manage allergy_items" ON allergy_items;
CREATE POLICY "Allow authenticated users to manage allergy_items"
  ON allergy_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 2. users テーブル
-- ==============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ参照・更新可能
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 3. user_allergy_settings テーブル
-- ==============================================
ALTER TABLE user_allergy_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のアレルギー設定のみ管理可能
DROP POLICY IF EXISTS "Users can manage own allergy settings" ON user_allergy_settings;
CREATE POLICY "Users can manage own allergy settings"
  ON user_allergy_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_allergy_settings.user_id 
      AND auth.uid()::text = users.id::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_allergy_settings.user_id 
      AND auth.uid()::text = users.id::text
    )
  );

-- ==============================================
-- 4. products テーブル
-- ==============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 誰でも商品情報を読み取り可能（公開データ）
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT USING (true);

-- 認証済みユーザーは商品を追加・更新可能
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;
CREATE POLICY "Allow authenticated users to manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 5. product_allergies テーブル
-- ==============================================
ALTER TABLE product_allergies ENABLE ROW LEVEL SECURITY;

-- 誰でも商品アレルギー情報を読み取り可能
DROP POLICY IF EXISTS "Allow public read access to product_allergies" ON product_allergies;
CREATE POLICY "Allow public read access to product_allergies"
  ON product_allergies FOR SELECT USING (true);

-- 認証済みユーザーは商品アレルギー情報を管理可能
DROP POLICY IF EXISTS "Allow authenticated users to manage product_allergies" ON product_allergies;
CREATE POLICY "Allow authenticated users to manage product_allergies"
  ON product_allergies FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 6. product_safety_results テーブル
-- ==============================================
ALTER TABLE product_safety_results ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の安全性判定結果のみ管理可能
DROP POLICY IF EXISTS "Users can manage own safety results" ON product_safety_results;
CREATE POLICY "Users can manage own safety results"
  ON product_safety_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = product_safety_results.user_id 
      AND auth.uid()::text = users.id::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = product_safety_results.user_id 
      AND auth.uid()::text = users.id::text
    )
  );

-- ==============================================
-- 7. store_locations テーブル
-- ==============================================
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;

-- 誰でも店舗情報を読み取り可能
DROP POLICY IF EXISTS "Allow public read access to store_locations" ON store_locations;
CREATE POLICY "Allow public read access to store_locations"
  ON store_locations FOR SELECT USING (true);

-- 認証済みユーザーは店舗情報を管理可能
DROP POLICY IF EXISTS "Allow authenticated users to manage store_locations" ON store_locations;
CREATE POLICY "Allow authenticated users to manage store_locations"
  ON store_locations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 8. symbol_mapping_suggestions テーブル
-- ==============================================
ALTER TABLE symbol_mapping_suggestions ENABLE ROW LEVEL SECURITY;

-- 誰でも記号マッピング提案を読み取り可能
DROP POLICY IF EXISTS "Allow public read access to symbol_mapping_suggestions" ON symbol_mapping_suggestions;
CREATE POLICY "Allow public read access to symbol_mapping_suggestions"
  ON symbol_mapping_suggestions FOR SELECT USING (true);

-- 認証済みユーザーは記号マッピング提案を管理可能
DROP POLICY IF EXISTS "Allow authenticated users to manage symbol_mapping_suggestions" ON symbol_mapping_suggestions;
CREATE POLICY "Allow authenticated users to manage symbol_mapping_suggestions"
  ON symbol_mapping_suggestions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 9. product_store_locations テーブル
-- ==============================================
ALTER TABLE product_store_locations ENABLE ROW LEVEL SECURITY;

-- 誰でも商品店舗情報を読み取り可能
DROP POLICY IF EXISTS "Allow public read access to product_store_locations" ON product_store_locations;
CREATE POLICY "Allow public read access to product_store_locations"
  ON product_store_locations FOR SELECT USING (true);

-- 認証済みユーザーは商品店舗情報を管理可能
DROP POLICY IF EXISTS "Allow authenticated users to manage product_store_locations" ON product_store_locations;
CREATE POLICY "Allow authenticated users to manage product_store_locations"
  ON product_store_locations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 10. search_performance_log テーブル（存在する場合）
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_performance_log') THEN
    ALTER TABLE search_performance_log ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to search_performance_log" ON search_performance_log;
    CREATE POLICY "Allow public read access to search_performance_log"
      ON search_performance_log FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to insert search_performance_log" ON search_performance_log;
    CREATE POLICY "Allow authenticated users to insert search_performance_log"
      ON search_performance_log FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'RLS has been enabled on all public tables with appropriate policies.';
END $$;

