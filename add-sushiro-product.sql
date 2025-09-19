-- productsテーブルにスシローを追加

-- 1. 現在のproductsテーブルを確認
SELECT id, name, brand FROM products WHERE name ILIKE '%スシロー%' OR name ILIKE '%sushiro%';

-- 2. スシローをproductsテーブルに追加
INSERT INTO products (name, brand, category, description)
VALUES ('スシロー', 'スシロー', 'レストラン', '回転寿司チェーン')
ON CONFLICT (name, brand) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. 追加後の確認
SELECT id, name, brand, category FROM products WHERE name = 'スシロー';

-- 4. 他の商品も確認（参考）
SELECT id, name, brand FROM products ORDER BY id DESC LIMIT 10;
