import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAutoTranslation from '../hooks/useAutoTranslation';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import QRScanner from '../components/QRScanner';
import LocationFinder from '../components/LocationFinder';
import FavoritesSection from '../components/FavoritesSection';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';
import { PREFECTURES } from '../constants/prefectures';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHeart, FiShield, FiStar, FiTrendingUp, FiHelpCircle, FiCamera, FiMapPin, FiUsers, FiShare2 } = FiIcons;

const Home = () => {
  const { t } = useTranslation();
  const { t: autoT } = useAutoTranslation(); // ページ別キャッシュ戦略対応の翻訳フック
  const [isAuthed, setIsAuthed] = useState(false);
  const location = useLocation();
  
  // 使用例: ページ別キャッシュ戦略を適用した翻訳
  // const translatedText = await autoT('home.hero.title', { pageName: 'home' });
  // これにより、Homeページの翻訳は7日間キャッシュされます
  const [showQRScanner, setShowQRScanner] = useState(false);
  const {
    getFilteredItems,
    getFilteredRestaurants,
    selectedAllergies,
    selectedCategory,
    products,
    getRecommendations,
    favorites,
    allItemsData,
    fetchDataFromSupabase,
    isLoading,
    executeSearch,
    setSelectedArea,
    setAreaInputValue
  } = useRestaurant();

  // 認証状態を監視
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(!!data?.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // 初回マウント時にデータを自動取得
  React.useEffect(() => {
    console.log('🏠 Home画面 - 初回データ取得開始');
    console.log('🏠 allItemsData件数:', allItemsData?.length || 0);
    if (!allItemsData || allItemsData.length === 0) {
      console.log('🏠 データが空のため、fetchDataFromSupabaseを実行');
      fetchDataFromSupabase();
    } else {
      console.log('🏠 既にデータがロード済み（', allItemsData.length, '件）');
    }
  }, []); // 空の依存配列で初回のみ実行

  // Upload完了後の遷移時に都道府県で自動検索
  React.useEffect(() => {
    const prefillArea = location.state?.prefillArea;
    if (prefillArea && prefillArea.trim()) {
      console.log('🏠 Upload完了後の遷移を検出 - 自動検索実行');
      console.log('🏠 prefillArea:', prefillArea);
      
      // 都道府県を設定
      setSelectedArea(prefillArea);
      setAreaInputValue(prefillArea);
      
      // 検索を実行（データロード後）
      setTimeout(() => {
        console.log('🏠 自動検索実行:', prefillArea);
        executeSearch({
          areaInputValue: prefillArea,
          selectedArea: prefillArea,
          selectedCategory,
          selectedAllergies,
          searchKeyword: ''
        });
      }, 500); // データ取得を待つ
    }
  }, [location.state?.prefillArea]); // prefillAreaが変わった時のみ実行

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
        return t('home.categoryTitles.restaurants');
      case 'products':
        return t('home.categoryTitles.products');
      case 'supermarkets':
        return t('home.categoryTitles.supermarkets');
      case 'online':
        return t('home.categoryTitles.online');
      case 'all':
      default:
        return selectedAllergies.length > 0 
          ? t('home.categoryTitles.recommendations')
          : t('home.categoryTitles.latest');
    }
  };

  // 共通ヘルパー: ユニーク化＆都道府県名など除外
  const uniqueValidByName = (arr) => {
    const seen = new Set();
    const out = [];
    for (const it of (arr || [])) {
      const key = (it?.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      if (isPrefectureNameItem(it.name)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
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
                  <span className="text-yellow-300 drop-shadow-lg">EATtoo</span>
                </h1>
                <p className="text-2xl md:text-3xl font-medium text-orange-200 drop-shadow-md">
                  {t('common.appTagline')}
                </p>
              </div>
              <span className="text-6xl md:text-8xl">🤝</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">
              {t('home.hero.title')}
            </h2>
            
            <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-4xl mx-auto drop-shadow-md text-white" 
               dangerouslySetInnerHTML={{ __html: t('home.hero.description') }}>
            </p>

            {/* メインアクションボタン */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                to={isAuthed ? "/upload" : "/login"}
                state={isAuthed ? { fromHome: true } : { redirectTo: '/upload', fromHome: true }}
                className="flex items-center justify-center space-x-3 bg-white/95 backdrop-blur-sm text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-lg"
              >
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span>{t('home.hero.takePhotoButton')}</span>
              </Link>
              
              <Link
                to="/search"
                state={{ fromHome: true }}
                className="flex items-center justify-center space-x-3 bg-orange-500/80 backdrop-blur-sm border-2 border-white/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-500/90 transition-all"
              >
                <SafeIcon icon={FiStar} className="w-6 h-6" />
                <span>{t('home.hero.viewInfoButton')}</span>
              </Link>
            </div>

            {/* 特徴 */}
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span className="text-lg font-semibold">{t('home.hero.features.photography')}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiShare2} className="w-6 h-6" />
                <span className="text-lg font-semibold">{t('home.hero.features.sharing')}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <SafeIcon icon={FiUsers} className="w-6 h-6" />
                <span className="text-lg font-semibold">{t('home.features.safeTogether')}</span>
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
              {t('home.stepsSection.title')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('home.stepsSection.description')}
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
              <h3 className="text-xl font-semibold mb-3">{t('home.stepsSection.step1.title')}</h3>
              <p className="text-gray-600">
                {t('home.stepsSection.step1.description')}
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
              <h3 className="text-xl font-semibold mb-3">{t('home.stepsSection.step2.title')}</h3>
              <p className="text-gray-600">
                {t('home.stepsSection.step2.description')}
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
              <h3 className="text-xl font-semibold mb-3">{t('home.stepsSection.step3.title')}</h3>
              <p className="text-gray-600">
                {t('home.stepsSection.step3.description')}
              </p>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/upload"
              state={{ fromHome: true }}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg"
            >
              <SafeIcon icon={FiCamera} className="w-6 h-6" />
              <span>{t('home.stepsSection.uploadButton')}</span>
            </Link>
          </div>

          {/* Membership Benefits (moved under the button) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mt-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.membership.title')}</h2>
            <p className="text-gray-600 text-lg mb-8">{t('home.membership.description')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* 1) アップロード＆アレルギー設定（元: heatStatus） */}
              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">📸</span>
                  <h3 className="text-xl font-semibold text-gray-900">{t('home.membership.heatStatus.title')}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('home.membership.heatStatus.description')}
                </p>
              </div>

              {/* 2) コンタミネーション設定 */}
              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🧪</span>
                  <h3 className="text-xl font-semibold text-gray-900">{t('home.membership.contamination.title')}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('home.membership.contamination.description')}
                </p>
              </div>

              {/* 3) 香料指定 */}
              <div className="bg-gray-50 rounded-xl p-6 border">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🌸</span>
                  <h3 className="text-xl font-semibold text-gray-900">{t('home.membership.fragrance.title')}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('home.membership.fragrance.description')}
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                to="/login"
                state={{ fromHome: true }}
                className="inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow"
              >
                <span>{t('home.membership.registerButton')}</span>
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
                {t('home.searchSection.title')}
              </h2>
              <span className="text-4xl">📱</span>
            </div>
            <p className="text-gray-600">
              {t('home.searchSection.subtitle')}
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
                  <span>{t('home.viewAll')}</span>
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
                    {t('home.noData.title')}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {t('home.noData.description')}
                  </p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    <SafeIcon icon={FiCamera} className="w-5 h-5" />
                    <span>{t('home.noData.shareButton')}</span>
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
              {/* 最近、共有された情報（カテゴリごとに最新1件） */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">{t('home.latestShared')}</h2>
              </div>

              {(() => {
                const all = Array.isArray(allItemsData) ? allItemsData : [];
                // 最新順に並べる
                const sorted = all.slice().sort((a,b) => {
                  const va = (a.related_product?.updated_at || a.updated_at || a.created_at || a.id || 0);
                  const vb = (b.related_product?.updated_at || b.updated_at || b.created_at || b.id || 0);
                  return String(vb).localeCompare(String(va));
                });
                // カテゴリごとに最新1件を選ぶ（重複は名前で排除）
                const seenNames = new Set();
                const pickOne = (arr) => uniqueValidByName(arr).find(it => {
                  const k = (it?.name || '').trim().toLowerCase();
                  if (!k || seenNames.has(k)) return false;
                  seenNames.add(k);
                  return true;
                });
                const latestRestaurant = pickOne(sorted.filter(i => i.category === 'restaurants'));
                const latestSuper = pickOne(sorted
                  .filter(i => i.category === 'products' || i.category === 'supermarkets' || i.category === 'online')
                  .filter(i => Array.isArray(i.category_tokens) && i.category_tokens.includes('supermarkets'))
                );
                const latestTakeout = pickOne(sorted.filter(i => i.category === 'products'));
                const latestOnline = pickOne(sorted
                  .filter(i => i.category === 'products' || i.category === 'supermarkets' || i.category === 'online')
                  .filter(i => Array.isArray(i.category_tokens) && i.category_tokens.includes('online'))
                );

                const blocks = [
                  { key: 'restaurants', title: t('home.categoryTitles.restaurants'), icon: '🍽️', item: latestRestaurant, className: '' },
                  { key: 'products', title: t('home.categoryTitles.products'), icon: '🥡', item: latestTakeout, className: 'hidden sm:block' },
                  { key: 'supermarkets', title: t('home.categoryTitles.supermarkets'), icon: '🏪', item: latestSuper, className: '' },
                  { key: 'online', title: t('home.categoryTitles.online'), icon: '🛒', item: latestOnline, className: 'hidden sm:block' },
                ];

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {blocks.map((b, idx) => (
                      b.item ? (
                        <motion.div
                          key={b.key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className={b.className}
                        >
                          {renderCard(b.item)}
                        </motion.div>
                      ) : null
                    ))}
                  </div>
                );
              })()}
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
              {t('home.community.title')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">2,500+</div>
                <div className="text-orange-100">{t('home.community.sharedProducts')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">1,200+</div>
                <div className="text-orange-100">{t('home.community.activeUsers')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">28品目</div>
                <div className="text-orange-100">{t('home.community.allergies')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">99%</div>
                <div className="text-orange-100">{t('home.community.accuracy')}</div>
              </div>
            </div>

            <div className="mt-12">
              <Link
                to="/upload"
                state={{ fromHome: true }}
                className="inline-flex items-center space-x-3 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <SafeIcon icon={FiCamera} className="w-6 h-6" />
                <span>{t('home.bottomCta.button')}</span>
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