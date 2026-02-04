import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp } = FiIcons;

const AdvancedSearchPanel = ({ onSearch, initialFilters = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    keyword: initialFilters.keyword || '',
    brand: initialFilters.brand || '',
    category: initialFilters.category || 'all',
    containsAllergens: initialFilters.containsAllergens || [],
    excludeAllergens: initialFilters.excludeAllergens || [],
    priceRange: initialFilters.priceRange || 'all',
    safetyLevel: initialFilters.safetyLevel || 'all',
    ...initialFilters
  });

  const { allergyOptions, categories } = useRestaurant();

  const priceRanges = [
    { id: 'all', name: 'すべて', range: '' },
    { id: 'budget', name: '〜¥1,000', range: '0-1000' },
    { id: 'mid', name: '¥1,000〜¥3,000', range: '1000-3000' },
    { id: 'high', name: '¥3,000〜¥5,000', range: '3000-5000' },
    { id: 'premium', name: '¥5,000〜', range: '5000+' }
  ];

  const safetyLevels = [
    { id: 'all', name: 'すべて表示', emoji: '🔍' },
    { id: 'safe', name: 'OK のみ', emoji: '✅' },
    { id: 'caution', name: '注意以下', emoji: '⚠️' },
    { id: 'warning', name: 'NG以下', emoji: '❌' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onSearch) {
      onSearch(newFilters);
    }
  };

  const toggleAllergen = (allergenId, type) => {
    const currentList = filters[type] || [];
    const newList = currentList.includes(allergenId)
      ? currentList.filter(id => id !== allergenId)
      : [...currentList, allergenId];
    handleFilterChange(type, newList);
  };

  const clearFilters = () => {
    const clearedFilters = {
      keyword: '',
      brand: '',
      category: 'all',
      containsAllergens: [],
      excludeAllergens: [],
      priceRange: 'all',
      safetyLevel: 'all'
    };
    setFilters(clearedFilters);
    if (onSearch) {
      onSearch(clearedFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.brand) count++;
    if (filters.category !== 'all') count++;
    if (filters.containsAllergens?.length) count++;
    if (filters.excludeAllergens?.length) count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.safetyLevel !== 'all') count++;
    return count;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      {/* Basic Search */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 商品名・レストラン名で検索
            </label>
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="商品名、レストラン名で検索..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
              />
            </div>
          </div>

          {/* Brand Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏢 ブランド・メーカー名で検索
            </label>
            <input
              type="text"
              placeholder="ブランド名、メーカー名で検索..."
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Contains Allergens Search - アレルギー品目すべて表示 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚠️ 含まれるアレルギー成分で検索
            </label>
            <p className="text-xs text-gray-500 mb-3">
              指定した成分が含まれている商品を検索します
            </p>
            
            {/* 法定8品目（特定原材料） */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                表示義務のある8品目（特定原材料）
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {allergyOptions.slice(0, 8).map(allergy => (
                  <button
                    key={allergy.id}
                    onClick={() => toggleAllergen(allergy.id, 'containsAllergens')}
                    className={`p-2 rounded-lg border-2 text-xs transition-all ${
                      (filters.containsAllergens || []).includes(allergy.id)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{allergy.icon}</div>
                      <div className="font-medium">{allergy.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 推奨品目（特定原材料に準ずるもの） */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-orange-800 mb-2">
                表示が推奨される品目（特定原材料に準ずるもの）
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {allergyOptions.slice(8).map(allergy => (
                  <button
                    key={allergy.id}
                    onClick={() => toggleAllergen(allergy.id, 'containsAllergens')}
                    className={`p-2 rounded-lg border-2 text-xs transition-all ${
                      (filters.containsAllergens || []).includes(allergy.id)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{allergy.icon}</div>
                      <div className="font-medium">{allergy.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(filters.containsAllergens?.length > 0) && (
              <div className="mt-2 text-xs text-red-700">
                {filters.containsAllergens.length}個の成分が選択されています
              </div>
            )}
          </div>
        </div>

        {/* Advanced Toggle */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiFilter} className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">詳細フィルター</span>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </div>
            <SafeIcon icon={isExpanded ? FiChevronUp : FiChevronDown} className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 border-t border-gray-200"
        >
          <div className="pt-4 space-y-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ カテゴリー
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange('category', category.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      filters.category === category.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{category.icon}</div>
                      <div className="font-medium text-xs">{category.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Exclude Allergens - アレルギー品目すべて表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚫 除外するアレルギー成分
              </label>
              <p className="text-xs text-gray-500 mb-3">
                指定した成分が含まれていない商品のみ表示します
              </p>

              {/* 法定8品目（特定原材料） */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-800 mb-2">
                  表示義務のある8品目（特定原材料）
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {allergyOptions.slice(0, 8).map(allergy => (
                    <button
                      key={allergy.id}
                      onClick={() => toggleAllergen(allergy.id, 'excludeAllergens')}
                      className={`p-2 rounded-lg border-2 text-xs transition-all ${
                        (filters.excludeAllergens || []).includes(allergy.id)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{allergy.icon}</div>
                        <div className="font-medium">{allergy.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 推奨品目（特定原材料に準ずるもの） */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-800 mb-2">
                  表示が推奨される品目（特定原材料に準ずるもの）
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {allergyOptions.slice(8).map(allergy => (
                    <button
                      key={allergy.id}
                      onClick={() => toggleAllergen(allergy.id, 'excludeAllergens')}
                      className={`p-2 rounded-lg border-2 text-xs transition-all ${
                        (filters.excludeAllergens || []).includes(allergy.id)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{allergy.icon}</div>
                        <div className="font-medium">{allergy.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 価格帯
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {priceRanges.map(range => (
                  <button
                    key={range.id}
                    onClick={() => handleFilterChange('priceRange', range.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      filters.priceRange === range.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center font-medium">{range.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Safety Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🛡️ 安全レベル
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {safetyLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => handleFilterChange('safetyLevel', level.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      filters.safetyLevel === level.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{level.emoji}</div>
                      <div className="font-medium text-xs">{level.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-4 h-4" />
                  <span>フィルターをクリア</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedSearchPanel;