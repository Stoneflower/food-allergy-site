-- store_locationsテーブルを全削除
DELETE FROM store_locations;

-- 削除後の確認
SELECT COUNT(*) as total_count FROM store_locations;
