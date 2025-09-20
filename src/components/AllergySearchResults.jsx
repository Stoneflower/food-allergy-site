import React, { useState } from 'react';
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
  const [expandedStores, setExpandedStores] = useState(new Set());
  
  // デバッグ用ログ
  console.log('AllergySearchResults - filteredItems:', filteredItems);
  console.log('AllergySearchResults - filteredItems products count:', filteredItems.filter(item => item.category === 'products').length);
  console.log('AllergySearchResults - filteredItems restaurants count:', filteredItems.filter(item => item.category === 'restaurants').length);
  console.log('AllergySearchResults - selectedAllergies:', selectedAllergies);
  console.log('AllergySearchResults - allergyOptions:', allergyOptions);

  // 店舗の展開/折りたたみ機能
  const toggleStoreExpansion = (storeName) => {
    console.log('toggleStoreExpansion called for:', storeName);
    console.log('current expandedStores:', expandedStores);
    const newExpandedStores = new Set(expandedStores);
    if (newExpandedStores.has(storeName)) {
      newExpandedStores.delete(storeName);
      console.log('closing store:', storeName);
    } else {
      newExpandedStores.add(storeName);
      console.log('opening store:', storeName);
    }
    console.log('new expandedStores:', newExpandedStores);
    setExpandedStores(newExpandedStores);
  };

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
          matrix => matrix.allergy_item_id === selectedAllergy || matrix.item_id === selectedAllergy
        );
        
        // デバッグログ
        console.log(`アレルギー判定 - 商品: ${menuItem.name}, アレルギーID: ${selectedAllergy}`);
        console.log('allergyInfo:', allergyInfo);
        
        // アレルギー情報がない場合は安全とみなす
        if (!allergyInfo) {
          console.log('アレルギー情報なし - 安全とみなす');
          return true;
        }
        
        // presence_typeが'direct'の場合は含有（除外）
        // presence_typeが'trace'の場合はコンタミネーション（表示する）
        const isDirectContained = allergyInfo.presence_type === 'direct';
        console.log(`presence_type: ${allergyInfo.presence_type}, 直接含有: ${isDirectContained}`);
        return !isDirectContained;
      });
    });
  };

  // コンタミネーション情報を取得（選択されたアレルギーのみ）
  const getContaminationInfo = (menuItem) => {
    if (!menuItem.product_allergies_matrix || !Array.isArray(menuItem.product_allergies_matrix)) {
      return [];
    }

    const contaminations = [];
    menuItem.product_allergies_matrix.forEach(matrix => {
      // 選択されたアレルギーのみをチェック
      if (matrix.presence_type === 'trace' && selectedAllergies.includes(matrix.allergy_item_id)) {
        const allergy = allergyOptions.find(a => 
          a.id === matrix.allergy_item_id || a.id === matrix.item_id
        );
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
    
    console.log('groupedStores - filteredItems processing:', filteredItems);
    
    // restaurantsカテゴリのアイテムのみを処理（これが店舗データ）
    filteredItems.forEach(item => {
      if (item.category === 'restaurants') {
        const storeName = item.name || '店舗名不明';
        console.log('groupedStores - processing restaurant:', storeName);
        
        if (!stores[storeName]) {
          stores[storeName] = {
            name: storeName,
            source: item.source,
            menu_items: []
          };
        }
        
        // 店舗に関連する商品を追加
        if (item.product_allergies_matrix && item.product_allergies_matrix.length > 0) {
          // デバッグ: product_allergies_matrixの構造を確認
          console.log('product_allergies_matrix構造:', item.product_allergies_matrix[0]);
          console.log('menu_name:', item.product_allergies_matrix[0].menu_name);
          
          // product_allergies_matrixからmenu_nameを取得
          const menuName = item.product_allergies_matrix[0].menu_name || item.related_product?.name || '商品名不明';
          stores[storeName].menu_items.push({
            name: menuName, // menu_nameを使用
            product_allergies_matrix: item.product_allergies_matrix || []
          });
          console.log('groupedStores - added product with menu_name:', menuName, 'to store:', storeName);
        } else if (item.related_product) {
          // product_allergies_matrixがない場合はrelated_productのnameを使用
          stores[storeName].menu_items.push({
            name: item.related_product.name,
            product_allergies_matrix: []
          });
          console.log('groupedStores - added related product:', item.related_product.name, 'to store:', storeName);
        } else {
          // 関連商品がない場合
          stores[storeName].menu_items.push({
            name: '商品情報なし',
            product_allergies_matrix: []
          });
        }
        
        console.log('groupedStores - added restaurant:', item.name);
      }
    });

    const result = Object.values(stores);
    console.log('groupedStores - final result:', result);
    return result;
  }, [filteredItems, selectedAllergies]);

  // 初期状態は全て閉じた状態にする（展開しない）
  // React.useEffect(() => {
  //   if (groupedStores.length > 0 && expandedStores.size === 0) {
  //     const firstStoreName = groupedStores[0].name;
  //     setExpandedStores(new Set([firstStoreName]));
  //   }
  // }, [groupedStores, expandedStores.size]);

  // アレルギー成分を選択していない場合は全ての商品を表示
  if (selectedAllergies.length === 0) {
    return (
      <div className="space-y-6">
        {/* 検索条件表示 */}
        <div className="bg-gray-50 p-3 text-sm text-gray-600">
          アレルギー成分を選択していないため、全ての商品を表示しています
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
              className="bg-white border border-gray-200 overflow-hidden"
            >
              {/* 店舗ヘッダー */}
              <div 
                className="bg-gray-50 border-b border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleStoreExpansion(store.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-medium text-gray-800">{store.name}</h3>
                    <span className="text-xs text-gray-500">
                      ({allProducts.length}件)
                    </span>
                    <span className="text-xs text-gray-400">
                      {expandedStores.has(store.name) ? '▼' : '▶'}
                    </span>
                  </div>
                  {store.source?.url && (
                    <a
                      href={store.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      情報元
                    </a>
                  )}
                </div>
              </div>

              {/* 商品リスト */}
              {expandedStores.has(store.name) && (
                <div className="p-2">
                  {allProducts.length > 0 ? (
                    <div className="space-y-1">
                    {allProducts.map((product, productIndex) => {
                      const contaminations = getContaminationInfo(product);
                      
                      return (
                        <div
                          key={productIndex}
                          className="flex items-center justify-between p-2 bg-gray-50 border-l-2 border-green-400"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">
                              {product.name}
                            </div>
                            {contaminations.length > 0 && (
                              <div className="text-xs text-yellow-600 mt-1">
                                {contaminations.join(', ')}
                              </div>
                            )}
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
              )}
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
            className="bg-white border border-gray-200 overflow-hidden"
          >
            {/* 店舗ヘッダー */}
            <div 
              className="bg-gray-50 border-b border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleStoreExpansion(store.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-medium text-gray-800">{store.name}</h3>
                  <span className="text-xs text-gray-500">
                    ({safeProducts.length}件)
                  </span>
                  <span className="text-xs text-gray-400">
                    {expandedStores.has(store.name) ? '▼' : '▶'}
                  </span>
                </div>
                {store.source?.url && (
                  <a
                    href={store.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    情報元
                  </a>
                )}
              </div>
            </div>

            {/* 商品リスト */}
            {expandedStores.has(store.name) && (
              <div className="p-2">
                {safeProducts.length > 0 ? (
                  <div className="space-y-1">
                  {safeProducts.map((product, productIndex) => {
                    const contaminations = getContaminationInfo(product);
                    
                    return (
                      <div
                        key={productIndex}
                        className="flex items-center justify-between p-2 bg-gray-50 border-l-2 border-green-400"
                      >
                        <div className="flex-1">
                          <div className="text-sm text-gray-800">
                            {product.name}
                          </div>
                          {contaminations.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              {contaminations.join(', ')}
                            </div>
                          )}
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
              )}
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
