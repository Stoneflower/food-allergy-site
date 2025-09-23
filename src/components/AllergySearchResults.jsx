import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiExternalLink, FiShield, FiAlertTriangle, FiChevronUp } = FiIcons;

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

  // エリア情報URLを取得する関数
  const getAreaInfoUrl = (store) => {
    console.log('getAreaInfoUrl - store:', store);
    console.log('getAreaInfoUrl - store.store_list_url:', store.store_list_url);
    console.log('getAreaInfoUrl - store.store_list_urlの型:', typeof store.store_list_url);
    console.log('getAreaInfoUrl - store.store_list_urlが空かどうか:', !store.store_list_url);
    
    // 直接のstore_list_urlを確認
    if (store.store_list_url && store.store_list_url.trim() !== '') {
      console.log('getAreaInfoUrl - 直接のstore_list_urlを使用:', store.store_list_url);
      return store.store_list_url;
    }
    
    // フォールバック: Google Maps検索
    console.log('getAreaInfoUrl - Google Maps検索にフォールバック');
    return `https://www.google.com/maps/search/${encodeURIComponent(store.name)}`;
  };
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // スクロール位置の監視
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300); // 300px以上スクロールしたら表示
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // トップに戻る関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
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
      if (!menuItem.product_allergies_matrix || !Array.isArray(menuItem.product_allergies_matrix) || menuItem.product_allergies_matrix.length === 0) {
        console.log(`商品 ${menuItem.name} はアレルギー情報がないため表示`);
        return true;
      }

      // menuItemは個別のメニューアイテム（例：ハンバーグ、ソフトクリーム）
      // menuItem.product_allergies_matrixは配列だが、各要素は同じメニューアイテムの情報
      // 最初の要素を使用してアレルギー情報をチェック
      
      // 選択されたアレルギーのいずれかが含まれている場合は除外
      const hasSelectedAllergy = selectedAllergies.some(selectedAllergy => {
        // このメニューアイテムのアレルギー情報をチェック
        const matrix = menuItem.product_allergies_matrix[0];
        if (!matrix) {
          console.log(`メニューアイテム ${menuItem.name} のmatrix情報なし - 安全`);
          return false;
        }
        
        const allergyValue = matrix[selectedAllergy];
        console.log(`アレルギー判定 - メニューアイテム: ${menuItem.name}, アレルギーID: ${selectedAllergy}, 値: ${allergyValue}`);
        
        // アレルギー情報がない場合は安全とみなす
        if (!allergyValue) {
          console.log(`メニューアイテム ${menuItem.name} のアレルギーID ${selectedAllergy} の情報なし - 安全`);
          return false; // 含有していない
        }
        
        // 'direct'の場合は含有（除外）
        // 'trace'と'Included'の場合はコンタミネーション/香料含有（表示する）
        const isDirectContained = allergyValue === 'direct';
        console.log(`アレルギー値: ${allergyValue}, 直接含有: ${isDirectContained}`);
        return isDirectContained;
      });
      
      console.log(`商品 ${menuItem.name} の選択アレルギー含有: ${hasSelectedAllergy}`);
      return !hasSelectedAllergy; // 選択されたアレルギーが含まれていない場合は表示
    });
  };

  // アレルギー情報を取得（商品のすべてのアレルギー情報を表示）
  const getContaminationInfo = (menuItem) => {
    console.log(`🔍 getContaminationInfo 呼び出し - 商品: ${menuItem.name}, selectedAllergies:`, selectedAllergies);
    console.log(`🔍 allergyOptions の内容:`, allergyOptions.map(a => ({ id: a.id, name: a.name })));
    
    if (!menuItem.product_allergies_matrix || !Array.isArray(menuItem.product_allergies_matrix)) {
      console.log(`❌ 商品 ${menuItem.name} にproduct_allergies_matrixがありません`);
      return [];
    }

    const contaminationAllergies = [];
    const fragranceAllergies = [];
    const matrix = menuItem.product_allergies_matrix[0]; // 最初の要素を使用
    
    console.log(`📊 商品 ${menuItem.name} のmatrix:`, matrix);
    
    if (matrix) {
      // すべてのアレルギーIDをチェック（selectedAllergiesに限定しない）
      const allAllergyIds = Object.keys(matrix);
      console.log(`🔍 商品 ${menuItem.name} の全アレルギーID:`, allAllergyIds);
      console.log(`🔍 修正版コード実行中 - selectedAllergiesは使用しません`);
      
      // menu_nameを除外してアレルギーIDのみを処理
      const allergyIdsOnly = allAllergyIds.filter(id => id !== 'menu_name');
      console.log(`🔍 アレルギーIDのみ:`, allergyIdsOnly);
      
      allergyIdsOnly.forEach(allergyId => {
        const allergyValue = matrix[allergyId];
        console.log(`アレルギー確認 - 商品: ${menuItem.name}, アレルギー: ${allergyId}, 値: ${allergyValue}`);
        
        // allergyValueが配列の場合と単一値の場合に対応
        const allergyValues = Array.isArray(allergyValue) ? allergyValue : [allergyValue];
        
        allergyValues.forEach(value => {
          if (value === 'trace') {
            const allergy = allergyOptions.find(a => a.id === allergyId);
            if (allergy) {
              contaminationAllergies.push(allergy.name);
              console.log(`コンタミネーション発見: ${allergy.name}コンタミネーション`);
            }
          } else if (value === 'Included') {
            const allergy = allergyOptions.find(a => a.id === allergyId);
            console.log(`🔍 アレルギー検索 - ID: ${allergyId}, 見つかったアレルギー:`, allergy);
            if (allergy) {
              fragranceAllergies.push(allergy.name);
              console.log(`香料含有発見: ${allergy.name}香料にふくむ`);
            } else {
              console.warn(`⚠️ アレルギーID "${allergyId}" が見つかりません`);
            }
          }
        });
      });
    }

    // 結果をまとめて返す
    const result = [];
    if (contaminationAllergies.length > 0) {
      result.push(`${contaminationAllergies.join('、')}コンタミネーション`);
    }
    if (fragranceAllergies.length > 0) {
      result.push(`${fragranceAllergies.join('、')}香料にふくむ`);
    }

    console.log(`✅ 商品 ${menuItem.name} の最終結果:`, result);
    return result;
  };

  // 店舗データをグループ化
  const groupedStores = React.useMemo(() => {
    const stores = {};
    
    console.log('groupedStores - filteredItems processing:', filteredItems);
    
    // すでに上位でカテゴリフィルタ済みなので、ここでは全アイテムを処理
    filteredItems.forEach(item => {
      {
        const storeName = item.name || '店舗名不明';
        // 『すべて』という見出しは表示しない
        if (storeName === 'すべて') {
          return;
        }
        console.log('groupedStores - processing restaurant:', storeName);
        
        if (!stores[storeName]) {
          stores[storeName] = {
            name: storeName,
            source: item.source,
            area: item.area,
            store_list_url: item.store_list_url,
            category: item.category,
            menu_items: []
          };
        }
        
        // 店舗に関連する商品を追加
        if (item.product_allergies_matrix && item.product_allergies_matrix.length > 0) {
          // デバッグ: product_allergies_matrixの構造を確認
          console.log('=== 店舗:', storeName, '===');
          console.log('product_allergies_matrix全体:', item.product_allergies_matrix);
          console.log('product_allergies_matrix件数:', item.product_allergies_matrix.length);
          console.log('最初のmatrix要素:', item.product_allergies_matrix[0]);
          
          // product_allergies_matrixの全要素を処理
          item.product_allergies_matrix.forEach((matrix, index) => {
            const menuName = matrix.menu_name || `商品${index + 1}`;
            console.log(`商品${index + 1}:`, menuName, 'matrix:', matrix);
            
            // 不明な商品のチェック
            if (!matrix.menu_name) {
              console.warn(`⚠️ 不明な商品発見: matrix.menu_nameがnull/undefined - 商品${index + 1}として表示`);
            }
            
            // 同じ商品名で異なるアレルギー情報があるかチェック
            const existingProduct = stores[storeName].menu_items.find(item => item.name === menuName);
            if (existingProduct) {
              console.log(`🔄 同じ商品名発見: ${menuName} - 既存のアレルギー情報と新しい情報を比較`);
              console.log('既存のmatrix:', existingProduct.product_allergies_matrix);
              console.log('新しいmatrix:', matrix);
            }
            
            stores[storeName].menu_items.push({
              name: menuName,
              display_name: (item?.related_product?.product_title) || (item?.related_product?.name) || menuName,
              product_allergies_matrix: [matrix], // 個別のmatrixを配列で渡す
              image_urls: [
                item?.related_product?.source_url,
                item?.related_product?.source_url2
              ].filter(Boolean)
            });
          });
          
          console.log('groupedStores - added', item.product_allergies_matrix.length, 'products to store:', storeName);
        } else if (item.related_product) {
          // product_allergies_matrixがない場合はrelated_productのnameを使用
          stores[storeName].menu_items.push({
            name: item.related_product.product_title || item.related_product.name,
            display_name: item.related_product.product_title || item.related_product.name,
            product_allergies_matrix: [],
            image_urls: [
              item?.related_product?.source_url,
              item?.related_product?.source_url2
            ].filter(Boolean)
          });
          console.log('groupedStores - added related product:', item.related_product.name, 'to store:', storeName);
        } else {
          // 関連商品がない場合（store_locationsテーブルのみのデータ）
          console.warn(`⚠️ 店舗データに商品情報がありません: ${storeName}`);
          console.log('item詳細:', item);
          console.log('storeName:', storeName);
          
          // 商品情報がない店舗は表示しない（menu_itemsに追加しない）
          console.log('商品情報がない店舗のため、表示をスキップ:', storeName);
          
          // 店舗自体も表示リストから除外する
          delete stores[storeName];
          console.log('商品情報がない店舗を表示リストから除外:', storeName);
          return; // この店舗の処理を終了
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

  // エリア入力が空の場合はメッセージを表示
  if (!selectedArea || selectedArea.trim() === '') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📍</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          都道府県を入力してください
        </h3>
        <p className="text-gray-500">
          都道府県名を入力して、アレルギー対応店舗を検索できます
        </p>
      </div>
    );
  }

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
        const headerPreview = (allProducts[0]?.image_urls || []).slice(0, 2);
          
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
                  <div className="flex items-center space-x-2">
                    <a
                      href={store.source?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        store.source?.url 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      アレルギー情報元
                    </a>
                    <a
                      href={store.store_list_url || `https://www.google.com/maps/search/${encodeURIComponent(store.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        store.store_list_url 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      エリア情報
                    </a>
                  </div>
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
      {/* 検索条件表示（上部に移動） */}
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
        
        // デバッグ: 店舗データの構造を確認
        console.log(`店舗 ${store.name} のデータ:`, store);
        console.log(`店舗 ${store.name} のsource:`, store.source);
        console.log(`店舗 ${store.name} のarea:`, store.area);
        console.log(`店舗 ${store.name} のstore_list_url:`, store.store_list_url);
        
        // アレルギーが選択されていて、この店舗の安全商品が0件なら非表示
        const safeProductsForHeader = getSafeProducts(store);
        const headerPreview = (safeProductsForHeader[0]?.image_urls || []).slice(0, 2);
        if (selectedAllergies.length > 0 && safeProductsForHeader.length === 0) {
          return null;
        }

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
                  <span className="text-xs text-gray-500">({safeProductsForHeader.length}件)</span>
                  <span className="text-xs text-gray-400">
                    {expandedStores.has(store.name) ? '▼' : '▶'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!(selectedCategory === 'supermarkets' || selectedCategory === 'online') && (
                    <a
                      href={store.source?.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        store.source?.url 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      アレルギー情報元
                    </a>
                  )}
                  {!(selectedCategory === 'supermarkets' || selectedCategory === 'online') && (
                    <a
                      href={getAreaInfoUrl(store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        getAreaInfoUrl(store) !== '#' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      エリア情報
                    </a>
                  )}
                  {headerPreview && headerPreview.length > 0 && (
                    <div className="flex items-center space-x-1 ml-2">
                      {headerPreview.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>
                          <img src={url} alt={`画像${i+1}`} className="w-10 h-10 object-cover rounded" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
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
                            {product.display_name || product.name}
                          </div>
                          {contaminations.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              {contaminations.join(', ')}
                            </div>
                          )}
                          {/* 画像サムネ（行内）は非表示にし、商品名のみ表示 */}
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

      {/* フローティングトップボタン */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 ease-in-out"
          aria-label="トップに戻る"
        >
          <FiChevronUp className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

export default AllergySearchResults;
