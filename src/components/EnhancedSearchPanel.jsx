import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useDebouncedInput } from '../hooks/useDebounce';

const { FiSearch, FiMapPin, FiFilter, FiX, FiChevronDown } = FiIcons;

const EnhancedSearchPanel = ({ onSearchResults, onLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // エリア入力にdebounceを適用
  const { inputValue: areaInputValue, setInputValue: setAreaInputValue, debouncedValue: debouncedArea } = useDebouncedInput('', 300);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [prefectures, setPrefectures] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);

  // アレルギー項目の定義
  const allergyItems = [
    { id: 'egg', name: '卵', icon: '🥚' },
    { id: 'milk', name: '乳', icon: '🥛' },
    { id: 'wheat', name: '小麦', icon: '🌾' },
    { id: 'buckwheat', name: 'そば', icon: '🌰' },
    { id: 'peanut', name: '落花生', icon: '🥜' },
    { id: 'shrimp', name: 'えび', icon: '🦐' },
    { id: 'crab', name: 'かに', icon: '🦀' },
    { id: 'walnut', name: 'くるみ', icon: '🌰' },
    { id: 'soybean', name: '大豆', icon: '🟤' },
    { id: 'beef', name: '牛肉', icon: '🥩' },
    { id: 'pork', name: '豚肉', icon: '🥓' },
    { id: 'chicken', name: '鶏肉', icon: '🍗' },
    { id: 'salmon', name: 'さけ', icon: '🐟' },
    { id: 'mackerel', name: 'さば', icon: '🐟' },
    { id: 'abalone', name: 'あわび', icon: '🐚' },
    { id: 'squid', name: 'いか', icon: '🦑' },
    { id: 'salmon_roe', name: 'いくら', icon: '🍣' },
    { id: 'orange', name: 'オレンジ', icon: '🍊' },
    { id: 'kiwi', name: 'キウイフルーツ', icon: '🥝' },
    { id: 'peach', name: 'もも', icon: '🍑' },
    { id: 'apple', name: 'りんご', icon: '🍎' },
    { id: 'yam', name: 'やまいも', icon: '🍠' },
    { id: 'gelatin', name: 'ゼラチン', icon: '🍮' },
    { id: 'banana', name: 'バナナ', icon: '🍌' },
    { id: 'cashew', name: 'カシューナッツ', icon: '🥜' },
    { id: 'sesame', name: 'ごま', icon: '🌰' },
    { id: 'almond', name: 'アーモンド', icon: '🌰' },
    { id: 'matsutake', name: 'まつたけ', icon: '🍄' }
  ];

  // カテゴリの定義
  const categories = [
    { id: 'all', name: 'すべて', icon: '🔍' },
    { id: 'restaurants', name: 'レストラン', icon: '🍽️' },
    { id: 'products', name: '商品', icon: '📦' },
    { id: 'supermarkets', name: 'スーパー', icon: '🏪' },
    { id: 'online', name: 'オンライン', icon: '💻' }
  ];

  // メニューカテゴリの定義
  const menuCategoryOptions = [
    { id: 'all', name: '全て', icon: '🍽️' },
    { id: 'rice', name: 'ごはん', icon: '🍚' },
    { id: 'noodles', name: '麺', icon: '🍜' },
    { id: 'dessert', name: 'デザート', icon: '🍰' }
  ];

  // 都道府県データの取得
  useEffect(() => {
    const fetchPrefectures = async () => {
      try {
        const { data, error } = await supabase
          .from('store_locations')
          .select('address')
          .not('address', 'is', null);
        
        if (error) throw error;
        
        const uniquePrefectures = [...new Set(data.map(item => item.address))].sort();
        setPrefectures(uniquePrefectures);
      } catch (error) {
        console.error('都道府県データの取得エラー:', error);
      }
    };

    fetchPrefectures();
  }, []);

  // メニューカテゴリデータの取得
  useEffect(() => {
    const fetchMenuCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('name')
          .not('name', 'is', null);
        
        if (error) throw error;
        
        // メニュー名からカテゴリを推測
        const categories = new Set();
        data.forEach(item => {
          const name = item.name.toLowerCase();
          if (name.includes('ごはん') || name.includes('ライス') || name.includes('丼')) {
            categories.add('rice');
          } else if (name.includes('麺') || name.includes('ラーメン') || name.includes('うどん') || name.includes('そば')) {
            categories.add('noodles');
          } else if (name.includes('デザート') || name.includes('ケーキ') || name.includes('アイス')) {
            categories.add('dessert');
          }
        });
        
        setMenuCategories(Array.from(categories));
      } catch (error) {
        console.error('メニューカテゴリデータの取得エラー:', error);
      }
    };

    fetchMenuCategories();
  }, []);

  // 検索実行
  const handleSearch = async () => {
    if (onLoading) onLoading(true);
    setIsLoading(true);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          menu_items (
            *,
            menu_item_allergies (
              *,
              allergy_items (name, icon)
            )
          ),
          store_locations (*)
        `);

      // カテゴリフィルター
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // エリアフィルター（debouncedAreaを使用）
      if (debouncedArea) {
        query = query.eq('store_locations.address', debouncedArea);
      }

      // キーワード検索
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // アレルギーフィルター
      let filteredData = data || [];
      if (selectedAllergies.length > 0) {
        filteredData = filteredData.filter(product => {
          return product.menu_items.some(menuItem => {
            return selectedAllergies.every(allergyId => {
              return menuItem.menu_item_allergies.some(allergy => 
                allergy.allergy_item_id === allergyId && 
                (allergy.presence_type === 'none' || allergy.presence_type === 'trace')
              );
            });
          });
        });
      }

      // メニューカテゴリフィルター
      if (selectedMenuCategory !== 'all') {
        filteredData = filteredData.filter(product => {
          return product.menu_items.some(menuItem => {
            const name = menuItem.name.toLowerCase();
            switch (selectedMenuCategory) {
              case 'rice':
                return name.includes('ごはん') || name.includes('ライス') || name.includes('丼');
              case 'noodles':
                return name.includes('麺') || name.includes('ラーメン') || name.includes('うどん') || name.includes('そば');
              case 'dessert':
                return name.includes('デザート') || name.includes('ケーキ') || name.includes('アイス');
              default:
                return true;
            }
          });
        });
      }

      if (onSearchResults) onSearchResults(filteredData);
    } catch (error) {
      console.error('検索エラー:', error);
      if (onSearchResults) onSearchResults([]);
    } finally {
      setIsLoading(false);
      if (onLoading) onLoading(false);
    }
  };

  // アレルギーの選択/解除
  const toggleAllergy = (allergyId) => {
    setSelectedAllergies(prev => 
      prev.includes(allergyId)
        ? prev.filter(id => id !== allergyId)
        : [...prev, allergyId]
    );
  };

  // エンターキーで検索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <SafeIcon icon={FiSearch} className="w-6 h-6 text-orange-500" />
          <span>詳細検索</span>
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <SafeIcon icon={FiFilter} className="w-4 h-4" />
          <span>フィルター</span>
          <SafeIcon icon={FiChevronDown} className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 基本検索 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="店舗名や商品名を入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">エリア</label>
          <input
            type="text"
            value={areaInputValue}
            onChange={(e) => setAreaInputValue(e.target.value)}
            placeholder="都道府県名を入力（例：兵庫県、大阪、東京）"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {debouncedArea && (
            <p className="text-xs text-gray-500 mt-1">
              検索中: {debouncedArea}
            </p>
          )}
        </div>
      </div>

      {/* 詳細フィルター */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-6"
        >
          {/* アレルギーフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">アレルギー対応</label>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {allergyItems.map(allergy => (
                <button
                  key={allergy.id}
                  onClick={() => toggleAllergy(allergy.id)}
                  className={`p-2 rounded-lg border-2 text-sm transition-all ${
                    selectedAllergies.includes(allergy.id)
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{allergy.icon}</div>
                    <div className="text-xs">{allergy.name}</div>
                  </div>
                </button>
              ))}
            </div>
            {selectedAllergies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAllergies.map(allergyId => {
                  const allergy = allergyItems.find(a => a.id === allergyId);
                  return (
                    <span
                      key={allergyId}
                      className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{allergy.icon}</span>
                      <span>{allergy.name}</span>
                      <button
                        onClick={() => toggleAllergy(allergyId)}
                        className="ml-1 hover:text-orange-600"
                      >
                        <SafeIcon icon={FiX} className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* メニューカテゴリフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">メニューカテゴリ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {menuCategoryOptions.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedMenuCategory(category.id)}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    selectedMenuCategory === category.id
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">{category.icon}</div>
                    <div className="text-xs">{category.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 検索ボタン */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>検索中...</span>
            </>
          ) : (
            <>
              <SafeIcon icon={FiSearch} className="w-5 h-5" />
              <span>検索する</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EnhancedSearchPanel;
