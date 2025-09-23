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
  small_amount_safe BOOLEAN DEFAULT false, -- 一般的に少量摂取で安全かどうか
  heated_safe BOOLEAN DEFAULT false, -- 一般的に加熱で安全かどうか
  severity_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー（家族）テーブル
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE, -- メールアドレス（会員登録時）
  name VARCHAR(100) NOT NULL, -- ユーザー名
  is_primary_user BOOLEAN DEFAULT false, -- 主ユーザー（家族の代表者）かどうか
  parent_user_id INTEGER REFERENCES users(id), -- 親ユーザーID（子供の場合）
  birth_year INTEGER, -- 生年（子供の年齢計算用）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー別アレルギー設定テーブル
CREATE TABLE IF NOT EXISTS user_allergy_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  allergy_item_id VARCHAR(50) NOT NULL, -- allergy_itemsのitem_id
  is_allergic BOOLEAN DEFAULT true, -- アレルギーがあるかどうか
  small_amount_ok BOOLEAN DEFAULT false, -- 少量なら食べられるかどうか
  heated_ok BOOLEAN DEFAULT false, -- 加熱してあれば食べられるかどうか
  severity_level VARCHAR(20) DEFAULT 'medium', -- 個人の重症度
  notes TEXT, -- ユーザーのメモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, allergy_item_id)
);

-- 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL, -- 商品名
  brand VARCHAR(100), -- ブランド名
  category VARCHAR(50), -- 商品カテゴリ
  description TEXT, -- 商品説明
  image_url VARCHAR(500), -- 商品画像URL（レガシー用）
  image_id VARCHAR(100), -- Cloudflare Imagesの画像ID
  barcode VARCHAR(50), -- バーコード
  heat_status VARCHAR(16), -- 'heated' | 'none' | 'uncertain' | 'unused'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品のアレルギー情報テーブル
CREATE TABLE IF NOT EXISTS product_allergies (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  allergy_item_id VARCHAR(50) NOT NULL, -- allergy_itemsのitem_id
  presence_type VARCHAR(20) NOT NULL, -- 'direct' (直接含有), 'trace' (香料程度), 'heated' (加熱済み), 'processed' (加工済み)
  amount_level VARCHAR(20) DEFAULT 'unknown', -- 'high', 'medium', 'low', 'trace', 'unknown'
  notes TEXT, -- 詳細情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 商品の安全性判定結果テーブル（ユーザー別）
CREATE TABLE IF NOT EXISTS product_safety_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  is_safe BOOLEAN NOT NULL, -- そのユーザーにとって安全かどうか
  warning_level VARCHAR(20) DEFAULT 'none', -- 'none', 'caution', 'warning', 'danger'
  reason TEXT, -- 安全性判定の理由
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
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
('soybean', '大豆', 'Soybean', 'recommended', '🟤', '大豆、豆腐、味噌、醤油など', true, true, 'medium'),
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_parent_user_id ON users(parent_user_id);

CREATE INDEX IF NOT EXISTS idx_user_allergy_settings_user_id ON user_allergy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergy_settings_allergy_item_id ON user_allergy_settings(allergy_item_id);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
-- 重複防止用（CSV UPSERT 対応）
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_name_brand ON products(name, brand);

CREATE INDEX IF NOT EXISTS idx_product_allergies_product_id ON product_allergies(product_id);
CREATE INDEX IF NOT EXISTS idx_product_allergies_allergy_item_id ON product_allergies(allergy_item_id);
CREATE INDEX IF NOT EXISTS idx_product_allergies_presence_type ON product_allergies(presence_type);

CREATE INDEX IF NOT EXISTS idx_product_safety_results_user_id ON product_safety_results(user_id);
CREATE INDEX IF NOT EXISTS idx_product_safety_results_product_id ON product_safety_results(product_id);

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

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_allergy_settings_updated_at 
    BEFORE UPDATE ON user_allergy_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_allergies_updated_at 
    BEFORE UPDATE ON product_allergies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 店舗所在地テーブル（チェーン各店舗の住所/電話/営業時間など）
-- 複数住所対応のためUNIQUE制約を削除
CREATE TABLE IF NOT EXISTS store_locations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
  branch_name VARCHAR(200),
  address TEXT,
  phone VARCHAR(50),
  hours VARCHAR(200),
  source_url TEXT,
  store_list_url TEXT, -- 店舗リストURL（437店舗などの一覧ページ）
  closed VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_locations_product_id ON store_locations(product_id);

-- 店舗住所の重複防止（CSV UPSERT 対応）
CREATE UNIQUE INDEX IF NOT EXISTS ux_store_locations_product_address ON store_locations(product_id, address);

CREATE TRIGGER update_store_locations_updated_at
BEFORE UPDATE ON store_locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CASCADE削除をRESTRICTに変更（既存テーブル用）
-- 注意: このSQLは既存のテーブルに対して実行する必要があります
-- ALTER TABLE store_locations 
-- DROP CONSTRAINT IF EXISTS store_locations_product_id_fkey,
-- ADD CONSTRAINT store_locations_product_id_fkey 
-- FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- メニューの重複防止（CSV UPSERT 対応）
CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_items_product_name ON menu_items(product_id, name);

-- メニュー項目テーブル
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price VARCHAR(50),
  notes TEXT,
  image_id VARCHAR(100), -- Cloudflare Imagesの画像ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メニュー項目のアレルギー情報
CREATE TABLE IF NOT EXISTS menu_item_allergies (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  allergy_item_id VARCHAR(50) NOT NULL,
  presence_type VARCHAR(20) NOT NULL,
  amount_level VARCHAR(20) DEFAULT 'unknown',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_menu_items_product_id ON menu_items(product_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_allergies_menu_item_id ON menu_item_allergies(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_allergies_allergy_item_id ON menu_item_allergies(allergy_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_allergies_presence_type ON menu_item_allergies(presence_type);

-- 更新日時トリガー
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_item_allergies_updated_at
BEFORE UPDATE ON menu_item_allergies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
