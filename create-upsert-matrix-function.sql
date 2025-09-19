-- product_allergies_matrixを自動更新する関数を作成

CREATE OR REPLACE FUNCTION upsert_product_allergies_matrix(
  p_product_id INTEGER,
  p_batch_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- 1. 全メニュー分を既定値で補完（存在しない行のみ）
  INSERT INTO product_allergies_matrix (
    product_id, menu_item_id, menu_name,
    egg, milk, wheat, buckwheat, peanut, shrimp, crab, walnut, almond,
    abalone, squid, salmon_roe, orange, cashew, kiwi, beef, gelatin,
    sesame, salmon, mackerel, soybean, chicken, banana, pork, matsutake,
    peach, yam, apple, macadamia
  )
  SELECT
    mi.product_id, mi.id, mi.name,
    'n','n','n','n','n','n','n','n','n',
    'n','n','n','n','n','n','n','n',
    'n','n','n','n','n','n','n','n',
    'n','n','n','n'
  FROM menu_items mi
  LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
  WHERE mi.product_id = p_product_id
    AND pam.menu_item_id IS NULL;

  -- 2. staging_importsからアレルギー情報を反映
  WITH latest_batch AS (
    SELECT p_batch_id AS import_batch_id
  ),
  matched AS (
    SELECT
      mi.id AS menu_item_id,
      CASE WHEN si.egg IN ('direct','trace') THEN 'y' ELSE 'n' END AS egg_val,
      CASE WHEN si.milk IN ('direct','trace') THEN 'y' ELSE 'n' END AS milk_val,
      CASE WHEN si.wheat IN ('direct','trace') THEN 'y' ELSE 'n' END AS wheat_val,
      CASE WHEN si.buckwheat IN ('direct','trace') THEN 'y' ELSE 'n' END AS buckwheat_val,
      CASE WHEN si.peanut IN ('direct','trace') THEN 'y' ELSE 'n' END AS peanut_val,
      CASE WHEN si.shrimp IN ('direct','trace') THEN 'y' ELSE 'n' END AS shrimp_val,
      CASE WHEN si.crab IN ('direct','trace') THEN 'y' ELSE 'n' END AS crab_val,
      CASE WHEN si.walnut IN ('direct','trace') THEN 'y' ELSE 'n' END AS walnut_val,
      CASE WHEN si.almond IN ('direct','trace') THEN 'y' ELSE 'n' END AS almond_val,
      CASE WHEN si.abalone IN ('direct','trace') THEN 'y' ELSE 'n' END AS abalone_val,
      CASE WHEN si.squid IN ('direct','trace') THEN 'y' ELSE 'n' END AS squid_val,
      CASE WHEN si.salmon_roe IN ('direct','trace') THEN 'y' ELSE 'n' END AS salmon_roe_val,
      CASE WHEN si.orange IN ('direct','trace') THEN 'y' ELSE 'n' END AS orange_val,
      CASE WHEN si.cashew IN ('direct','trace') THEN 'y' ELSE 'n' END AS cashew_val,
      CASE WHEN si.kiwi IN ('direct','trace') THEN 'y' ELSE 'n' END AS kiwi_val,
      CASE WHEN si.beef IN ('direct','trace') THEN 'y' ELSE 'n' END AS beef_val,
      CASE WHEN si.gelatin IN ('direct','trace') THEN 'y' ELSE 'n' END AS gelatin_val,
      CASE WHEN si.sesame IN ('direct','trace') THEN 'y' ELSE 'n' END AS sesame_val,
      CASE WHEN si.salmon IN ('direct','trace') THEN 'y' ELSE 'n' END AS salmon_val,
      CASE WHEN si.mackerel IN ('direct','trace') THEN 'y' ELSE 'n' END AS mackerel_val,
      CASE WHEN si.soybean IN ('direct','trace') THEN 'y' ELSE 'n' END AS soybean_val,
      CASE WHEN si.chicken IN ('direct','trace') THEN 'y' ELSE 'n' END AS chicken_val,
      CASE WHEN si.banana IN ('direct','trace') THEN 'y' ELSE 'n' END AS banana_val,
      CASE WHEN si.pork IN ('direct','trace') THEN 'y' ELSE 'n' END AS pork_val,
      CASE WHEN si.matsutake IN ('direct','trace') THEN 'y' ELSE 'n' END AS matsutake_val,
      CASE WHEN si.peach IN ('direct','trace') THEN 'y' ELSE 'n' END AS peach_val,
      CASE WHEN si.yam IN ('direct','trace') THEN 'y' ELSE 'n' END AS yam_val,
      CASE WHEN si.apple IN ('direct','trace') THEN 'y' ELSE 'n' END AS apple_val,
      CASE WHEN si.macadamia IN ('direct','trace') THEN 'y' ELSE 'n' END AS macadamia_val
    FROM staging_imports si
    JOIN latest_batch lb ON si.import_batch_id = lb.import_batch_id
    JOIN menu_items mi
      ON si.raw_menu_name = mi.name
    WHERE mi.product_id = p_product_id
  )
  UPDATE product_allergies_matrix pam
  SET 
    egg = matched.egg_val,
    milk = matched.milk_val,
    wheat = matched.wheat_val,
    buckwheat = matched.buckwheat_val,
    peanut = matched.peanut_val,
    shrimp = matched.shrimp_val,
    crab = matched.crab_val,
    walnut = matched.walnut_val,
    almond = matched.almond_val,
    abalone = matched.abalone_val,
    squid = matched.squid_val,
    salmon_roe = matched.salmon_roe_val,
    orange = matched.orange_val,
    cashew = matched.cashew_val,
    kiwi = matched.kiwi_val,
    beef = matched.beef_val,
    gelatin = matched.gelatin_val,
    sesame = matched.sesame_val,
    salmon = matched.salmon_val,
    mackerel = matched.mackerel_val,
    soybean = matched.soybean_val,
    chicken = matched.chicken_val,
    banana = matched.banana_val,
    pork = matched.pork_val,
    matsutake = matched.matsutake_val,
    peach = matched.peach_val,
    yam = matched.yam_val,
    apple = matched.apple_val,
    macadamia = matched.macadamia_val
  FROM matched
  WHERE pam.menu_item_id = matched.menu_item_id;

END;
$$ LANGUAGE plpgsql;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION upsert_product_allergies_matrix(INTEGER, UUID) TO anon;
GRANT EXECUTE ON FUNCTION upsert_product_allergies_matrix(INTEGER, UUID) TO authenticated;
