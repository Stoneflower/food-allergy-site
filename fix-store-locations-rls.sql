-- store_locationsテーブルのRLSポリシー修正

-- 1. 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Allow all operations on store_locations" ON store_locations;
DROP POLICY IF EXISTS "Enable read access for all users" ON store_locations;
DROP POLICY IF EXISTS "Enable insert for all users" ON store_locations;
DROP POLICY IF EXISTS "Enable update for all users" ON store_locations;
DROP POLICY IF EXISTS "Enable delete for all users" ON store_locations;

-- 2. RLSを有効化
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;

-- 3. 全操作を許可するポリシーを作成
CREATE POLICY "Allow all operations on store_locations" ON store_locations
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. 権限の確認
SELECT 
    has_table_privilege('anon', 'store_locations', 'SELECT') as can_select,
    has_table_privilege('anon', 'store_locations', 'INSERT') as can_insert,
    has_table_privilege('anon', 'store_locations', 'UPDATE') as can_update,
    has_table_privilege('anon', 'store_locations', 'DELETE') as can_delete;

-- 5. ポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'store_locations';
