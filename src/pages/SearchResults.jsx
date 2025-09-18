import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CategoryFilter from '../components/CategoryFilter';
import AdvancedSearchPanel from '../components/AdvancedSearchPanel';
// import UnifiedAllergyFilter from '../components/UnifiedAllergyFilter';
import RestaurantCard from '../components/RestaurantCard';
import ProductCard from '../components/ProductCard';
import SupermarketCard from '../components/SupermarketCard';
import OnlineShopCard from '../components/OnlineShopCard';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiFilter, FiGrid, FiList, FiMapPin, FiStar, FiInfo, FiShield, FiUser, FiFileText, FiChevronDown, FiChevronRight, FiExternalLink } = FiIcons;

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

  const { getFilteredItems, selectedAllergies, setSelectedAllergies, selectedArea, selectedCategory, categories, allergyOptions } = useRestaurant();

  const filteredItems = getFilteredItems();

  // 検索フィルターを適用
  const searchFilteredItems = React.useMemo(() => {
    let result = [...filteredItems];

    // キーワード検索
    if (searchFilters.keyword) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (item.cuisine && item.cuisine.toLowerCase().includes(searchFilters.keyword.toLowerCase()))
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

  const handleSearchFilters = (newFilters) => {
    setSearchFilters(newFilters);
  };

  // ここから: 店舗ごとの折りたたみ表示（選択アレルギーで食べられるメニューのみ）
  const [expanded, setExpanded] = useState({}); // key: item.id -> bool
  const toggleExpand = (pid) => setExpanded(prev => ({ ...prev, [pid]: !prev[pid] }));

  const isMenuSafe = (menuItem) => {
    if (!Array.isArray(selectedAllergies) || selectedAllergies.length === 0) return false;

    // 1) product_allergies_matrix を優先（高カバレッジ）
    try {
      // この関数のクロージャから現在のitem(=レストラン)の行は直接参照できないため、
      // menuItem.parent を事前に付与していない場合は fallback に移行
    } catch {}

    // 2) menu_item_allergies ベース（既存）
    const list = menuItem.menu_item_allergies || [];
    const hasList = Array.isArray(list) && list.length > 0;
    if (hasList) {
      const ok = selectedAllergies.every(slug => {
        const rec = list.find(a => (a.allergy_item_slug || a.allergy_item_id) === slug);
        const presence = (rec?.presence_type) || 'direct';
        return presence === 'none' || presence === 'trace';
      });
      if (ok) return true;
    }

    // 3) 親アイテムの matrix から判定（parentに格納してから判定）
    const parent = menuItem.__parentProduct;
    const matrixRows = parent?.allergyMatrix || [];
    if (Array.isArray(matrixRows) && matrixRows.length > 0) {
      const slugToCol = (s) => (s === 'soy' ? 'soybean' : s);
      const rowsForMenu = matrixRows.filter(r => (r.menu_name || '') === (menuItem.name || ''));
      if (rowsForMenu.length === 0) return false;
      // いずれかの行で全スラッグが 'd' でない（= none/trace）ならOK
      for (const r of rowsForMenu) {
        let ok = true;
        for (const s of selectedAllergies) {
          const col = slugToCol(s);
          const v = (r[col] || '').toString().toLowerCase(); // 'd'|'t'|'n'
          if (v === 'd') { ok = false; break; }
        }
        if (ok) return true;
      }
      return false;
    }

    return false;
  };

  const restaurantsOnly = sortedItems.filter(i => i.category === 'restaurants');
  const restaurantsWithEdible = restaurantsOnly.map(item => {
    const menus = Array.isArray(item.menuItems) ? item.menuItems : [];
    // 子へ親参照を付与しつつ判定
    const edible = menus.filter(m => {
      const mi = { ...m, __parentProduct: item };
      return isMenuSafe(mi);
    });
    // URLは source_url のみ（NULLは無視）
    const locs = Array.isArray(item.storeLocations) ? item.storeLocations : [];
    const primaryUrl = (locs.find(l => l.source_url)?.source_url) || null;
    return { item, edible, primaryUrl };
  });

  const shouldShowGrouped = selectedAllergies.length > 0 && selectedCategory === 'restaurants';

  // アレルギー選択トグル
  const toggleAllergy = (slug) => {
    setSelectedAllergies(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  // サイドバー上部に選択済み成分チップを表示
  const selectedChips = (allergyOptions || []).filter(a => selectedAllergies.includes(a.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">検索結果</h1>
          <p className="text-gray-600">{getSearchSummary()}</p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <p className="text-sm text-gray-500">
            {(shouldShowGrouped && restaurantsWithEdible.length > 0)
              ? restaurantsWithEdible.length
              : sortedItems.length}件のアイテムが見つかりました
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

        {/* Category Filter */}
        <div className="mb-8">
          <CategoryFilter />
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
              {/* 選択済みアレルギー（サイド上部で表示・同期） */}
              {selectedChips.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">選択中の成分</h3>
                    <button
                      onClick={() => setSelectedAllergies([])}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      クリア
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedChips.map(a => (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergy(a.id)}
                        className="px-2 py-1 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"
                        title={`${a.name} を外す`}
                      >
                        <span className="mr-1">{a.icon}</span>{a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 8品目 + 20品目（上と連動） */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">表示義務のある8品目</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(allergyOptions || []).slice(0,8).map(a => {
                    const active = selectedAllergies.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergy(a.id)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${active ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 hover:border-red-300'}`}
                        title={`${a.name}${active ? '（選択中）' : ''}`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{a.icon}</div>
                          <div className="font-medium">{a.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">表示が推奨される20品目</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(allergyOptions || []).slice(8).map(a => {
                    const active = selectedAllergies.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergy(a.id)}
                        className={`p-2 rounded-lg border-2 text-xs transition-all ${active ? 'bg-red-500 text-white border-red-500' : 'bg-white border-gray-200 hover:border-red-300'}`}
                        title={`${a.name}${active ? '（選択中）' : ''}`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{a.icon}</div>
                          <div className="font-medium">{a.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AdvancedSearchPanel 
                onSearch={handleSearchFilters}
                initialFilters={searchFilters}
              />

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
            {shouldShowGrouped ? (
              restaurantsWithEdible.length > 0 ? (
                <div className="space-y-3">
                  {restaurantsWithEdible.map(({ item, edible, primaryUrl }) => (
                    <div key={item.id} className="bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="flex-1 flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={expanded[item.id] ? FiChevronDown : FiChevronRight} className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">{item.name}</span>
                            <span className="text-xs text-gray-500">（{edible.length}件 食べられる）</span>
                          </div>
                        </button>
                        {primaryUrl && (
                          <a
                            href={primaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mx-3 inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                            title="情報元を開く"
                          >
                            <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                            <span>情報元</span>
                          </a>
                        )}
                      </div>
                      {expanded[item.id] && (
                        <div className="px-4 pb-3">
                          {edible.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                              {edible.map(mi => (
                                <li key={mi.id}>{mi.name}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">該当するメニューはありません</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // グルーピングが空でも通常リストにフォールバック
                sortedItems.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                    }
                  >
                    {sortedItems.map((item, index) => (
                      <motion.div
                        key={`${item.category}-${item.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {renderCard(item)}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiMapPin} className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      条件に合う店舗が見つかりませんでした
                    </h3>
                    <p className="text-gray-600 mb-4">
                      エリアやアレルギー条件を調整して再度お試しください
                    </p>
                  </div>
                )
              )
            ) : (
              sortedItems.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                  }
                >
                  {sortedItems.map((item, index) => (
                    <motion.div
                      key={`${item.category}-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      {renderCard(item)}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <SafeIcon icon={FiMapPin} className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    条件に合うアイテムが見つかりませんでした
                  </h3>
                  <p className="text-gray-600 mb-4">
                    検索条件やアレルギーフィルター、情報源フィルターを調整して再度お試しください
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;