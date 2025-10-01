-- RLSが未設定のテーブルに対してRow Level Security (RLS)を有効化
-- 確認結果から rls_enabled = false のテーブルのみ対象

-- ==============================================
-- allergy_items テーブル
-- ==============================================
ALTER TABLE allergy_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to allergy_items" ON allergy_items;
CREATE POLICY "Allow public read access to allergy_items"
  ON allergy_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage allergy_items" ON allergy_items;
CREATE POLICY "Allow authenticated users to manage allergy_items"
  ON allergy_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- country_allergy_items テーブル
-- ==============================================
ALTER TABLE country_allergy_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to country_allergy_items" ON country_allergy_items;
CREATE POLICY "Allow public read access to country_allergy_items"
  ON country_allergy_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage country_allergy_items" ON country_allergy_items;
CREATE POLICY "Allow authenticated users to manage country_allergy_items"
  ON country_allergy_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- menu_item_allergies テーブル
-- ==============================================
ALTER TABLE menu_item_allergies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to menu_item_allergies" ON menu_item_allergies;
CREATE POLICY "Allow public read access to menu_item_allergies"
  ON menu_item_allergies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage menu_item_allergies" ON menu_item_allergies;
CREATE POLICY "Allow authenticated users to manage menu_item_allergies"
  ON menu_item_allergies FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- menu_items テーブル
-- ==============================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage menu_items" ON menu_items;
CREATE POLICY "Allow authenticated users to manage menu_items"
  ON menu_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- product_allergies_matrix テーブル
-- ==============================================
ALTER TABLE product_allergies_matrix ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to product_allergies_matrix" ON product_allergies_matrix;
CREATE POLICY "Allow public read access to product_allergies_matrix"
  ON product_allergies_matrix FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage product_allergies_matrix" ON product_allergies_matrix;
CREATE POLICY "Allow authenticated users to manage product_allergies_matrix"
  ON product_allergies_matrix FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- product_categories テーブル
-- ==============================================
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to product_categories" ON product_categories;
CREATE POLICY "Allow public read access to product_categories"
  ON product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage product_categories" ON product_categories;
CREATE POLICY "Allow authenticated users to manage product_categories"
  ON product_categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- restaurants テーブル
-- ==============================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to restaurants" ON restaurants;
CREATE POLICY "Allow public read access to restaurants"
  ON restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage restaurants" ON restaurants;
CREATE POLICY "Allow authenticated users to manage restaurants"
  ON restaurants FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- search_performance_log テーブル
-- ==============================================
ALTER TABLE search_performance_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to search_performance_log" ON search_performance_log;
CREATE POLICY "Allow public read access to search_performance_log"
  ON search_performance_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert search_performance_log" ON search_performance_log;
CREATE POLICY "Allow authenticated users to insert search_performance_log"
  ON search_performance_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- user_allergy_settings テーブル
-- ==============================================
ALTER TABLE user_allergy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to user_allergy_settings" ON user_allergy_settings;
CREATE POLICY "Allow public read access to user_allergy_settings"
  ON user_allergy_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage user_allergy_settings" ON user_allergy_settings;
CREATE POLICY "Allow authenticated users to manage user_allergy_settings"
  ON user_allergy_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 完了メッセージ
-- ==============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'RLS enabled on remaining tables!';
  RAISE NOTICE 'Total tables updated: 9';
  RAISE NOTICE '===================================';
END $$;


