import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRestaurant } from '../context/RestaurantContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiExternalLink, FiShield, FiAlertTriangle, FiChevronUp } = FiIcons;

const AllergySearchResults = ({ items }) => {
  const { 
    getFilteredItems, 
    selectedAllergies, 
    searchKeyword, 
    selectedArea, 
    selectedCategory,
    allergyOptions,
    selectedFragranceForSearch,
    selectedTraceForSearch
  } = useRestaurant();

  const filteredItems = items ?? getFilteredItems();
  
  // デバッグ用: propsの確認
  console.log('🔍 AllergySearchResults - items props:', items?.length || 0, '件');
  console.log('🔍 AllergySearchResults - items propsサンプル:', items?.[0]);
  console.log('🔍 AllergySearchResults - getFilteredItems():', getFilteredItems()?.length || 0, '件');
  console.log('🔍 AllergySearchResults - filteredItems:', filteredItems?.length || 0, '件');
  
  const [expandedStores, setExpandedStores] = useState(new Set());
  const storeRefs = React.useRef({});
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100); // 仮想化: 最初は100件

  // アレルギー適合性チェック関数
  const checkAllergyCompatibility = (matrix, selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch) => {
    console.log('🔍 checkAllergyCompatibility開始:', {
      matrix,
      selectedAllergies,
      selectedFragranceForSearch,
      selectedTraceForSearch
    });

    // アレルギー検索条件が設定されていない場合は、すべての商品を表示
    if (!selectedAllergies || selectedAllergies.length === 0) {
      console.log('🔍 アレルギー検索条件なし - すべての商品を表示');
      return true;
    }

    // matrixにアレルギー情報がない場合は警告を表示するが、商品は表示する
    if (!matrix) {
      console.log('⚠️ アレルギー情報なし - 警告表示するが商品は表示');
      return true;
    }

    // matrixが配列の場合、最初の要素を使用
    const matrixData = Array.isArray(matrix) ? matrix[0] : matrix;
    
    if (!matrixData || !matrixData.allergy_item_id) {
      console.log('⚠️ アレルギー情報なし - 警告表示するが商品は表示');
      return true;
    }

    // 選択されたアレルギーに該当するかチェック
    const isSelectedAllergy = selectedAllergies.includes(matrixData.allergy_item_id);
    
    // presence_typeが'direct'（直接含有）の場合は除外
    if (isSelectedAllergy && matrixData.presence_type === 'direct') {
      console.log('🔍 アレルギー含有 - 商品を除外:', matrixData.allergy_item_id);
      return false;
    }

    // presence_typeが'trace'（香料程度）の場合は表示
    if (isSelectedAllergy && matrixData.presence_type === 'trace') {
      console.log('🔍 アレルギー香料程度 - 商品を表示:', matrixData.allergy_item_id);
      return true;
    }

    // その他の場合は表示
    console.log('🔍 その他の条件 - 商品を表示');
    return true;
  };

  // エリア情報URLを取得する関数
  const getAreaInfoUrl = (store) => {
    if (import.meta?.env?.DEV) {
      console.log('getAreaInfoUrl - store:', store);
      console.log('getAreaInfoUrl - store.store_list_url:', store.store_list_url);
      console.log('getAreaInfoUrl - store.store_list_urlの型:', typeof store.store_list_url);
      console.log('getAreaInfoUrl - store.store_list_urlが空かどうか:', !store.store_list_url);
    }
    
    // 直接のstore_list_urlを確認
    if (store.store_list_url && store.store_list_url.trim() !== '') {
      if (import.meta?.env?.DEV) console.log('getAreaInfoUrl - 直接のstore_list_urlを使用:', store.store_list_url);
      return store.store_list_url;
    }
    
    // フォールバック: Google Maps検索
    if (import.meta?.env?.DEV) console.log('getAreaInfoUrl - Google Maps検索にフォールバック');
    return `https://www.google.com/maps/search/${encodeURIComponent(store.name)}`;
  };
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // スクロール位置の監視
  useEffect(() => {
    // 画面幅に応じてモバイル判定を更新
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300); // 300px以上スクロールしたら表示

      // 末尾付近で追加読み込み
      const nearBottom = (window.innerHeight + scrollTop) >= (document.body.offsetHeight - 800);
      if (nearBottom) {
        setVisibleCount(prev => Math.min(prev + 100, groupedStores.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // フィルタ結果が変わったら可視件数を初期化
  useEffect(() => {
    setVisibleCount(100);
  }, [filteredItems]);

  // トップに戻る関数
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // デバッグ用ログ
  if (import.meta?.env?.DEV) {
    console.log('AllergySearchResults - filteredItems:', filteredItems);
    console.log('AllergySearchResults - filteredItems products count:', filteredItems.filter(item => item.category === 'products').length);
    console.log('AllergySearchResults - filteredItems restaurants count:', filteredItems.filter(item => item.category === 'restaurants').length);
    console.log('AllergySearchResults - selectedAllergies:', selectedAllergies);
    console.log('AllergySearchResults - allergyOptions:', allergyOptions);
  }

  // 店舗の展開/折りたたみ機能
  const toggleStoreExpansion = (storeName) => {
    if (import.meta?.env?.DEV) {
      console.log('toggleStoreExpansion called for:', storeName);
      console.log('current expandedStores:', expandedStores);
    }
    const newExpandedStores = new Set(expandedStores);
    if (newExpandedStores.has(storeName)) {
      newExpandedStores.delete(storeName);
      if (import.meta?.env?.DEV) console.log('closing store:', storeName);
    } else {
      newExpandedStores.add(storeName);
      if (import.meta?.env?.DEV) console.log('opening store:', storeName);
      // スマホ時は会社名（ヘッダー）へスムーズスクロール
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setTimeout(() => {
          const el = storeRefs.current[storeName];
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
      }
    }
    if (import.meta?.env?.DEV) console.log('new expandedStores:', newExpandedStores);
    setExpandedStores(newExpandedStores);
  };

  // アレルギー選択に基づいて商品をフィルタリング
  const getSafeProducts = (store) => {
    if (!store.menu_items || !Array.isArray(store.menu_items)) {
      return [];
    }

    return store.menu_items.filter(menuItem => {
      if (!menuItem.product_allergies || !Array.isArray(menuItem.product_allergies) || menuItem.product_allergies.length === 0) {
        if (import.meta?.env?.DEV) console.log(`商品 ${menuItem.name} はアレルギー情報がないため表示`);
        return true;
      }

      // menuItemは個別のメニューアイテム（例：ハンバーグ、ソフトクリーム）
      // menuItem.product_allergiesは配列だが、各要素は同じメニューアイテムの情報
      // 最初の要素を使用してアレルギー情報をチェック
      
      // 選択されたアレルギーのいずれかが含まれている場合は除外
      const hasSelectedAllergy = selectedAllergies.some(selectedAllergy => {
        // このメニューアイテムのアレルギー情報をチェック
        const matrix = menuItem.product_allergies[0];
        if (!matrix) {
          if (import.meta?.env?.DEV) console.log(`メニューアイテム ${menuItem.name} のmatrix情報なし - 安全`);
          return false;
        }
        
        const allergyValue = matrix[selectedAllergy];
        if (import.meta?.env?.DEV) console.log(`アレルギー判定 - メニューアイテム: ${menuItem.name}, アレルギーID: ${selectedAllergy}, 値: ${allergyValue}`);
        
        // アレルギー情報がない場合は安全とみなす
        if (!allergyValue) {
          if (import.meta?.env?.DEV) console.log(`メニューアイテム ${menuItem.name} のアレルギーID ${selectedAllergy} の情報なし - 安全`);
          return false; // 含有していない
        }
        
        // 'direct'の場合は含有（除外）
        // 'trace'と'Included'の場合はコンタミネーション/香料含有（表示する）
        const isDirectContained = allergyValue === 'direct';
        if (import.meta?.env?.DEV) console.log(`アレルギー値: ${allergyValue}, 直接含有: ${isDirectContained}`);
        return isDirectContained;
      });
      
      if (import.meta?.env?.DEV) console.log(`商品 ${menuItem.name} の選択アレルギー含有: ${hasSelectedAllergy}`);
      if (hasSelectedAllergy) return false;

      // 追加: ユーザー設定の非表示（included / trace）が1つでも該当したら商品を非表示
      const matrix = menuItem.product_allergies[0] || {};
      // included（香料にふくむ）
      const hasFragranceExcluded = (selectedFragranceForSearch || []).some(aid => {
        const val = matrix[aid];
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        return arr.includes('Included');
      });
      if (hasFragranceExcluded) return false;

      // trace（コンタミネーション）
      const hasTraceExcluded = (selectedTraceForSearch || []).some(aid => {
        const val = matrix[aid];
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        return arr.includes('trace');
      });
      if (hasTraceExcluded) return false;

      return true; // いずれにも該当しなければ表示
    });
  };

  // アレルギー情報を取得（商品のすべてのアレルギー情報を表示）
  const getContaminationInfo = (menuItem) => {
    console.log(`🔍 getContaminationInfo 呼び出し - 商品: ${menuItem.name}, selectedAllergies:`, selectedAllergies);
    console.log(`🔍 allergyOptions の内容:`, allergyOptions.map(a => ({ id: a.id, name: a.name })));
    
      if (!menuItem.product_allergies || !Array.isArray(menuItem.product_allergies)) {
        console.log(`❌ 商品 ${menuItem.name} にproduct_allergiesがありません`);
        return [];
      }

      const contaminationAllergies = [];
      const fragranceAllergies = [];
      const allergies = menuItem.product_allergies; // product_allergies配列を使用
    
    console.log(`📊 商品 ${menuItem.name} のallergies:`, allergies);
    
    if (allergies && allergies.length > 0) {
      // product_allergies配列を処理
      console.log(`🔍 商品 ${menuItem.name} のアレルギー情報数:`, allergies.length);
      console.log(`🔍 修正版コード実行中 - selectedAllergiesは使用しません`);
      
      allergies.forEach(allergy => {
        const allergyId = allergy.allergy_item_id;
        const presenceType = allergy.presence_type;
        console.log(`アレルギー確認 - 商品: ${menuItem.name}, アレルギー: ${allergyId}, 含有タイプ: ${presenceType}`);
        
        // presence_typeに基づいて分類
        if (presenceType === 'direct' || presenceType === 'contains') {
          const allergyInfo = allergyOptions.find(a => a.id === allergyId);
          console.log(`🔍 アレルギー検索 - ID: ${allergyId}, 見つかったアレルギー:`, allergyInfo);
          
          if (allergyInfo) {
            if (allergy.amount_level === 'trace') {
              contaminationAllergies.push(allergyInfo.name);
              console.log(`コンタミネーション発見: ${allergyInfo.name}コンタミネーション`);
            } else if (allergy.notes && allergy.notes.includes('香料')) {
              fragranceAllergies.push(allergyInfo.name);
              console.log(`香料含有発見: ${allergyInfo.name}香料に含む`);
            } else {
              contaminationAllergies.push(allergyInfo.name);
              console.log(`含有発見: ${allergyInfo.name}含有`);
            }
          } else {
            console.warn(`⚠️ アレルギーID "${allergyId}" が見つかりません`);
          }
        }
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
        
        // 店舗に関連する商品を追加（アレルギー検索条件に適合するもののみ）
        if (item.product_allergies && item.product_allergies.length > 0) {
          // デバッグ: product_allergiesの構造を確認
          console.log('=== 店舗:', storeName, '===');
          console.log('product_allergies全体:', item.product_allergies);
          console.log('product_allergies件数:', item.product_allergies.length);
          console.log('最初のmatrix要素:', item.product_allergies[0]);
          console.log('選択されたアレルギー:', selectedAllergies);
          
          // product_allergiesの全要素を処理
          item.product_allergies.forEach((matrix, index) => {
            // 商品名の優先順位: product_allergies_matrix.menu_name > product_title > name > デフォルト
            const menuName = (item.product_allergies_matrix && item.product_allergies_matrix[0] && item.product_allergies_matrix[0].menu_name)
              || item.product_title
              || item.name
              || (item?.related_product?.product_title)
              || (item?.related_product?.name)
              || `商品${index + 1}`;
            console.log(`商品${index + 1}:`, menuName, 'matrix:', matrix);
            
            // アレルギー検索条件に適合するかチェック
            const isAllergyCompatible = checkAllergyCompatibility(matrix, selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch);
            console.log(`🔍 アレルギー適合性チェック - ${menuName}:`, isAllergyCompatible);
            
            // アレルギー検索条件に適合する商品のみを追加
            if (isAllergyCompatible) {
              // 不明な商品のチェック
              if (!matrix.menu_name) {
                console.warn(`⚠️ 不明な商品発見: matrix.menu_nameがnull/undefined - 商品${index + 1}として表示`);
              }
              
              // 同じ商品名で異なるアレルギー情報があるかチェック
              const existingProduct = stores[storeName].menu_items.find(item => item.name === menuName);
              if (existingProduct) {
                console.log(`🔄 同じ商品名発見: ${menuName} - 既存のアレルギー情報と新しい情報を比較`);
                console.log('既存のmatrix:', existingProduct.product_allergies);
                console.log('新しいmatrix:', matrix);
              }
              
              stores[storeName].menu_items.push({
                name: menuName,
                display_name: (item?.related_product?.product_title) || menuName || (item?.related_product?.name) || menuName,
                product_allergies_matrix: [matrix], // 個別のmatrixを配列で渡す
                image_urls: [
                  item?.related_product?.source_url,
                  item?.related_product?.source_url2
                ].filter(Boolean)
              });
              
              console.log(`✅ アレルギー適合商品追加: ${menuName} to store: ${storeName}`);
            } else {
              console.log(`❌ アレルギー不適合商品除外: ${menuName}`);
            }
          });
          
          console.log('groupedStores - added', stores[storeName].menu_items.length, 'allergy-compatible products to store:', storeName);
        } else if (item.related_product) {
          // product_allergiesがない場合はrelated_productのnameを使用
          // アレルギー検索条件が設定されている場合は警告を表示するが、商品は表示する
          if (selectedAllergies && selectedAllergies.length > 0) {
            console.log('⚠️ アレルギー検索条件あり - 商品情報がないため警告表示:', item.related_product.product_title || item.related_product.name);
          }
          
          // 商品名の優先順位: product_title > name
          const productName = item.related_product.product_title || item.related_product.name;
          
          stores[storeName].menu_items.push({
            name: productName,
            display_name: productName,
            product_allergies_matrix: [],
            image_urls: [
              item?.related_product?.source_url,
              item?.related_product?.source_url2
            ].filter(Boolean),
            // アレルギー情報がない場合は警告フラグを設定
            hasAllergyInfo: false
          });
          console.log('groupedStores - added related product:', productName, 'to store:', storeName);
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

    // 商品がない店舗を除外
    const result = Object.values(stores).filter(store => 
      store.menu_items && store.menu_items.length > 0
    );
    
    console.log('groupedStores - final result:', result);
    console.log('groupedStores - stores with products:', result.length);
    console.log('groupedStores - stores with products names:', result.map(s => s.name));
    
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

  // アレルギー成分（直接）も非表示指定（included/trace）も選択していない場合のみ全件表示
  if (selectedAllergies.length === 0 && (selectedFragranceForSearch?.length || 0) === 0 && (selectedTraceForSearch?.length || 0) === 0) {
    return (
      <div className="space-y-6">
        {/* 検索条件表示 */}
        <div className="bg-gray-50 p-3 text-sm text-gray-600">
          アレルギー成分を選択していないため、全ての商品を表示しています
        </div>

      {/* 店舗リスト */}
      {groupedStores.slice(0, visibleCount).map((store, index) => {
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
                    <span className="text-xs text-gray-500">({allProducts.length}件)</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {expandedStores.has(store.name) ? '閉じる' : '開く'} {expandedStores.has(store.name) ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {/* 商品リスト */}
              {expandedStores.has(store.name) && (
                <div className="p-2">
                  {/* 展開時の上部ボタン（アップロード由来の商品のみ非表示） */}
                  {(() => {
                    const first = (allProducts[0] || {});
                    const hasThumbnail = Array.isArray(first.image_urls) && first.image_urls.length > 0;
                    if (hasThumbnail) return null;
                    return (
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <a
                          href={store.source?.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 text-xs rounded border ${store.source?.url ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                        >
                          アレルギー情報元URL
                        </a>
                        <a
                          href={store.store_list_url || `https://www.google.com/maps/search/${encodeURIComponent(store.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 text-xs rounded border ${store.store_list_url ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                        >
                          エリア情報URL
                        </a>
                      </div>
                    );
                  })()}
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
    <div className="space-y-6" data-testid="search-results">
      

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
        // サムネイル候補（最大2枚）を抽出し、URL妥当性チェック＋重複排除
        const headerPreviewRaw = (safeProductsForHeader[0]?.image_urls || []).slice(0, 2);
        const headerPreview = Array.from(
          new Set(
            headerPreviewRaw.filter(
              (url) => typeof url === 'string' && /^https?:\/\//.test(url)
            )
          )
        );
        // 商品が0件なら会社名ごと非表示
        if (safeProductsForHeader.length === 0) {
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
              ref={(el) => { storeRefs.current[store.name] = el; }}
              id={`store-${encodeURIComponent(store.name)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-medium text-gray-800">{store.name}</h3>
                  <span className="text-xs text-gray-500">({safeProductsForHeader.length}件)</span>
                </div>
                <div className="text-xs text-gray-500">
                  {expandedStores.has(store.name) ? '閉じる' : '開く'} {expandedStores.has(store.name) ? '▼' : '▶'}
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
                          {/* アレルギー情報がない場合の警告表示 */}
                          {product.hasAllergyInfo === false && selectedAllergies && selectedAllergies.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              ⚠️ アレルギー情報未確認
                            </div>
                          )}
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
                  {/* 商品名リストの一番下にリンクボタン（存在するURLのみ表示） */}
                  {(() => {
                    const buttons = [];
                    const sourceUrl = store?.source?.url; // store_locations.source_url 相当
                    const areaUrl = store?.store_list_url; // store_locations.store_list_url 相当
                    if (sourceUrl) {
                      buttons.push({ label: '情報元URL', href: sourceUrl, style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' });
                    }
                    if (areaUrl) {
                      buttons.push({ label: '店舗の位置情報', href: areaUrl, style: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' });
                    }
                    if (buttons.length === 0) {
                      // products.source_url / products.source_url2 に明示的にフォールバック
                      let p1 = null;
                      let p2 = null;
                      for (const sp of safeProducts) {
                        const rp = sp?.related_product || {};
                        if (!p1 && typeof rp.source_url === 'string' && /^https?:\/\//.test(rp.source_url)) {
                          p1 = rp.source_url;
                        }
                        if (!p2 && typeof rp.source_url2 === 'string' && /^https?:\/\//.test(rp.source_url2)) {
                          p2 = rp.source_url2;
                        }
                        if (p1 && p2) break;
                      }
                      // related_product で見つからなければ image_urls からもフォールバック
                      if (!p1 || !p2) {
                        for (const sp of safeProducts) {
                          const imgs = Array.isArray(sp?.image_urls) ? sp.image_urls.filter(u => typeof u === 'string' && /^https?:\/\//.test(u)) : [];
                          if (!p1 && imgs[0]) p1 = imgs[0];
                          if (!p2 && imgs[1]) p2 = imgs[1];
                          if (p1 && p2) break;
                        }
                      }
                      if (p1) buttons.push({ label: '画像１', href: p1, style: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' });
                      if (p2) buttons.push({ label: '画像２', href: p2, style: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' });
                    }
                    if (buttons.length === 0) return null;
                    return (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {buttons.map((b, i) => (
                          <a
                            key={i}
                            href={b.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 text-xs rounded border ${b.style}`}
                          >
                            {b.label}
                          </a>
                        ))}
                      </div>
                    );
                  })()}
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
