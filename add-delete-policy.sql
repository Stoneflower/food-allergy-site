-- store_locationsテーブルに削除用のRLSポリシーを追加

-- 削除用のポリシーを作成
CREATE POLICY "del_store_locations" ON store_locations
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- ポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'store_locations'
ORDER BY cmd;
