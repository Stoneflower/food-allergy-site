-- 最適化されたproduct_allergies_matrix自動更新関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS upsert_product_allergies_matrix(INTEGER, UUID);

-- 最適化された関数を作成
CREATE OR REPLACE FUNCTION upsert_product_allergies_matrix(
  p_product_id INTEGER,
  p_batch_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_updated_count INTEGER := 0;
BEGIN
  -- 1. 全メニュー分を既定値で補完（存在しない行のみ）
  -- バッチ処理で効率化
  WITH new_menu_items AS (
    SELECT mi.product_id, mi.id, mi.name
    FROM menu_items mi
    LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
    WHERE mi.product_id = p_product_id
      AND pam.menu_item_id IS NULL
  )
  INSERT INTO product_allergies_matrix (
    product_id, menu_item_id, menu_name,
    egg, milk, wheat, buckwheat, peanut, shrimp, crab, walnut, almond,
    abalone, squid, salmon_roe, orange, cashew, kiwi, beef, gelatin,
    sesame, salmon, mackerel, soybean, chicken, banana, pork, matsutake,
    peach, yam, apple, macadamia
  )
  SELECT
    nmi.product_id, nmi.id, nmi.name,
    'n','n','n','n','n','n','n','n','n',
    'n','n','n','n','n','n','n','n',
    'n','n','n','n','n','n','n','n',
    'n','n','n','n'
  FROM new_menu_items nmi;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- 2. staging_importsからアレルギー情報を反映（最適化版）
  -- CTEを使わず直接JOINで効率化
  UPDATE product_allergies_matrix pam
  SET 
    egg = CASE WHEN si.egg IN ('direct','trace') THEN 'y' ELSE 'n' END,
    milk = CASE WHEN si.milk IN ('direct','trace') THEN 'y' ELSE 'n' END,
    wheat = CASE WHEN si.wheat IN ('direct','trace') THEN 'y' ELSE 'n' END,
    buckwheat = CASE WHEN si.buckwheat IN ('direct','trace') THEN 'y' ELSE 'n' END,
    peanut = CASE WHEN si.peanut IN ('direct','trace') THEN 'y' ELSE 'n' END,
    shrimp = CASE WHEN si.shrimp IN ('direct','trace') THEN 'y' ELSE 'n' END,
    crab = CASE WHEN si.crab IN ('direct','trace') THEN 'y' ELSE 'n' END,
    walnut = CASE WHEN si.walnut IN ('direct','trace') THEN 'y' ELSE 'n' END,
    almond = CASE WHEN si.almond IN ('direct','trace') THEN 'y' ELSE 'n' END,
    abalone = CASE WHEN si.abalone IN ('direct','trace') THEN 'y' ELSE 'n' END,
    squid = CASE WHEN si.squid IN ('direct','trace') THEN 'y' ELSE 'n' END,
    salmon_roe = CASE WHEN si.salmon_roe IN ('direct','trace') THEN 'y' ELSE 'n' END,
    orange = CASE WHEN si.orange IN ('direct','trace') THEN 'y' ELSE 'n' END,
    cashew = CASE WHEN si.cashew IN ('direct','trace') THEN 'y' ELSE 'n' END,
    kiwi = CASE WHEN si.kiwi IN ('direct','trace') THEN 'y' ELSE 'n' END,
    beef = CASE WHEN si.beef IN ('direct','trace') THEN 'y' ELSE 'n' END,
    gelatin = CASE WHEN si.gelatin IN ('direct','trace') THEN 'y' ELSE 'n' END,
    sesame = CASE WHEN si.sesame IN ('direct','trace') THEN 'y' ELSE 'n' END,
    salmon = CASE WHEN si.salmon IN ('direct','trace') THEN 'y' ELSE 'n' END,
    mackerel = CASE WHEN si.mackerel IN ('direct','trace') THEN 'y' ELSE 'n' END,
    soybean = CASE WHEN si.soybean IN ('direct','trace') THEN 'y' ELSE 'n' END,
    chicken = CASE WHEN si.chicken IN ('direct','trace') THEN 'y' ELSE 'n' END,
    banana = CASE WHEN si.banana IN ('direct','trace') THEN 'y' ELSE 'n' END,
    pork = CASE WHEN si.pork IN ('direct','trace') THEN 'y' ELSE 'n' END,
    matsutake = CASE WHEN si.matsutake IN ('direct','trace') THEN 'y' ELSE 'n' END,
    peach = CASE WHEN si.peach IN ('direct','trace') THEN 'y' ELSE 'n' END,
    yam = CASE WHEN si.yam IN ('direct','trace') THEN 'y' ELSE 'n' END,
    apple = CASE WHEN si.apple IN ('direct','trace') THEN 'y' ELSE 'n' END,
    macadamia = CASE WHEN si.macadamia IN ('direct','trace') THEN 'y' ELSE 'n' END
  FROM staging_imports si
  JOIN menu_items mi ON si.raw_menu_name = mi.name
  WHERE mi.product_id = p_product_id
    AND si.import_batch_id = p_batch_id
    AND pam.menu_item_id = mi.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- ログ出力（デバッグ用）
  RAISE NOTICE 'upsert_product_allergies_matrix completed: inserted=%, updated=%', v_inserted_count, v_updated_count;

END;
$$ LANGUAGE plpgsql;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION upsert_product_allergies_matrix(INTEGER, UUID) TO anon;
GRANT EXECUTE ON FUNCTION upsert_product_allergies_matrix(INTEGER, UUID) TO authenticated;

-- インデックス最適化（存在しない場合のみ作成）
CREATE INDEX IF NOT EXISTS idx_staging_imports_batch_id ON staging_imports(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_imports_menu_name ON staging_imports(raw_menu_name);
CREATE INDEX IF NOT EXISTS idx_menu_items_product_name ON menu_items(product_id, name);
CREATE INDEX IF NOT EXISTS idx_product_allergies_matrix_menu_item_id ON product_allergies_matrix(menu_item_id);
