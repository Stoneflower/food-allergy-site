-- 現在のstore_locationsの状況確認

-- 1. 総件数確認
SELECT COUNT(*) as total_count FROM store_locations;

-- 2. 都道府県別の件数確認
SELECT 
    address,
    COUNT(*) as count
FROM store_locations 
WHERE address IS NOT NULL AND address != ''
GROUP BY address
ORDER BY address;

-- 3. 鳥取県、島根県の存在確認
SELECT 
    address,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM store_locations 
WHERE address IN ('鳥取県', '島根県')
GROUP BY address;

-- 4. 47都道府県との比較
WITH all_prefectures AS (
    SELECT unnest(ARRAY[
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ]) as prefecture
),
existing_prefectures AS (
    SELECT DISTINCT address as prefecture
    FROM store_locations 
    WHERE address IS NOT NULL AND address != ''
)
SELECT 
    ap.prefecture,
    CASE WHEN ep.prefecture IS NOT NULL THEN '存在' ELSE '欠落' END as status
FROM all_prefectures ap
LEFT JOIN existing_prefectures ep ON ap.prefecture = ep.prefecture
ORDER BY ap.prefecture;
