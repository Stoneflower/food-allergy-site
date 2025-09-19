-- product_allergies_matrixテーブルのカラム型を'direct'/'trace'/'none'対応に変更

-- 各アレルギーカラムをCHAR(1)からTEXTに変更
ALTER TABLE product_allergies_matrix 
ALTER COLUMN egg TYPE text,
ALTER COLUMN milk TYPE text,
ALTER COLUMN wheat TYPE text,
ALTER COLUMN buckwheat TYPE text,
ALTER COLUMN peanut TYPE text,
ALTER COLUMN shrimp TYPE text,
ALTER COLUMN crab TYPE text,
ALTER COLUMN walnut TYPE text,
ALTER COLUMN almond TYPE text,
ALTER COLUMN abalone TYPE text,
ALTER COLUMN squid TYPE text,
ALTER COLUMN salmon_roe TYPE text,
ALTER COLUMN orange TYPE text,
ALTER COLUMN cashew TYPE text,
ALTER COLUMN kiwi TYPE text,
ALTER COLUMN beef TYPE text,
ALTER COLUMN gelatin TYPE text,
ALTER COLUMN sesame TYPE text,
ALTER COLUMN salmon TYPE text,
ALTER COLUMN mackerel TYPE text,
ALTER COLUMN soybean TYPE text,
ALTER COLUMN chicken TYPE text,
ALTER COLUMN banana TYPE text,
ALTER COLUMN pork TYPE text,
ALTER COLUMN matsutake TYPE text,
ALTER COLUMN peach TYPE text,
ALTER COLUMN yam TYPE text,
ALTER COLUMN apple TYPE text,
ALTER COLUMN macadamia TYPE text;

