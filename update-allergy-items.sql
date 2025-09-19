-- アレルギー項目の整合性を取るための更新SQL

-- 1. product_allergies_matrixテーブルにマカダミアナッツカラムを追加（まつたけは既存のまま保持）
-- まず新しいカラムを追加
ALTER TABLE product_allergies_matrix 
ADD COLUMN macadamia CHAR(1) DEFAULT 'n';

-- 2. 既存のmatsutakeカラムはそのまま保持（まつたけ用）
-- 新しく追加したmacadamiaカラムはデフォルトで'n'（マカダミアナッツ用）

-- 3. 含有量表示の正規化（様々な表記をnoneに統一）
-- 空欄をnoneに更新
UPDATE menu_item_allergies 
SET presence_type = 'none' 
WHERE presence_type = '' OR presence_type IS NULL;

-- ハイフン系をnoneに更新
UPDATE menu_item_allergies 
SET presence_type = 'none' 
WHERE presence_type IN ('-', '−', 'ー', '×', 'なし', '無');

-- 含有しない系をnoneに更新
UPDATE menu_item_allergies 
SET presence_type = 'none' 
WHERE presence_type IN ('ふくまない', '含まない', '使用しない', '不使用');

-- 含有する系をdirectに更新
UPDATE menu_item_allergies 
SET presence_type = 'direct' 
WHERE presence_type IN ('ふくむ', '含む', '使用', 'あり', '○', '●');

-- コンタミ系をtraceに更新
UPDATE menu_item_allergies 
SET presence_type = 'trace' 
WHERE presence_type IN ('コンタミ', 'コンタミネーション', '混入の可能性', '△');

-- 未使用系をunusedに更新
UPDATE menu_item_allergies 
SET presence_type = 'unused' 
WHERE presence_type IN ('未使用', '未記載', '記載なし');

-- 4. 確認用クエリ
-- 更新後のアレルギー項目一覧
SELECT DISTINCT allergy_item_slug, COUNT(*) as count
FROM menu_item_allergies 
GROUP BY allergy_item_slug 
ORDER BY allergy_item_slug;

-- 含有量表示の分布
SELECT presence_type, COUNT(*) as count
FROM menu_item_allergies 
GROUP BY presence_type 
ORDER BY presence_type;

-- product_allergies_matrixのカラム確認（まつたけとマカダミアナッツ両方）
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'product_allergies_matrix' 
AND (column_name LIKE '%macadamia%' OR column_name LIKE '%matsutake%')
ORDER BY column_name;

-- 6. matrixにmenu_item_idを導入し、全メニューを1メニュー=1行で表現
-- 6-1) カラム追加（存在しない場合）
ALTER TABLE product_allergies_matrix 
ADD COLUMN IF NOT EXISTS menu_item_id INTEGER;

-- 6-2) 既存行のmenu_item_idをnameとproduct_idで突合して埋める
UPDATE product_allergies_matrix pam
SET menu_item_id = mi.id
FROM menu_items mi
WHERE pam.menu_item_id IS NULL
  AND pam.product_id = mi.product_id
  AND pam.menu_name = mi.name;

-- 6-3) 欠落行を補完（menu_itemsにあるがmatrixに無いものをデフォルト'n'で作成）
INSERT INTO product_allergies_matrix (
  product_id, menu_item_id, menu_name,
  egg,milk,wheat,buckwheat,peanut,shrimp,crab,walnut,almond,abalone,squid,salmon_roe,orange,cashew,kiwi,beef,gelatin,sesame,salmon,mackerel,soybean,chicken,banana,pork,matsutake,peach,yam,apple,macadamia
)
SELECT
  mi.product_id, mi.id, mi.name,
  'n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n','n'
FROM menu_items mi
LEFT JOIN product_allergies_matrix pam ON pam.menu_item_id = mi.id
WHERE pam.menu_item_id IS NULL;

-- 6-4) 同名統合用のユニークインデックスがあれば削除（存在すれば）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = ANY (current_schemas(false))
      AND indexname IN ('ux_pam_product_menu_name','ux_product_menu_name')
  ) THEN
    BEGIN
      EXECUTE 'DROP INDEX IF EXISTS ux_pam_product_menu_name';
      EXECUTE 'DROP INDEX IF EXISTS ux_product_menu_name';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END$$;

-- 6-5) menu_item_idで一意化し、menu_itemsへFKを付与
ALTER TABLE product_allergies_matrix
  ADD CONSTRAINT IF NOT EXISTS fk_pam_menu_item
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pam_menu_item_id 
ON product_allergies_matrix(menu_item_id);
