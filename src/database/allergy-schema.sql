-- アレルギー28品目テーブル
-- 法定8品目（特定原材料）+ 推奨20品目（特定原材料に準ずるもの）

CREATE TABLE IF NOT EXISTS allergy_items (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(50) UNIQUE NOT NULL, -- 'egg', 'milk', 'wheat' など
  name VARCHAR(100) NOT NULL, -- '卵', '乳', '小麦' など
  name_en VARCHAR(100), -- 'Egg', 'Milk', 'Wheat' など
  category VARCHAR(20) NOT NULL, -- 'mandatory' (法定) または 'recommended' (推奨)
  icon VARCHAR(10), -- 絵文字アイコン
  description TEXT, -- 説明
  small_amount_safe BOOLEAN DEFAULT false, -- 少量摂取で安全かどうか
  heated_safe BOOLEAN DEFAULT false, -- 加熱で安全かどうか
  severity_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 法定8品目（特定原材料）- 表示義務
INSERT INTO allergy_items (item_id, name, name_en, category, icon, description, small_amount_safe, heated_safe, severity_level) VALUES
('egg', '卵', 'Egg', 'mandatory', '🥚', '鶏卵、うずら卵など', false, false, 'high'),
('milk', '乳', 'Milk', 'mandatory', '🥛', '牛乳、乳製品など', false, false, 'high'),
('wheat', '小麦', 'Wheat', 'mandatory', '🌾', '小麦粉、パン、麺類など', false, false, 'high'),
('buckwheat', 'そば', 'Buckwheat', 'mandatory', '🍜', 'そば粉、そば麺など', false, false, 'high'),
('peanut', '落花生', 'Peanut', 'mandatory', '🥜', 'ピーナッツ、ピーナッツバターなど', false, false, 'high'),
('shrimp', 'えび', 'Shrimp', 'mandatory', '🦐', 'エビ、クルマエビ、ブラックタイガーなど', false, false, 'high'),
('crab', 'かに', 'Crab', 'mandatory', '🦀', 'カニ、ズワイガニ、タラバガニなど', false, false, 'high'),
('walnut', 'くるみ', 'Walnut', 'mandatory', '🌰', 'クルミ、ウォルナッツなど', false, false, 'high');

-- 推奨20品目（特定原材料に準ずるもの）- 表示推奨
INSERT INTO allergy_items (item_id, name, name_en, category, icon, description, small_amount_safe, heated_safe, severity_level) VALUES
('almond', 'アーモンド', 'Almond', 'recommended', '🌰', 'アーモンド、アーモンドミルクなど', true, false, 'medium'),
('abalone', 'あわび', 'Abalone', 'recommended', '🐚', 'アワビ、フルーツ貝など', false, false, 'medium'),
('squid', 'いか', 'Squid', 'recommended', '🦑', 'イカ、スルメイカ、ヤリイカなど', false, false, 'medium'),
('salmon_roe', 'いくら', 'Salmon Roe', 'recommended', '🍣', 'イクラ、サケの卵など', false, false, 'medium'),
('orange', 'オレンジ', 'Orange', 'recommended', '🍊', 'オレンジ、オレンジジュースなど', true, true, 'low'),
('cashew', 'カシューナッツ', 'Cashew', 'recommended', '🌰', 'カシューナッツ、カシューバターなど', true, false, 'medium'),
('kiwi', 'キウイフルーツ', 'Kiwi', 'recommended', '🥝', 'キウイフルーツ、キウイジュースなど', true, true, 'low'),
('beef', '牛肉', 'Beef', 'recommended', '🥩', '牛肉、ビーフジャーキーなど', false, false, 'medium'),
('walnut_other', 'くるみ', 'Walnut (Other)', 'recommended', '🌰', 'クルミ以外のナッツ類', true, false, 'medium'),
('gelatin', 'ゼラチン', 'Gelatin', 'recommended', '🍮', 'ゼラチン、コラーゲンなど', false, true, 'low'),
('salmon', 'さけ', 'Salmon', 'recommended', '🐟', 'サケ、サーモンなど', false, false, 'medium'),
('mackerel', 'さば', 'Mackerel', 'recommended', '🐟', 'サバ、サバの味噌煮など', false, false, 'medium'),
('soybean', '大豆', 'Soybean', 'recommended', '🫘', '大豆、豆腐、味噌、醤油など', true, true, 'medium'),
('chicken', '鶏肉', 'Chicken', 'recommended', '🍗', '鶏肉、チキンなど', false, false, 'medium'),
('banana', 'バナナ', 'Banana', 'recommended', '🍌', 'バナナ、バナナジュースなど', true, true, 'low'),
('pork', '豚肉', 'Pork', 'recommended', '🥓', '豚肉、ハム、ベーコンなど', false, false, 'medium'),
('matsutake', 'まつたけ', 'Matsutake', 'recommended', '🍄', 'マツタケ、松茸など', false, false, 'medium'),
('peach', 'もも', 'Peach', 'recommended', '🍑', 'モモ、桃ジュースなど', true, true, 'low'),
('yam', 'やまいも', 'Yam', 'recommended', '🍠', 'ヤマイモ、長芋、自然薯など', false, false, 'medium'),
('apple', 'りんご', 'Apple', 'recommended', '🍎', 'リンゴ、リンゴジュースなど', true, true, 'low');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_allergy_items_item_id ON allergy_items(item_id);
CREATE INDEX IF NOT EXISTS idx_allergy_items_category ON allergy_items(category);
CREATE INDEX IF NOT EXISTS idx_allergy_items_severity ON allergy_items(severity_level);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_allergy_items_updated_at 
    BEFORE UPDATE ON allergy_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
