import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import QRScanner from '../components/QRScanner';
import LocationFinder from '../components/LocationFinder';
import FavoritesSection from '../components/FavoritesSection';
import { useRestaurant } from '../context/RestaurantContext';
import { PREFECTURES } from '../constants/prefectures';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHeart, FiShield, FiStar, FiTrendingUp, FiHelpCircle, FiCamera, FiMapPin, FiUsers, FiShare2 } = FiIcons;

const Home = () => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const {
    getFilteredItems,
    getFilteredRestaurants,
    selectedAllergies,
    selectedCategory,
    products,
    getRecommendations,
    favorites,
    allItemsData
  } = useRestaurant();

  const filteredItems = getFilteredItems();
  const filteredRestaurants = getFilteredRestaurants();
  const recommendations = getRecommendations();

  // このセクションに限り、エリア未入力でも表示できるように、allItemsDataから最新を抽出
  const isPrefectureNameItem = (name) => {
    if (!name) return false;
    if (name === 'すべて') return true;
    return PREFECTURES.some(pref => name === pref || name.startsWith(pref + '(') || name === pref + ' ');
  };

  const getLatestDisplayItems = () => {
    let items = Array.isArray(allItemsData) ? allItemsData : [];
    switch (selectedCategory) {
      case 'restaurants':
        items = items
          .filter(item => item.category === 'restaurants')
          // 都道府県名などの総称行は除外し、店舗名のみ表示
          .filter(item => !isPrefectureNameItem(item.name));
        break;
      case 'products':
        items = items.filter(item => item.category === 'products');
        break;
      case 'supermarkets':
        items = items
          .filter(item => item.category === 'products' || item.category === 'supermarkets' || item.category === 'online')
          .filter(item => Array.isArray(item.category_tokens) && item.category_tokens.includes('supermarkets'));
        break;
      case 'online':
        items = items
          .filter(item => item.category === 'products' || item.category === 'supermarkets' || item.category === 'online')
          .filter(item => Array.isArray(item.category_tokens) && item.category_tokens.includes('online'));
        break;
      case 'all':
      default:
        // 全件はトップのおすすめで扱うため、ここでは空配列
        items = [];
    }
    // 簡易的に新しい順: updated_at/created_at/related_product.updated_at/ID を優先
    items = items.slice().sort((a,b) => {
      const va = (a.related_product?.updated_at || a.updated_at || a.created_at || a.id || 0);
      const vb = (b.related_product?.updated_at || b.updated_at || b.created_at || b.id || 0);
      return String(vb).localeCompare(String(va));
    });
    // 店舗名・会社名の重複を除外（最初に出たものを採用）
    const seen = new Set();
    const unique = [];
    for (const it of items) {
      const key = (it.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(it);
      if (unique.length >= 8) break; // 保険: 重複除外後の候補を十分確保
    }
    // ここで最大4件に絞る（小画面では後で2件まで表示）
    return unique.slice(0, 4);
  };

  const displayItems = getLatestDisplayItems();

  const renderCard = (item) => {
    const pickFallbackImage = (name, current, related) => {
      if (current && String(current).trim()) return current;
      const texts = [
        String(name || ''),
        String(related?.name || ''),
        String(related?.product_title || ''),
        String(related?.brand || ''),
      ].join(' ').toLowerCase();
      if (texts.includes('びっくりドンキー')) return 'https://stoneflower.net/uploads/hamburger.jpg';
      if (texts.includes('スシロー') || texts.includes('すしろー') || texts.includes('sushiro')) return 'https://stoneflower.net/uploads/sushi.jpg';
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=70&auto=format';
    };

    switch (item.category) {
      case 'products':
        return <ProductCard key={item.id} product={{
          ...item,
          image: pickFallbackImage(item.name, item.image, item.related_product)
        }} />;
      case 'restaurants':
      default:
        return <RestaurantCard key={item.id} restaurant={{
          ...item,
          image: pickFallbackImage(item.name, item.image, item.related_product)
        }} />;
    }
  };

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'restaurants':
        return 'みんなが共有したレストラン情報';
      case 'products':
        return 'みんなが共有した商品情報';
      case 'supermarkets':
        return 'アレルギー対応商品が豊富なスーパー';
      case 'online':
        return 'アレルギー対応商品のオンラインショップ';
      case 'all':
      default:
        return selectedAllergies.length > 0 
          ? 'あなたが安心して利用できる情報' 
          : 'みんなが共有した最新情報';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative text-white py-20 overflow-hidden">
        <div className="absolute inset-0">
          {/* PC版画像 */}
          <img
            src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1757725662677-pc_top.jpg"
            alt="食品共有のイメージ"
            className="w-full h-full object-cover hidden md:block"
          />
          {/* スマホ版画像 */}
          <img
            src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1757725666261-smartphone_top.jpg"
            alt="食品共有のイメージ"
            className="w-full h-full object-cover md:hidden"
          />
          {/* 軽いオーバーレイに変更 */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/40 to-red-900/30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-4 mb-6">
              <span className="text-6xl md:text-8xl">📸</span>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold mb-2">
                  <span className="text-yellow-300 drop-shadow-lg">CanIEatOo?</span>
                </h1>
                <p className="text-2xl md:text-3xl font-medium text-orange-200 drop-shadow-md">
                  みんなで共有
                </p>
              </div>
              <span className="text-6xl md:text-8xl">🤝</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">
              食べられるものをみんなで簡単共有
            </h2>
            
            <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-4xl mx-auto drop-shadow-md text-white">
              商品の成分表示を撮影するだけ！<br />
              アレルギー情報をかんたんに共有して、<br />
              みんなで安心できる食生活を築きましょう
            </p>

            {/* メインアクションボタン */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                to="/upload"
                className="flex items-center justify-center space-x-3 bg-white/95 backdrop-blur-sm text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-lg"
              >
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span>商品を撮影して共有</span>
              </Link>
              
              <Link
                to="/search"
                className="flex items-center justify-center space-x-3 bg-orange-500/80 backdrop-blur-sm border-2 border-white/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-500/90 transition-all"
              >
                <SafeIcon icon={FiStar} className="w-6 h-6" />
                <span>共有された情報を見る</span>
              </Link>
            </div>

            {/* 特徴 */}
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span className="text-lg font-semibold">撮影するだけ</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiShare2} className="w-6 h-6" />
                <span className="text-lg font-semibold">かんたん共有</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiUsers} className="w-6 h-6" />
                <span className="text-lg font-semibold">みんなで安心</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              たった3ステップで情報共有
            </h2>
            <p className="text-gray-600 text-lg">
              商品の成分表示を撮影するだけで、アレルギー情報をみんなと共有できます
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon icon={FiCamera} className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. 撮影</h3>
              <p className="text-gray-600">
                商品パッケージの成分表示部分をスマホで撮影するだけ
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon icon={FiShield} className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. 確認</h3>
              <p className="text-gray-600">
                AIが成分を解析。アレルギー情報を確認・修正できます
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SafeIcon icon={FiShare2} className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. 共有</h3>
              <p className="text-gray-600">
                情報が共有され、同じアレルギーの方に役立ちます
              </p>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg"
            >
              <SafeIcon icon={FiCamera} className="w-6 h-6" />
              <span>今すぐ商品を共有する</span>
            </Link>
          </div>

          {/* Membership Benefits (moved under the button) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">会員登録のメリット</h2>
            <p className="text-gray-600 text-lg mb-8">あなたに合わせた詳細設定で、もっと安心・便利に。</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🧪</span>
                  <h3 className="text-xl font-semibold text-gray-900">コンタミネーション設定</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  混入の可能性（trace）を個別に管理。微量NGなどの判断に役立ちます。
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🌸</span>
                  <h3 className="text-xl font-semibold text-gray-900">香料に含むを個別指定</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  香料由来のアレルゲンをアイコンから簡単選択。未指定なら自動で none として扱います。
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-xl font-semibold text-gray-900">加熱ステータスの詳細設定</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  heated / none / uncertain / unused を商品単位で設定できます。
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                to="/login"
                className="inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow"
              >
                <span>無料で会員登録する</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-6">
              <span className="text-4xl">🔍</span>
              <h2 className="text-3xl font-bold text-gray-900">
                共有された情報を探す
              </h2>
              <span className="text-4xl">📱</span>
            </div>
            <p className="text-gray-600">
              みんなが共有した商品やレストランの情報から安心できるものを見つけよう
            </p>
          </motion.div>
          <CategoryFilter />
        </div>
      </section>

      {/* Results Section */}
      {(selectedAllergies.length > 0 || selectedCategory !== 'all') && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">✅</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {getCategoryTitle()}
                  </h2>
                </div>
                <Link
                  to="/search"
                  className="text-orange-500 hover:text-orange-600 font-semibold flex items-center space-x-1"
                >
                  <span>すべて見る</span>
                  <SafeIcon icon={FiTrendingUp} className="w-4 h-4" />
                </Link>
              </div>
              
              {displayItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayItems
                    .slice(0, 4) // PC最大4件
                    .map((item, index) => (
                    <motion.div
                      key={`${item.category}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      {renderCard(item)}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <SafeIcon icon={FiShield} className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    条件に合う情報が見つかりませんでした
                  </h3>
                  <p className="text-gray-600 mb-4">
                    アレルギー条件やカテゴリーを調整するか、新しい商品情報を共有してみませんか？
                  </p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    <SafeIcon icon={FiCamera} className="w-5 h-5" />
                    <span>商品情報を共有する</span>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Popular Items (when no specific selection) */}
      {selectedAllergies.length === 0 && selectedCategory === 'all' && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <span className="text-4xl">📦</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    最近登録した商品
                  </h2>
                  <span className="text-4xl">🆕</span>
                </div>
                <p className="text-gray-600">
                  直近に共有された商品をピックアップしてご紹介します
                </p>
              </div>
              
              <div className="space-y-12">
                {/* 商品 */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span>📦</span>
                    <span>最近共有された商品</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(products || []).slice(0, 3).map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* レストラン */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <span>🍽️</span>
                    <span>おすすめレストラン</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.slice(0, 2).map((restaurant, index) => (
                      <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <RestaurantCard restaurant={restaurant} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Community Stats */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-12">
              みんなで作るアレルギー情報コミュニティ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">2,500+</div>
                <div className="text-orange-100">共有された商品</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">1,200+</div>
                <div className="text-orange-100">アクティブユーザー</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">28品目</div>
                <div className="text-orange-100">対応アレルギー</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">99%</div>
                <div className="text-orange-100">情報の正確性</div>
              </div>
            </div>

            <div className="mt-12">
              <Link
                to="/upload"
                className="inline-flex items-center space-x-3 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span>あなたも情報を共有してみませんか？</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Favorites Section */}
      {favorites.length > 0 && <FavoritesSection />}

      {/* QR Scanner Modal */}
      {showQRScanner && <QRScanner onClose={() => setShowQRScanner(false)} />}
    </div>
  );
};

export default Home;