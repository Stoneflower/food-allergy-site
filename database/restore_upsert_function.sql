-- upsert_product_allergies_matrix 関数の実装を復元
-- staging_importsからデータを読み取ってproduct_allergies_matrixを更新

CREATE OR REPLACE FUNCTION public.upsert_product_allergies_matrix(
  p_product_id integer,
  p_batch_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  staging_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- staging_importsテーブルから該当バッチのデータを取得して更新
  FOR staging_record IN
    SELECT 
      raw_menu_name as menu_name,
      egg, milk, wheat, buckwheat, peanut, shrimp, crab,
      walnut, almond, abalone, squid, salmon_roe, orange,
      cashew, kiwi, beef, gelatin, sesame, salmon, mackerel,
      COALESCE(soybean, soy) as soybean, -- 両方対応（後方互換性）
      chicken, banana, pork, matsutake, peach, yam,
      apple, macadamia
    FROM staging_imports
    WHERE import_batch_id = p_batch_id
  LOOP
    -- menu_nameでproduct_allergies_matrixを更新
    UPDATE product_allergies_matrix
    SET
      egg = COALESCE(staging_record.egg, 'none'),
      milk = COALESCE(staging_record.milk, 'none'),
      wheat = COALESCE(staging_record.wheat, 'none'),
      buckwheat = COALESCE(staging_record.buckwheat, 'none'),
      peanut = COALESCE(staging_record.peanut, 'none'),
      shrimp = COALESCE(staging_record.shrimp, 'none'),
      crab = COALESCE(staging_record.crab, 'none'),
      walnut = COALESCE(staging_record.walnut, 'none'),
      almond = COALESCE(staging_record.almond, 'none'),
      abalone = COALESCE(staging_record.abalone, 'none'),
      squid = COALESCE(staging_record.squid, 'none'),
      salmon_roe = COALESCE(staging_record.salmon_roe, 'none'),
      orange = COALESCE(staging_record.orange, 'none'),
      cashew = COALESCE(staging_record.cashew, 'none'),
      kiwi = COALESCE(staging_record.kiwi, 'none'),
      beef = COALESCE(staging_record.beef, 'none'),
      gelatin = COALESCE(staging_record.gelatin, 'none'),
      sesame = COALESCE(staging_record.sesame, 'none'),
      salmon = COALESCE(staging_record.salmon, 'none'),
      mackerel = COALESCE(staging_record.mackerel, 'none'),
      soybean = COALESCE(staging_record.soybean, 'none'),
      chicken = COALESCE(staging_record.chicken, 'none'),
      banana = COALESCE(staging_record.banana, 'none'),
      pork = COALESCE(staging_record.pork, 'none'),
      matsutake = COALESCE(staging_record.matsutake, 'none'),
      peach = COALESCE(staging_record.peach, 'none'),
      yam = COALESCE(staging_record.yam, 'none'),
      apple = COALESCE(staging_record.apple, 'none'),
      macadamia = COALESCE(staging_record.macadamia, 'none'),
      updated_at = NOW()
    WHERE product_id = p_product_id
      AND menu_name = staging_record.menu_name;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated % product_allergies_matrix rows for product_id % from batch %', 
    updated_count, p_product_id, p_batch_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_product_allergies_matrix(integer, uuid) IS 
  'Updates product allergies matrix from staging_imports data. Safe search_path configured.';

-- ==============================================
-- テスト実行（最新のバッチIDを取得して実行）
-- ==============================================

DO $$
DECLARE
  latest_batch uuid;
BEGIN
  -- 最新のバッチIDを取得
  SELECT import_batch_id INTO latest_batch
  FROM staging_imports
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF latest_batch IS NOT NULL THEN
    RAISE NOTICE 'Testing with import_batch_id: %', latest_batch;
    PERFORM upsert_product_allergies_matrix(205, latest_batch);
  ELSE
    RAISE NOTICE 'No staging_imports data found';
  END IF;
END $$;

-- 結果確認
SELECT 
  menu_name,
  egg, milk, wheat, soybean,
  shrimp, crab, chicken, pork
FROM product_allergies_matrix
WHERE product_id = 205
  AND (egg != 'none' OR milk != 'none' OR wheat != 'none' OR soybean != 'none')
LIMIT 10;
