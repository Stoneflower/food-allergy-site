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
    favorites
  } = useRestaurant();

  const filteredItems = getFilteredItems();
  const filteredRestaurants = getFilteredRestaurants();
  const recommendations = getRecommendations();

  const getDisplayItems = () => {
    switch (selectedCategory) {
      case 'restaurants':
        return filteredRestaurants.slice(0, 6);
      case 'products':
        return filteredItems.filter(item => item.category === 'products').slice(0, 6);
      case 'supermarkets':
        return filteredItems.filter(item => item.category === 'supermarkets').slice(0, 6);
      case 'online':
        return filteredItems.filter(item => item.category === 'online').slice(0, 6);
      case 'all':
      default:
        return filteredItems.slice(0, 6);
    }
  };

  const displayItems = getDisplayItems();

  const renderCard = (item) => {
    switch (item.category) {
      case 'products':
        return <ProductCard key={item.id} product={item} />;
      case 'restaurants':
      default:
        return <RestaurantCard key={item.id} restaurant={item} />;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayItems.map((item, index) => (
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
                  <span className="text-4xl">🌟</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    みんなが共有した人気情報
                  </h2>
                  <span className="text-4xl">🤝</span>
                </div>
                <p className="text-gray-600">
                  コミュニティのみんなが共有してくれた、安心して利用できる情報をご紹介
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
                    {products.slice(0, 3).map((product, index) => (
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