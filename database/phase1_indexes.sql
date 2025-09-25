-- Phase 1: 即座に実行すべきインデックス最適化
-- SupabaseのSQL Editorで実行してください

-- 1. 全文検索用のGINインデックス（最優先）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_vector 
ON products USING gin(
  to_tsvector('japanese', 
    coalesce(name, '') || ' ' || 
    coalesce(product_title, '') || ' ' || 
    coalesce(brand, '') || ' ' || 
    coalesce(description, '')
  )
);

-- 2. アレルギー検索用の複合インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_allergies_composite 
ON product_allergies (allergy_item_id, presence_type, product_id);

-- 3. 店舗検索用のトリグラムインデックス
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_locations_address_trgm 
ON store_locations USING gin(address gin_trgm_ops);

-- 4. 商品カテゴリ検索用の複合インデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_updated 
ON products (category, updated_at DESC);

-- 5. バーコード検索用のユニークインデックス
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode_unique 
ON products (barcode) WHERE barcode IS NOT NULL;

-- 6. 商品名検索用のインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

-- 7. 商品タイトル検索用のインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_title_trgm 
ON products USING gin(product_title gin_trgm_ops);

-- 8. 店舗名検索用のインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_locations_branch_name_trgm 
ON store_locations USING gin(branch_name gin_trgm_ops);

-- 9. アレルギー項目検索用のインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergy_items_name_trgm 
ON allergy_items USING gin(name gin_trgm_ops);

-- 10. 商品更新日時検索用のインデックス
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_updated_at 
ON products (updated_at DESC);

-- インデックス作成完了の確認
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
ORDER BY tablename, indexname;
