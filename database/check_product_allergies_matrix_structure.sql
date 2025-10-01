-- product_allergies_matrixテーブルの構造を確認

-- テーブルのカラム一覧を取得
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_allergies_matrix'
ORDER BY ordinal_position;

-- テーブルの最初の数行を確認
SELECT * 
FROM product_allergies_matrix 
LIMIT 5;

-- 現在のビュー定義を確認
SELECT pg_get_viewdef('public.product_allergies_matrix_json'::regclass, true) as current_view_definition;

