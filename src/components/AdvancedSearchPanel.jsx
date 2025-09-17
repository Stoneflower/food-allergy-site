import React, { useState, useEffect } from 'react';
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
    ...initialFilters
  });

  const { categories, selectedArea, setSelectedArea, selectedCategory, setSelectedCategory } = useRestaurant();

  // 初期表示でカテゴリをレストランに固定
  useEffect(() => {
    if (selectedCategory !== 'restaurants') {
      setSelectedCategory('restaurants');
      setFilters(prev => ({ ...prev, category: 'restaurants' }));
      if (onSearch) onSearch({ ...filters, category: 'restaurants' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onSearch) {
      onSearch(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      keyword: '',
      brand: '',
      category: 'restaurants'
    };
    setFilters(clearedFilters);
    setSelectedArea('');
    setSelectedCategory('restaurants');
    if (onSearch) {
      onSearch(clearedFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.brand) count++;
    if (filters.category && filters.category !== 'restaurants') count++;
    if (selectedArea) count++;
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

          {/* Area (Address) Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🗾 エリア（都道府県名・住所の一部）
            </label>
            <input
              type="text"
              placeholder="例）兵庫県、札幌市、渋谷 など"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">store_locations.address を対象に部分一致で検索します</p>
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
            {/* Category (fixed to restaurants, but allow display as selected) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ カテゴリー（固定: レストラン）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      handleFilterChange('category', category.id);
                    }}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      (selectedCategory || filters.category) === category.id
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