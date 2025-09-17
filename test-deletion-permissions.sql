-- 削除処理の権限テスト

-- 1. 現在のRLS設定確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'store_locations';

-- 2. store_locationsテーブルのポリシー確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'store_locations';

-- 3. 削除前の状態確認
SELECT 
    id,
    address,
    product_id,
    created_at
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
ORDER BY address, created_at;

-- 4. 削除処理のテスト（実際には実行しない）
-- DELETE FROM store_locations WHERE address IN ('鳥取県', '島根県');

-- 5. 権限確認用のクエリ
SELECT 
    has_table_privilege('anon', 'store_locations', 'SELECT') as can_select,
    has_table_privilege('anon', 'store_locations', 'INSERT') as can_insert,
    has_table_privilege('anon', 'store_locations', 'UPDATE') as can_update,
    has_table_privilege('anon', 'store_locations', 'DELETE') as can_delete;

-- 6. 現在のユーザーとロール確認
SELECT current_user, current_role, session_user;

-- 7. テーブルの所有者確認
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'store_locations';
