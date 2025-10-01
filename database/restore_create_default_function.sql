-- create_default_product_allergies_matrix 関数の実装を復元
-- product_idに基づいてデフォルトのアレルギーマトリックスを作成

-- ==============================================
-- 関数を正しい実装で再作成
-- ==============================================

CREATE OR REPLACE FUNCTION public.create_default_product_allergies_matrix(p_product_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  menu_item_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- product_idに紐づくすべてのmenu_itemsに対してデフォルト行を作成
  FOR menu_item_record IN
    SELECT id, name
    FROM menu_items
    WHERE product_id = p_product_id
  LOOP
    -- 既存のmatrix行があるか確認
    IF NOT EXISTS (
      SELECT 1 FROM product_allergies_matrix
      WHERE product_id = p_product_id
        AND menu_item_id = menu_item_record.id
    ) THEN
      -- デフォルト値でINSERT
      INSERT INTO product_allergies_matrix (
        product_id,
        menu_item_id,
        menu_name,
        egg, milk, wheat, buckwheat, peanut, shrimp, crab,
        walnut, almond, abalone, squid, salmon_roe, orange,
        cashew, kiwi, beef, gelatin, sesame, salmon, mackerel,
        soybean, chicken, banana, pork, matsutake, peach, yam,
        apple, macadamia
      ) VALUES (
        p_product_id,
        menu_item_record.id,
        menu_item_record.name,
        'none', 'none', 'none', 'none', 'none', 'none', 'none',
        'none', 'none', 'none', 'none', 'none', 'none',
        'none', 'none', 'none', 'none', 'none', 'none', 'none',
        'none', 'none', 'none', 'none', 'none', 'none', 'none',
        'none', 'none'
      );
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Created % default matrix rows for product_id %', inserted_count, p_product_id;
END;
$$;

COMMENT ON FUNCTION public.create_default_product_allergies_matrix(integer) IS 
  'Creates default product allergies matrix rows for all menu items of a product. Safe search_path configured.';

-- ==============================================
-- テスト実行
-- ==============================================

-- product_id = 205 でテスト
SELECT create_default_product_allergies_matrix(205);

-- 結果確認
SELECT 
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ データが作成されました'
    ELSE '❌ データが作成されませんでした'
  END as status
FROM product_allergies_matrix
WHERE product_id = 205;

-- 作成されたデータのサンプルを表示
SELECT *
FROM product_allergies_matrix
WHERE product_id = 205
LIMIT 5;

