-- 検索機能改善用のインデックス作成スクリプト

-- 1. 必要な拡張の追加
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. 基本的なインデックス（既存チェック付き）
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 3. 全文検索インデックス（既存のenglish設定を使用）
-- 注意: idx_products_search_vector は既に存在するため、スキップ

-- 4. 複合インデックス
CREATE INDEX IF NOT EXISTS idx_product_allergies_composite 
ON product_allergies (allergy_item_id, presence_type, product_id);

-- 5. トリグラムインデックス
CREATE INDEX IF NOT EXISTS idx_store_locations_address_trgm 
ON store_locations USING gin(address gin_trgm_ops);

-- 6. その他のインデックス
CREATE INDEX IF NOT EXISTS idx_products_category_updated 
ON products (category, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique 
ON products (barcode) WHERE barcode IS NOT NULL;

-- 7. パフォーマンス監視用のテーブルと関数
CREATE TABLE IF NOT EXISTS search_performance_log (
  id SERIAL PRIMARY KEY,
  search_term TEXT,
  execution_time_ms FLOAT,
  result_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 検索パフォーマンスの記録関数
CREATE OR REPLACE FUNCTION log_search_performance(
  search_term TEXT,
  execution_time_ms FLOAT,
  result_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO search_performance_log (
    search_term,
    execution_time_ms,
    result_count,
    created_at
  ) VALUES (
    search_term,
    execution_time_ms,
    result_count,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- 8. パフォーマンス監視用のビュー
CREATE OR REPLACE VIEW search_performance_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan > 0 THEN idx_tup_read::float / idx_scan
    ELSE 0 
  END as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('products', 'store_locations', 'product_allergies')
ORDER BY idx_scan DESC;

-- 9. 使用頻度の低いインデックスを特定するクエリ
-- SELECT * FROM search_performance_stats WHERE index_scans = 0;
