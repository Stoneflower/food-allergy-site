-- メニュー名マッチングロジック修正版のupsert_product_allergies_matrix関数

-- 既存の関数を削除
DROP FUNCTION IF EXISTS upsert_product_allergies_matrix(INTEGER, UUID);

-- 修正版関数を作成
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
    'none','none','none','none','none','none','none','none','none',
    'none','none','none','none','none','none','none','none',
    'none','none','none','none','none','none','none','none',
    'none','none','none','none'
  FROM new_menu_items nmi;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- 2. staging_importsからアレルギー情報を反映（名前ベースマッチング）
  -- staging_importsとmenu_itemsの両方で重複処理済みのため、名前で直接マッチング可能
  UPDATE product_allergies_matrix pam
  SET 
    egg = si.egg,
    milk = si.milk,
    wheat = si.wheat,
    buckwheat = si.buckwheat,
    peanut = si.peanut,
    shrimp = si.shrimp,
    crab = si.crab,
    walnut = si.walnut,
    almond = si.almond,
    abalone = si.abalone,
    squid = si.squid,
    salmon_roe = si.salmon_roe,
    orange = si.orange,
    cashew = si.cashew,
    kiwi = si.kiwi,
    beef = si.beef,
    gelatin = si.gelatin,
    sesame = si.sesame,
    salmon = si.salmon,
    mackerel = si.mackerel,
    soybean = si.soybean,
    chicken = si.chicken,
    banana = si.banana,
    pork = si.pork,
    matsutake = si.matsutake,
    peach = si.peach,
    yam = si.yam,
    apple = si.apple,
    macadamia = si.macadamia
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
