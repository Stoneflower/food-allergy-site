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
