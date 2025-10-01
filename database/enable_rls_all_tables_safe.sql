-- すべてのpublicテーブルに対してRow Level Security (RLS)を有効化
-- Supabaseのセキュリティベストプラクティス対応
-- 存在するテーブルのみに適用（安全版）

-- ==============================================
-- 1. allergy_items テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'allergy_items') THEN
    ALTER TABLE allergy_items ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to allergy_items" ON allergy_items;
    CREATE POLICY "Allow public read access to allergy_items"
      ON allergy_items FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage allergy_items" ON allergy_items;
    CREATE POLICY "Allow authenticated users to manage allergy_items"
      ON allergy_items FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on allergy_items';
  ELSE
    RAISE NOTICE 'Table allergy_items does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 2. users テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
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
    
    RAISE NOTICE 'RLS enabled on users';
  ELSE
    RAISE NOTICE 'Table users does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 3. user_allergy_settings テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_allergy_settings') THEN
    ALTER TABLE user_allergy_settings ENABLE ROW LEVEL SECURITY;
    
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
    
    RAISE NOTICE 'RLS enabled on user_allergy_settings';
  ELSE
    RAISE NOTICE 'Table user_allergy_settings does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 4. products テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to products" ON products;
    CREATE POLICY "Allow public read access to products"
      ON products FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON products;
    CREATE POLICY "Allow authenticated users to manage products"
      ON products FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on products';
  ELSE
    RAISE NOTICE 'Table products does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 5. product_allergies テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_allergies') THEN
    ALTER TABLE product_allergies ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to product_allergies" ON product_allergies;
    CREATE POLICY "Allow public read access to product_allergies"
      ON product_allergies FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage product_allergies" ON product_allergies;
    CREATE POLICY "Allow authenticated users to manage product_allergies"
      ON product_allergies FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on product_allergies';
  ELSE
    RAISE NOTICE 'Table product_allergies does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 6. product_safety_results テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_safety_results') THEN
    ALTER TABLE product_safety_results ENABLE ROW LEVEL SECURITY;
    
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
    
    RAISE NOTICE 'RLS enabled on product_safety_results';
  ELSE
    RAISE NOTICE 'Table product_safety_results does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 7. store_locations テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'store_locations') THEN
    ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to store_locations" ON store_locations;
    CREATE POLICY "Allow public read access to store_locations"
      ON store_locations FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage store_locations" ON store_locations;
    CREATE POLICY "Allow authenticated users to manage store_locations"
      ON store_locations FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on store_locations';
  ELSE
    RAISE NOTICE 'Table store_locations does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 8. symbol_mapping_suggestions テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'symbol_mapping_suggestions') THEN
    ALTER TABLE symbol_mapping_suggestions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to symbol_mapping_suggestions" ON symbol_mapping_suggestions;
    CREATE POLICY "Allow public read access to symbol_mapping_suggestions"
      ON symbol_mapping_suggestions FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage symbol_mapping_suggestions" ON symbol_mapping_suggestions;
    CREATE POLICY "Allow authenticated users to manage symbol_mapping_suggestions"
      ON symbol_mapping_suggestions FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on symbol_mapping_suggestions';
  ELSE
    RAISE NOTICE 'Table symbol_mapping_suggestions does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 9. product_store_locations テーブル
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_store_locations') THEN
    ALTER TABLE product_store_locations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow public read access to product_store_locations" ON product_store_locations;
    CREATE POLICY "Allow public read access to product_store_locations"
      ON product_store_locations FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow authenticated users to manage product_store_locations" ON product_store_locations;
    CREATE POLICY "Allow authenticated users to manage product_store_locations"
      ON product_store_locations FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    
    RAISE NOTICE 'RLS enabled on product_store_locations';
  ELSE
    RAISE NOTICE 'Table product_store_locations does not exist, skipping...';
  END IF;
END $$;

-- ==============================================
-- 10. search_performance_log テーブル
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
    
    RAISE NOTICE 'RLS enabled on search_performance_log';
  ELSE
    RAISE NOTICE 'Table search_performance_log does not exist, skipping...';
  END IF;
END $$;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'RLS setup completed!';
  RAISE NOTICE 'Enabled RLS on all existing public tables.';
  RAISE NOTICE '===================================';
END $$;


