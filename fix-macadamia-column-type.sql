-- macadamiaカラムの型をcharacter(1)からtextに変更

-- 1. 現在のmacadamiaカラムの型を確認
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'staging_imports' 
AND column_name = 'macadamia'
AND table_schema = 'public';

-- 2. macadamiaカラムの型をtextに変更
ALTER TABLE staging_imports 
ALTER COLUMN macadamia TYPE text;

-- 3. 変更後の型を確認
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'staging_imports' 
AND column_name = 'macadamia'
AND table_schema = 'public';

-- 4. 他のアレルギー項目の型も確認（参考）
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'staging_imports' 
AND column_name IN ('egg', 'milk', 'wheat', 'matsutake')
AND table_schema = 'public'
ORDER BY column_name;
