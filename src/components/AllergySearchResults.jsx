import React from 'react';
import { motion } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiExternalLink, FiShield, FiAlertTriangle } = FiIcons;

const AllergySearchResults = () => {
  const { 
    getFilteredItems, 
    selectedAllergies, 
    searchKeyword, 
    selectedArea, 
    selectedCategory,
    allergyOptions 
  } = useRestaurant();

  const filteredItems = getFilteredItems();

  // アレルギー選択に基づいて商品をフィルタリング
  const getSafeProducts = (store) => {
    if (!store.menu_items || !Array.isArray(store.menu_items)) {
      return [];
    }

    return store.menu_items.filter(menuItem => {
      if (!menuItem.product_allergies_matrix || !Array.isArray(menuItem.product_allergies_matrix)) {
        return false;
      }

      // 選択されたアレルギーが含まれていない商品を返す
      return selectedAllergies.every(selectedAllergy => {
        const allergyInfo = menuItem.product_allergies_matrix.find(
          matrix => matrix.allergy_item_id === selectedAllergy
        );
        
        // アレルギー情報がない場合は安全とみなす
        if (!allergyInfo) return true;
        
        // presence_typeが'direct'または'trace'の場合は含有
        return !['direct', 'trace'].includes(allergyInfo.presence_type);
      });
    });
  };

  // コンタミネーション情報を取得
  const getContaminationInfo = (menuItem) => {
    if (!menuItem.product_allergies_matrix || !Array.isArray(menuItem.product_allergies_matrix)) {
      return [];
    }

    const contaminations = [];
    menuItem.product_allergies_matrix.forEach(matrix => {
      if (matrix.presence_type === 'trace') {
        const allergy = allergyOptions.find(a => a.id === matrix.allergy_item_id);
        if (allergy) {
          contaminations.push(`${allergy.name}コンタミネーション`);
        }
      }
    });

    return contaminations;
  };

  // 店舗データをグループ化
  const groupedStores = React.useMemo(() => {
    const stores = {};
    
    filteredItems.forEach(item => {
      if (item.category === 'products') {
        // 商品の店舗名を取得（products.nameを参照）
        const storeName = item.name || '店舗名不明';
        
        if (!stores[storeName]) {
          stores[storeName] = {
            name: storeName,
            source: item.source,
            menu_items: []
          };
        }
        
        // 商品情報を追加（product_allergies_matrixを参照）
        stores[storeName].menu_items.push({
          name: item.name,
          product_allergies_matrix: item.product_allergies_matrix || []
        });
      }
    });

    return Object.values(stores);
  }, [filteredItems, selectedAllergies]);

  // アレルギー成分を選択していない場合は全ての商品を表示
  if (selectedAllergies.length === 0) {
    return (
      <div className="space-y-6">
        {/* 検索条件表示 */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">検索条件</h3>
          <p className="text-green-700">アレルギー成分を選択していないため、全ての商品を表示しています</p>
        </div>

        {/* 店舗リスト */}
        {groupedStores.map((store, index) => {
          // アレルギー選択がない場合は全ての商品を表示
          const allProducts = store.menu_items || [];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              {/* 店舗ヘッダー */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiShield} className="w-6 h-6" />
                    <h2 className="text-xl font-bold">{store.name}</h2>
                  </div>
                  {store.source?.url && (
                    <a
                      href={store.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <span>アレルギー情報元</span>
                      <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* 商品リスト */}
              <div className="p-4">
                {allProducts.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      全商品 ({allProducts.length}件)
                    </h3>
                    {allProducts.map((product, productIndex) => {
                      const contaminations = getContaminationInfo(product);
                      
                      return (
                        <div
                          key={productIndex}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            {contaminations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {contaminations.map((contamination, contIndex) => (
                                  <span
                                    key={contIndex}
                                    className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center space-x-1"
                                  >
                                    <SafeIcon icon={FiAlertTriangle} className="w-3 h-3" />
                                    <span>{contamination}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-600">
                            <SafeIcon icon={FiShield} className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p>商品が見つかりませんでした</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {groupedStores.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              店舗が見つかりませんでした
            </h3>
            <p className="text-gray-500">
              検索条件を変更して再度お試しください
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索条件表示 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">検索条件</h3>
        <div className="flex flex-wrap gap-2">
          {selectedAllergies.map(allergyId => {
            const allergy = allergyOptions.find(a => a.id === allergyId);
            return allergy ? (
              <span key={allergyId} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                <span>{allergy.icon}</span>
                <span>{allergy.name}</span>
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* 店舗リスト */}
      {groupedStores.map((store, index) => {
        const safeProducts = getSafeProducts(store);
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
          >
            {/* 店舗ヘッダー */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiShield} className="w-6 h-6" />
                  <h2 className="text-xl font-bold">{store.name}</h2>
                </div>
                {store.source?.url && (
                  <a
                    href={store.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <span>アレルギー情報元</span>
                    <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* 商品リスト */}
            <div className="p-4">
              {safeProducts.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    安全な商品 ({safeProducts.length}件)
                  </h3>
                  {safeProducts.map((product, productIndex) => {
                    const contaminations = getContaminationInfo(product);
                    
                    return (
                      <div
                        key={productIndex}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          {contaminations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contaminations.map((contamination, contIndex) => (
                                <span
                                  key={contIndex}
                                  className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs flex items-center space-x-1"
                                >
                                  <SafeIcon icon={FiAlertTriangle} className="w-3 h-3" />
                                  <span>{contamination}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-green-600">
                          <SafeIcon icon={FiShield} className="w-5 h-5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p>選択されたアレルギー成分を含まない商品が見つかりませんでした</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {groupedStores.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            店舗が見つかりませんでした
          </h3>
          <p className="text-gray-500">
            検索条件を変更して再度お試しください
          </p>
        </div>
      )}
    </div>
  );
};

export default AllergySearchResults;
