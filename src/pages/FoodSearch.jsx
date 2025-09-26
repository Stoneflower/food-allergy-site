import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import FoodCard from '../components/FoodCard';
import UserSettingsPanel from '../components/UserSettingsPanel';
import AllergyLegend from '../components/AllergyLegend';
import AdvancedSearchPanel from '../components/AdvancedSearchPanel';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiGrid, FiList, FiMapPin, FiSettings } = FiIcons;

const FoodSearch = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState({
    allowTrace: false,
    allowHeated: true,
    severityLevel: 'medium',
    childMode: true
  });
  
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    brand: '',
    category: 'all',
    containsAllergens: [],
    excludeAllergens: [],
    priceRange: 'all',
    safetyLevel: 'all'
  });

  // サンプル食品データ（より多くのデータを追加）
  const sampleFoods = [
    {
      id: 'f1',
      name: 'グルテンフリー米粉パン',
      brand: 'アレルギー対応パン工房',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
      price: '¥480',
      rating: 4.6,
      category: 'bread',
      lastUpdated: '2024年1月20日',
      allergens: [
        { allergen_name: '卵', amount_category: '微量', source: '製造設備', heat_sensitive: false },
        { allergen_name: '乳', amount_category: '微量', source: '製造設備', heat_sensitive: true }
      ]
    },
    {
      id: 'f2',
      name: 'オーガニック豆乳ヨーグルト',
      brand: 'ナチュラル食品',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      price: '¥298',
      rating: 4.3,
      category: 'dairy',
      lastUpdated: '2024年1月18日',
      allergens: [
        { allergen_name: '大豆(soybean)', amount_category: '含有', source: '原材料', heat_sensitive: false }
      ]
    },
    {
      id: 'f3',
      name: '無添加クッキー',
      brand: 'ヘルシースナック',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
      price: '¥380',
      rating: 4.8,
      category: 'snacks',
      lastUpdated: '2024年1月15日',
      allergens: [
        { allergen_name: '小麦', amount_category: '少量', source: '原材料', heat_sensitive: true },
        { allergen_name: 'ナッツ', amount_category: '微量', source: '製造設備', heat_sensitive: false }
      ]
    },
    {
      id: 'f4',
      name: 'アレルギー対応カレー',
      brand: 'やさしい食品',
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
      price: '¥650',
      rating: 4.4,
      category: 'all',
      lastUpdated: '2024年1月22日',
      allergens: []
    },
    {
      id: 'f5',
      name: 'フルーツジュース100%',
      brand: 'ピュアドリンク',
      image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
      price: '¥180',
      rating: 4.2,
      category: 'drinks',
      lastUpdated: '2024年1月19日',
      allergens: []
    },
    {
      id: 'f6',
      name: '卵不使用マヨネーズ',
      brand: 'エッグフリー食品',
      image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
      price: '¥420',
      rating: 4.1,
      category: 'all',
      lastUpdated: '2024年1月16日',
      allergens: [
        { allergen_name: '大豆(soybean)', amount_category: '微量', source: '原材料', heat_sensitive: false }
      ]
    },
    {
      id: 'f7',
      name: '小麦粉不使用パスタ',
      brand: 'グルテンフリー工房',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d30e?w=400',
      price: '¥520',
      rating: 4.5,
      category: 'all',
      lastUpdated: '2024年1月21日',
      allergens: [
        { allergen_name: '卵', amount_category: '含有', source: '原材料', heat_sensitive: false }
      ]
    },
    {
      id: 'f8',
      name: 'オーガニックアーモンドミルク',
      brand: 'ナチュラル食品',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
      price: '¥350',
      rating: 4.0,
      category: 'drinks',
      lastUpdated: '2024年1月17日',
      allergens: [
        { allergen_name: 'ナッツ', amount_category: '含有', source: '原材料', heat_sensitive: false }
      ]
    }
  ];

  // アレルギー名のマッピング
  const allergenMapping = {
    egg: '卵',
    milk: '乳',
    wheat: '小麦',
    soy: '大豆(soybean)',
    nuts: 'ナッツ',
    seafood: '魚介',
    sesame: 'ごま',
    buckwheat: 'そば',
    peanut: '落花生',
    shrimp: 'えび',
    crab: 'かに',
    walnut: 'くるみ'
  };

  // フィルタリングロジック
  const filteredFoods = useMemo(() => {
    let result = [...sampleFoods];

    // キーワード検索
    if (searchFilters.keyword) {
      result = result.filter(food =>
        food.name.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
        food.brand.toLowerCase().includes(searchFilters.keyword.toLowerCase())
      );
    }

    // ブランド検索
    if (searchFilters.brand) {
      result = result.filter(food =>
        food.brand.toLowerCase().includes(searchFilters.brand.toLowerCase())
      );
    }

    // カテゴリーフィルター
    if (searchFilters.category && searchFilters.category !== 'all') {
      result = result.filter(food => food.category === searchFilters.category);
    }

    // 含まれるアレルギー成分で検索
    if (searchFilters.containsAllergens && searchFilters.containsAllergens.length > 0) {
      result = result.filter(food => {
        if (!food.allergens || food.allergens.length === 0) return false;
        return searchFilters.containsAllergens.some(allergenId => {
          const allergenName = allergenMapping[allergenId];
          return food.allergens.some(allergen => 
            allergen.allergen_name === allergenName
          );
        });
      });
    }

    // アレルギー除外フィルター
    if (searchFilters.excludeAllergens && searchFilters.excludeAllergens.length > 0) {
      result = result.filter(food => {
        if (!food.allergens || food.allergens.length === 0) return true;
        return !food.allergens.some(allergen => 
          searchFilters.excludeAllergens.some(excludeId => {
            return allergen.allergen_name === allergenMapping[excludeId];
          })
        );
      });
    }

    // 価格フィルター
    if (searchFilters.priceRange && searchFilters.priceRange !== 'all') {
      result = result.filter(food => {
        if (!food.price) return false;
        const price = parseFloat(food.price.replace(/[¥,]/g, ''));
        switch (searchFilters.priceRange) {
          case 'budget': return price <= 1000;
          case 'mid': return price > 1000 && price <= 3000;
          case 'high': return price > 3000 && price <= 5000;
          case 'premium': return price > 5000;
          default: return true;
        }
      });
    }

    // 安全レベルフィルター
    if (searchFilters.safetyLevel && searchFilters.safetyLevel !== 'all') {
      result = result.filter(food => {
        const safetyLevel = calculateFoodSafetyLevel(food, userSettings);
        switch (searchFilters.safetyLevel) {
          case 'safe': return safetyLevel === 'safe';
          case 'caution': return ['safe', 'caution', 'caution-heat', 'caution-trace'].includes(safetyLevel);
          case 'warning': return safetyLevel !== 'danger';
          default: return true;
        }
      });
    }

    return result;
  }, [sampleFoods, searchFilters, userSettings]);

  // 食品の安全レベル計算
  const calculateFoodSafetyLevel = (food, settings) => {
    if (!food.allergens || food.allergens.length === 0) {
      return 'safe';
    }

    let maxRisk = 'safe';
    food.allergens.forEach(allergen => {
      if (allergen.amount_category === '含有') {
        maxRisk = 'danger';
      } else if (allergen.amount_category === '少量' && maxRisk !== 'danger') {
        maxRisk = 'warning';
      } else if (allergen.amount_category === '微量' && !['danger', 'warning'].includes(maxRisk)) {
        if (allergen.heat_sensitive && settings.allowHeated) {
          // 加熱で安全になる場合はそのまま
        } else if (settings.allowTrace) {
          // 微量許可の場合はそのまま
        } else {
          maxRisk = 'caution';
        }
      }
    });

    return maxRisk;
  };

  const handleSettingsChange = (newSettings) => {
    setUserSettings(newSettings);
  };

  const handleSearchFilters = (newFilters) => {
    setSearchFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍽️ 食品検索</h1>
          <p className="text-gray-600">
            商品名、ブランド、アレルギー成分で詳細検索ができます
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 検索フィルターサイドバー */}
          <div className="lg:w-96">
            <AdvancedSearchPanel 
              onSearch={handleSearchFilters}
              initialFilters={searchFilters}
            />
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1">
            {/* コントロールバー */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredFoods.length}件の食品が見つかりました
                </span>
                <AllergyLegend compact={true} />
              </div>

              <div className="flex items-center space-x-4">
                {/* 設定ボタン */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiSettings} className="w-5 h-5" />
                </button>

                {/* 表示モード切り替え */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <SafeIcon icon={FiGrid} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <SafeIcon icon={FiList} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 検索結果の表示 */}
            {filteredFoods.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
              >
                {filteredFoods.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <FoodCard food={food} userSettings={userSettings} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiMapPin} className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  条件に合う食品が見つかりませんでした
                </h3>
                <p className="text-gray-600 mb-4">
                  検索条件やフィルターを調整してみてください
                </p>
                <button
                  onClick={() => handleSearchFilters({
                    keyword: '',
                    brand: '',
                    category: 'all',
                    containsAllergens: [],
                    excludeAllergens: [],
                    priceRange: 'all',
                    safetyLevel: 'all'
                  })}
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  フィルターをリセット
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 設定モーダル */}
      {showSettings && (
        <UserSettingsPanel
          userSettings={userSettings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default FoodSearch;