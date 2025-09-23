import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AllergyFilter from '../components/AllergyFilter';
import CategoryFilter from '../components/CategoryFilter';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../components/ProductCard';
import SupermarketCard from '../components/SupermarketCard';
import OnlineShopCard from '../components/OnlineShopCard';
import AllergySearchResults from '../components/AllergySearchResults';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFilter, FiGrid, FiList, FiMapPin, FiStar, FiInfo, FiShield, FiUser, FiFileText, FiPlus, FiCamera } = FiIcons;

const SearchResults = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const [selectedSourceTypes, setSelectedSourceTypes] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    brand: '',
    category: 'all',
    containsAllergens: [],
    excludeAllergens: [],
    priceRange: 'all',
    safetyLevel: 'all'
  });

  const { getFilteredItems, selectedAllergies, searchKeyword, selectedArea, selectedCategory, setSelectedCategory, categories } = useRestaurant();

  const filteredItems = getFilteredItems();

  // 検索フィルターを適用
  const searchFilteredItems = React.useMemo(() => {
    let result = [...filteredItems];

    // キーワード検索
    if (searchFilters.keyword) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.cuisine && item.cuisine.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.area && item.area.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.related_product && item.related_product.name && item.related_product.name.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.related_product && item.related_product.description && item.related_product.description.toLowerCase().includes(searchFilters.keyword.toLowerCase()))
      );
    }

    // ブランド検索
    if (searchFilters.brand) {
      result = result.filter(item =>
        (item.brand && item.brand.toLowerCase().includes(searchFilters.brand.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchFilters.brand.toLowerCase()))
      );
    }

    return result;
  }, [filteredItems, searchFilters]);

  // 情報源によるフィルタリング
  const sourceFilteredItems = selectedSourceTypes.length > 0
    ? searchFilteredItems.filter(item => 
        item.source && selectedSourceTypes.includes(item.source.type)
      )
    : searchFilteredItems;

  const sortedItems = [...sourceFilteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'confidence':
        return (b.source?.confidence || 0) - (a.source?.confidence || 0);
      case 'updated':
        const dateA = new Date(a.source?.lastUpdated || 0);
        const dateB = new Date(b.source?.lastUpdated || 0);
        return dateB - dateA;
      case 'price':
        if (a.price && b.price) {
          const priceA = parseFloat(a.price.replace(/[¥,]/g, ''));
          const priceB = parseFloat(b.price.replace(/[¥,]/g, ''));
          return priceA - priceB;
        }
        return 0;
      default:
        return 0;
    }
  });

  const getSearchSummary = () => {
    const parts = [];
    if (searchFilters.keyword) parts.push(`"${searchFilters.keyword}"`);
    if (searchFilters.brand) parts.push(`ブランド: "${searchFilters.brand}"`);
    if (selectedArea) parts.push(selectedArea);
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) parts.push(category.name);
    }
    if (selectedAllergies.length > 0) {
      parts.push(`${selectedAllergies.length}個のアレルギー対応`);
    }
    if (selectedSourceTypes.length > 0) {
      parts.push(`${selectedSourceTypes.length}種類の情報源`);
    }
    return parts.length > 0 ? parts.join(' • ') : '全アイテム';
  };

  const renderCard = (item) => {
    switch (item.category) {
      case 'products':
        return <ProductCard key={`product-${item.id}`} product={item} />;
      case 'supermarkets':
        return <SupermarketCard key={`supermarket-${item.id}`} supermarket={item} />;
      case 'online':
        return <OnlineShopCard key={`online-${item.id}`} shop={item} />;
      case 'restaurants':
      default:
        return <RestaurantCard key={`restaurant-${item.id}`} restaurant={item} />;
    }
  };

  const sourceTypes = [
    { id: 'official', name: '公式情報', icon: FiShield, color: 'text-green-600' },
    { id: 'verified', name: '検証済み', icon: FiStar, color: 'text-emerald-600' },
    { id: 'pdf', name: 'PDF解析', icon: FiFileText, color: 'text-blue-600' },
    { id: 'user_upload', name: 'ユーザー投稿', icon: FiUser, color: 'text-orange-600' },
    { id: 'community', name: 'コミュニティ', icon: FiUser, color: 'text-purple-600' }
  ];

  const toggleSourceType = (sourceType) => {
    setSelectedSourceTypes(prev =>
      prev.includes(sourceType)
        ? prev.filter(type => type !== sourceType)
        : [...prev, sourceType]
    );
  };

  // 情報源別の統計
  const sourceStats = sourceTypes.map(sourceType => ({
    ...sourceType,
    count: searchFilteredItems.filter(item => item.source?.type === sourceType.id).length
  }));


  return (
    <div className="min-h-screen bg-gray-50 relative z-[1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">検索結果</h1>
          <p className="text-gray-600 mb-4">{getSearchSummary()}</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-500">
              {!selectedArea || selectedArea.trim() === '' 
                ? '都道府県を入力して検索してください' 
                : `${sortedItems.length}件のアイテムが見つかりました`
              }
            </p>
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="rating">評価順</option>
                <option value="reviews">レビュー数順</option>
                <option value="confidence">信頼度順</option>
                <option value="updated">更新日順</option>
                <option value="name">名前順</option>
                <option value="price">価格順</option>
              </select>

              {/* Source Filter Toggle */}
              <button
                onClick={() => setShowSourceFilter(!showSourceFilter)}
                className={`flex items-center space-x-2 px-3 py-1 border rounded-lg text-sm hover:bg-gray-50 transition-colors ${
                  selectedSourceTypes.length > 0
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300'
                }`}
              >
                <SafeIcon icon={FiInfo} className="w-4 h-4" />
                <span>情報源</span>
                {selectedSourceTypes.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedSourceTypes.length}
                  </span>
                )}
              </button>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <SafeIcon icon={FiGrid} className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <SafeIcon icon={FiList} className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <SafeIcon icon={FiFilter} className="w-4 h-4" />
                <span>フィルター</span>
              </button>
            </div>
          </div>
        </div>


        {/* Source Filter Panel */}
        {showSourceFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">情報源で絞り込み</h3>
              <button
                onClick={() => setSelectedSourceTypes([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                クリア
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {sourceStats.map(sourceType => (
                <button
                  key={sourceType.id}
                  onClick={() => toggleSourceType(sourceType.id)}
                  disabled={sourceType.count === 0}
                  className={`p-3 rounded-lg border-2 text-sm transition-all ${
                    selectedSourceTypes.includes(sourceType.id)
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : sourceType.count > 0
                      ? 'bg-white border-gray-200 hover:border-gray-300'
                      : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <SafeIcon icon={sourceType.icon} className={`w-4 h-4 ${sourceType.color}`} />
                    <span className="font-medium">{sourceType.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {sourceType.count}件
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-96 space-y-6"
            >
              {/* Category Filter */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">カテゴリー</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg border transition-all duration-200
                        ${selectedCategory === category.id
                          ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }
                      `}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">アレルギーフィルター</h3>
                <AllergyFilter />
              </div>

              {/* Source Statistics */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">情報源別統計</h3>
                <div className="space-y-3">
                  {sourceStats.map(stat => (
                    <div key={stat.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={stat.icon} className={`w-4 h-4 ${stat.color}`} />
                        <span className="text-sm">{stat.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {stat.count}件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <div className="flex-1">
            <AllergySearchResults />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SearchResults;