-- 既存データの変換（'d' → 'direct', 't' → 'trace', 'n' → 'none'）
UPDATE product_allergies_matrix SET
  egg = CASE 
    WHEN egg = 'd' THEN 'direct'
    WHEN egg = 't' THEN 'trace'
    WHEN egg = 'n' THEN 'none'
    ELSE egg
  END,
  milk = CASE 
    WHEN milk = 'd' THEN 'direct'
    WHEN milk = 't' THEN 'trace'
    WHEN milk = 'n' THEN 'none'
    ELSE milk
  END,
  wheat = CASE 
    WHEN wheat = 'd' THEN 'direct'
    WHEN wheat = 't' THEN 'trace'
    WHEN wheat = 'n' THEN 'none'
    ELSE wheat
  END,
  buckwheat = CASE 
    WHEN buckwheat = 'd' THEN 'direct'
    WHEN buckwheat = 't' THEN 'trace'
    WHEN buckwheat = 'n' THEN 'none'
    ELSE buckwheat
  END,
  peanut = CASE 
    WHEN peanut = 'd' THEN 'direct'
    WHEN peanut = 't' THEN 'trace'
    WHEN peanut = 'n' THEN 'none'
    ELSE peanut
  END,
  shrimp = CASE 
    WHEN shrimp = 'd' THEN 'direct'
    WHEN shrimp = 't' THEN 'trace'
    WHEN shrimp = 'n' THEN 'none'
    ELSE shrimp
  END,
  crab = CASE 
    WHEN crab = 'd' THEN 'direct'
    WHEN crab = 't' THEN 'trace'
    WHEN crab = 'n' THEN 'none'
    ELSE crab
  END,
  walnut = CASE 
    WHEN walnut = 'd' THEN 'direct'
    WHEN walnut = 't' THEN 'trace'
    WHEN walnut = 'n' THEN 'none'
    ELSE walnut
  END,
  almond = CASE 
    WHEN almond = 'd' THEN 'direct'
    WHEN almond = 't' THEN 'trace'
    WHEN almond = 'n' THEN 'none'
    ELSE almond
  END,
  abalone = CASE 
    WHEN abalone = 'd' THEN 'direct'
    WHEN abalone = 't' THEN 'trace'
    WHEN abalone = 'n' THEN 'none'
    ELSE abalone
  END,
  squid = CASE 
    WHEN squid = 'd' THEN 'direct'
    WHEN squid = 't' THEN 'trace'
    WHEN squid = 'n' THEN 'none'
    ELSE squid
  END,
  salmon_roe = CASE 
    WHEN salmon_roe = 'd' THEN 'direct'
    WHEN salmon_roe = 't' THEN 'trace'
    WHEN salmon_roe = 'n' THEN 'none'
    ELSE salmon_roe
  END,
  orange = CASE 
    WHEN orange = 'd' THEN 'direct'
    WHEN orange = 't' THEN 'trace'
    WHEN orange = 'n' THEN 'none'
    ELSE orange
  END,
  cashew = CASE 
    WHEN cashew = 'd' THEN 'direct'
    WHEN cashew = 't' THEN 'trace'
    WHEN cashew = 'n' THEN 'none'
    ELSE cashew
  END,
  kiwi = CASE 
    WHEN kiwi = 'd' THEN 'direct'
    WHEN kiwi = 't' THEN 'trace'
    WHEN kiwi = 'n' THEN 'none'
    ELSE kiwi
  END,
  beef = CASE 
    WHEN beef = 'd' THEN 'direct'
    WHEN beef = 't' THEN 'trace'
    WHEN beef = 'n' THEN 'none'
    ELSE beef
  END,
  gelatin = CASE 
    WHEN gelatin = 'd' THEN 'direct'
    WHEN gelatin = 't' THEN 'trace'
    WHEN gelatin = 'n' THEN 'none'
    ELSE gelatin
  END,
  sesame = CASE 
    WHEN sesame = 'd' THEN 'direct'
    WHEN sesame = 't' THEN 'trace'
    WHEN sesame = 'n' THEN 'none'
    ELSE sesame
  END,
  salmon = CASE 
    WHEN salmon = 'd' THEN 'direct'
    WHEN salmon = 't' THEN 'trace'
    WHEN salmon = 'n' THEN 'none'
    ELSE salmon
  END,
  mackerel = CASE 
    WHEN mackerel = 'd' THEN 'direct'
    WHEN mackerel = 't' THEN 'trace'
    WHEN mackerel = 'n' THEN 'none'
    ELSE mackerel
  END,
  soybean = CASE 
    WHEN soybean = 'd' THEN 'direct'
    WHEN soybean = 't' THEN 'trace'
    WHEN soybean = 'n' THEN 'none'
    ELSE soybean
  END,
  chicken = CASE 
    WHEN chicken = 'd' THEN 'direct'
    WHEN chicken = 't' THEN 'trace'
    WHEN chicken = 'n' THEN 'none'
    ELSE chicken
  END,
  banana = CASE 
    WHEN banana = 'd' THEN 'direct'
    WHEN banana = 't' THEN 'trace'
    WHEN banana = 'n' THEN 'none'
    ELSE banana
  END,
  pork = CASE 
    WHEN pork = 'd' THEN 'direct'
    WHEN pork = 't' THEN 'trace'
    WHEN pork = 'n' THEN 'none'
    ELSE pork
  END,
  matsutake = CASE 
    WHEN matsutake = 'd' THEN 'direct'
    WHEN matsutake = 't' THEN 'trace'
    WHEN matsutake = 'n' THEN 'none'
    ELSE matsutake
  END,
  peach = CASE 
    WHEN peach = 'd' THEN 'direct'
    WHEN peach = 't' THEN 'trace'
    WHEN peach = 'n' THEN 'none'
    ELSE peach
  END,
  yam = CASE 
    WHEN yam = 'd' THEN 'direct'
    WHEN yam = 't' THEN 'trace'
    WHEN yam = 'n' THEN 'none'
    ELSE yam
  END,
  apple = CASE 
    WHEN apple = 'd' THEN 'direct'
    WHEN apple = 't' THEN 'trace'
    WHEN apple = 'n' THEN 'none'
    ELSE apple
  END,
  macadamia = CASE 
    WHEN macadamia = 'd' THEN 'direct'
    WHEN macadamia = 't' THEN 'trace'
    WHEN macadamia = 'n' THEN 'none'
    ELSE macadamia
  END;
