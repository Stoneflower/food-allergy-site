-- staging_importsテーブルにmacadamiaカラムを追加

-- 1. staging_importsテーブルの現在の構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'staging_imports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. macadamiaカラムを追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staging_imports' 
        AND column_name = 'macadamia'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE staging_imports ADD COLUMN macadamia CHAR(1) DEFAULT 'n';
        RAISE NOTICE 'macadamiaカラムをstaging_importsテーブルに追加しました';
    ELSE
        RAISE NOTICE 'macadamiaカラムは既に存在します';
    END IF;
END $$;

-- 3. 追加後の構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'staging_imports' 
AND table_schema = 'public'
ORDER BY ordinal_position;
