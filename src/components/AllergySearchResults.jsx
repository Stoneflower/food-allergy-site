import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../context/RestaurantContext';

const AllergySearchResults = ({ items, selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch, allergyOptions }) => {
  console.log('🔍 AllergySearchResults - items props:', items?.length || 0, '件');
  console.log('🔍 AllergySearchResults - items propsサンプル:', items?.[0]);
  console.log('🔍 AllergySearchResults - selectedAllergies props:', selectedAllergies);
  console.log('🔍 AllergySearchResults - selectedAllergies length:', selectedAllergies?.length || 0);

  const { getFilteredItems } = useRestaurant();
  const filteredItems = getFilteredItems();
  console.log('🔍 AllergySearchResults - getFilteredItems():', filteredItems?.length || 0, '件');
  console.log('🔍 AllergySearchResults - filteredItems:', filteredItems);

  // アレルギー適合性チェック（会社カード表示条件: direct以外のみ表示）
  const checkAllergyCompatibility = (item, selectedAllergies) => {
    console.log('🔍 アレルギー適合性チェック開始:', {
      itemName: item.name,
    selectedAllergies, 
      menuItemsCount: item.menu_items?.length || 0
    });

    // RestaurantContextで既にvw_company_card_eligibleでフィルタリング済みなので、
    // ここではすべての商品を表示（direct以外の商品が1件でもある会社のみが渡されている）
    console.log('🔍 RestaurantContextでフィルタリング済み - 会社カード表示');
    return true;
  };

  // アレルギー除去（safe）/コンタミ（trace）/香料（fragrance）分類
  const classifyAllergyStatus = (item, selectedAllergies) => {
    const allergies = Array.isArray(item.product_allergies) ? item.product_allergies : [];
    const matrix = item.product_allergies_matrix?.[0]; // 最初のマトリクスデータ
    let hasDirect = false;
    let hasTrace = false;
    let hasFragrance = false;
    let hasNone = false;

    const selectedSet = new Set(selectedAllergies || []);

    // product_allergies_matrixテーブルの情報を優先チェック
    console.log('🔍 classifyAllergyStatus - matrix存在チェック:', !!matrix, matrix ? Object.keys(matrix) : 'なし');
    if (matrix && Object.keys(matrix).length > 0) {
      console.log('🔍 classifyAllergyStatus - matrix使用:', matrix);
      selectedAllergies.forEach(allergy => {
        const matrixValue = matrix[allergy];
        if (matrixValue === 'none') {
          hasNone = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: none (matrix)`);
        } else if (matrixValue === 'trace') {
          hasTrace = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: trace (matrix)`);
        } else if (matrixValue === 'direct') {
          hasDirect = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: direct (matrix)`);
        }
      });
    } else {
      // product_allergies_matrixが空の場合は、product_allergiesテーブルをフォールバック
      console.log('🔍 classifyAllergyStatus - product_allergies使用（フォールバック）');
      console.log('⚠️ product_allergies_matrixが空のため、product_allergiesで判定');
      
      // 選択されたアレルギーに対して、該当するアレルギー情報をチェック
      const relevantAllergies = allergies.filter(a => selectedSet.has(a.allergy_item_id));
      console.log(`🔍 選択アレルギー${selectedAllergies.join(',')}に関連するアレルギー情報:`, relevantAllergies.length, '件');
      console.log(`🔍 relevantAllergies詳細:`, relevantAllergies);
      
      if (relevantAllergies.length === 0) {
        // 選択されたアレルギーの情報がない場合は、安全とみなす
        hasNone = true;
        console.log('🔍 選択アレルギーの情報なし - 安全とみなす');
      } else {
        relevantAllergies.forEach(a => {
          console.log(`🔍 アレルギー判定 - ${a.allergy_item_id}: ${a.presence_type}`);
          
          // CSVのアレルギー表の情報のみを使用（強制判定は削除）
          if (a.presence_type === 'direct') {
            // 香料例外：notesに香料が入る場合は香料扱い
            if (a.notes && a.notes.includes('香料')) {
              hasFragrance = true;
              console.log(`🔍 classifyAllergyStatus - ${a.allergy_item_id}: fragrance (notes)`);
            } else {
              hasDirect = true;
              console.log(`🔍 classifyAllergyStatus - ${a.allergy_item_id}: direct (product_allergies)`);
            }
          } else if (a.presence_type === 'trace') {
            hasTrace = true;
            console.log(`🔍 classifyAllergyStatus - ${a.allergy_item_id}: trace (product_allergies)`);
          } else if (a.presence_type === 'fragrance') {
            hasFragrance = true;
            console.log(`🔍 classifyAllergyStatus - ${a.allergy_item_id}: fragrance (product_allergies)`);
          } else if (a.presence_type === 'none') {
            hasNone = true;
            console.log(`🔍 classifyAllergyStatus - ${a.allergy_item_id}: none (product_allergies)`);
          }
        });
      }
    }

    // none/trace/fragranceのいずれかがあれば安全（direct以外）
        const isSafe = hasNone || hasTrace || hasFragrance;
        console.log(`🔍 classifyAllergyStatus - 最終結果: isSafe=${isSafe}, hasNone=${hasNone}, hasTrace=${hasTrace}, hasFragrance=${hasFragrance}, hasDirect=${hasDirect}`);
        console.log(`🔍 商品表示判定: ${!hasDirect && (isSafe || hasTrace || hasFragrance) ? '表示' : '除外'}`);
        return { isSafe, hasTrace, hasFragrance, hasNone, hasDirect };
  };

  // アレルギー情報を取得（選択したアレルギーのみ表示）
  const getContaminationInfo = (item) => {
    // 商品名の優先順位: menu_items.name > product_title > name
    const menuItems = item.menu_items || [];
    const primaryMenuName = menuItems.length > 0 ? menuItems[0].name : null;
    const displayName = primaryMenuName || item.product_title || item.name || '商品名不明';
    
    console.log(`🔍 getContaminationInfo 呼び出し - 商品: ${displayName}`);
    console.log(`🔍 getContaminationInfo - 選択アレルギー:`, selectedAllergies);
    
    if (!item.product_allergies || !Array.isArray(item.product_allergies)) {
      console.log(`❌ 商品 ${displayName} にproduct_allergiesがありません`);
      return [];
    }

    const contaminationAllergies = [];
    const fragranceAllergies = [];
    
    // 選択されたアレルギーのみをチェック
    item.product_allergies.forEach((allergy, index) => {
      const allergyId = allergy.allergy_item_id;
      const presenceType = allergy.presence_type;
      
      // 選択されたアレルギーのみを対象とする
      if (selectedAllergies && selectedAllergies.includes(allergyId)) {
        console.log(`アレルギー確認 - 商品: ${displayName}, アレルギー: ${allergyId}, 含有タイプ: ${presenceType}`);
        
        if (presenceType === 'direct' || presenceType === 'trace' || presenceType === 'none') {
          const allergyInfo = allergyOptions.find(a => a.id === allergyId);
          
          if (allergyInfo) {
            if (presenceType === 'trace') {
              contaminationAllergies.push(allergyInfo.name);
              console.log(`コンタミネーション発見: ${allergyInfo.name}コンタミネーション`);
            } else if (presenceType === 'direct') {
              if (allergy.notes && allergy.notes.includes('香料')) {
                fragranceAllergies.push(allergyInfo.name);
                console.log(`香料含有発見: ${allergyInfo.name}香料に含む`);
              } else {
                // directは黄色ラベルに含めない（表示から除外）
                console.log(`含有発見（表示除外）: ${allergyInfo.name}含有`);
              }
            } else if (presenceType === 'none') {
              console.log(`含有しない確認: ${allergyInfo.name}含有しない`);
            }
            } else {
            console.log(`⚠️ アレルギー情報が見つかりません: ${allergyId}`);
          }
        }
      }
      });

    // 結果をまとめて返す
    const result = [];
    if (contaminationAllergies.length > 0) {
      result.push(`${contaminationAllergies.join('、')}コンタミネーション`);
    }
    if (fragranceAllergies.length > 0) {
      result.push(`${fragranceAllergies.join('、')}香料に含む`);
    }

    console.log(`✅ 商品 ${displayName} の最終結果:`, result);
    return result;
  };

  // Typesenseデータ用の店舗グループ化（アレルギー情報対応）
  const groupedStores = () => {
    console.log('groupedStores - filteredItems processing:', filteredItems);
    
    const stores = {};
    
    filteredItems.forEach((item, index) => {
      console.log(`groupedStores - processing item ${index}:`, item);
      
      // 会社名・店舗名を決定（item.name を会社名として使用）
      const companyName = item.name || item.brand || item.product_title || `会社${index + 1}`;
      console.log('groupedStores - companyName:', companyName);
      // デバッグ: AllergySearchResults.jsxで受け取った最終item
      console.log('📄 item全体の構造:', item);
      
      // 会社が存在しない場合は作成
      if (!stores[companyName]) {
        stores[companyName] = {
          name: companyName,
          category: item.category || '不明',
          products: []
        };
      }
        
      // アレルギー適合性チェック（会社カード表示条件）
      const isAllergyCompatible = checkAllergyCompatibility(item, selectedAllergies);
      
      if (isAllergyCompatible) {
        console.log('=== 会社:', companyName, '===');
        console.log('商品情報:', { 
          name: item?.name, 
          product_name: item?.product_name,
          product_title: item?.product_title,
          hasAllergies: !!item?.product_allergies?.length
        });
        
        // 商品名は既にproduct_nameに設定されている（menu_item.name）
        const productName = item.product_name || item.name || '商品名なし';
        console.log(`🔍 商品名デバッグ - item.product_name:`, item.product_name);
        console.log(`🔍 商品名デバッグ - item.menu_items:`, item.menu_items);
        console.log(`🔍 商品名デバッグ - item.product_title:`, item.product_title);
        console.log(`🔍 商品名デバッグ - item.name:`, item.name);
        console.log(`🔍 商品名デバッグ - 最終的なproductName:`, productName);
        
        // アレルギー情報を取得（バッジ表示用）
        const contaminationInfo = getContaminationInfo(item);

        // safe/trace/fragrance分類
        const cls = classifyAllergyStatus(item, selectedAllergies);

        // デバッグ: 乳選択時の商品判定ログ
        if (selectedAllergies && selectedAllergies.includes('milk')) {
          console.log(`🔍 乳選択時デバッグ - 商品: ${productName}`, {
            hasDirect: cls.hasDirect,
            isSafe: cls.isSafe,
            hasTrace: cls.hasTrace,
            hasFragrance: cls.hasFragrance,
            product_allergies: item.product_allergies?.filter(a => a.allergy_item_id === 'milk')
          });
        }

        // 会社カードが表示される場合、directを含む商品は除外し、none/trace/fragranceを表示
        if (!cls.hasDirect && (cls.isSafe || cls.hasTrace || cls.hasFragrance)) {
          stores[companyName].products.push({
            name: productName,
            display_name: productName,
            product_allergies: item.product_allergies || [],
            contamination_info: contaminationInfo,
            classify: cls,
            image_urls: [
              item?.source_url,
              item?.source_url2,
              item?.image_url
            ].filter(Boolean),
            related_product: item
          });
          console.log('groupedStores - added product with allergies:', productName, 'to company:', companyName);
        } else {
          console.log(`❌ direct商品除外 or 不適合: ${productName} (hasDirect=${cls.hasDirect}, isSafe=${cls.isSafe}, hasTrace=${cls.hasTrace}, hasFragrance=${cls.hasFragrance})`);
        }
        } else {
        console.log(`❌ アレルギー不適合商品除外: ${item.name}`);
      }
    });
    
    // 会社カードはRestaurantContext側のeligible判定で担保される
    const result = Object.values(stores).map(store => {
      const safe = store.products.filter(p => p.classify?.isSafe);
      const trace = store.products.filter(p => p.classify?.hasTrace);
      const fragrance = store.products.filter(p => p.classify?.hasFragrance);
      return { ...store, safe_items: safe, trace_items: trace, fragrance_items: fragrance };
    });
    console.log('groupedStores - final result:', result);
    console.log('groupedStores - stores with products:', result.length);
    console.log('groupedStores - stores with products names:', result.map(s => s.name));
    
    return result;
  };

  const stores = groupedStores();
  const [expanded, setExpanded] = useState({});
  const toggleStore = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  if (!stores || stores.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">店舗が見つかりませんでした</p>
        <p className="text-sm text-gray-400 mt-2">検索条件を変更して再度お試しください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stores.map((store, index) => {
        const firstProduct = store.products?.[0];
        // 画像/リンク 優先: products.source_url/source_url2 → fallback store_locations
        const imageUrls = Array.from(new Set((store.products || []).flatMap(p => p.image_urls || []))).slice(0, 2);
        const evidenceUrl = firstProduct?.image_urls?.[0];
        const storeListUrl = firstProduct?.store_list_url || firstProduct?.related_product?.store_list_url;
        
        // store_locationsからも画像・リンクを取得
        const storeLocations = firstProduct?.related_product?.store_locations || [];
        const storeSourceUrls = storeLocations.flatMap(sl => [sl.source_url, sl.store_list_url]).filter(Boolean);
        const allUrls = [...imageUrls, ...storeSourceUrls].filter(Boolean);
        
        // デバッグ: データ構造確認
        console.log('🔍 画像・リンク表示デバッグ:', {
          storeName: store.name,
          firstProduct: firstProduct,
          imageUrls: imageUrls,
          storeListUrl: storeListUrl,
          storeLocations: storeLocations,
          storeSourceUrls: storeSourceUrls,
          allUrls: allUrls,
          relatedProduct: firstProduct?.related_product
        });
        const isOpen = !!expanded[store.name];

        return (
          <div 
            key={index}
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => toggleStore(store.name)}
            >
              <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {store.name}
                <span className="text-sm text-gray-600 ml-2">({store.products.length})</span>
              </h3>
              <span className="text-sm text-gray-500">
                {isOpen ? '閉じる' : '開く'}
                  </span>
                </div>

            {isOpen && (
              <div className="mt-3 space-y-3">
                {/* 単一リスト（コンパクト）。商品名下に黄色テキストを表示 */}
                <div className="space-y-2">
                  {(store.products || []).map((product, i) => (
                    <div key={i} className="border border-gray-200 rounded p-2">
                      <div className="text-sm text-gray-800 truncate">{product.display_name || product.name}</div>
                      {product.contamination_info?.length > 0 && (
                        <div className="mt-1 space-x-1">
                          {product.contamination_info.map((info, infoIndex) => (
                            <span key={infoIndex} className="inline-block text-xs text-yellow-700 bg-yellow-100 px-1 rounded">
                              {info}
                            </span>
                      ))}
                    </div>
                  )}

                          </div>
                  ))}
                  {(!store.products || store.products.length === 0) && (
                    <div className="text-xs text-gray-400">該当なし（directのみの可能性）</div>
                  )}
                </div>

                {/* 画像・リンク（メニュー欄の最後） */}
                <div className="mt-3 border-t pt-3">
                  {(() => {
                    // 全商品から画像・リンクを収集
                    const allImages = [];
                    const allStoreUrls = [];
                    
                    store.products.forEach(product => {
                      // products.source_url / source_url2 を商品画像として収集
                      if (product.image_urls && product.image_urls.length > 0) {
                        allImages.push(...product.image_urls);
                      }
                      
                      // store_locations から URL を収集
                      const locations = product?.related_product?.store_locations || [];
                      locations.forEach(sl => {
                        if (sl.source_url) allStoreUrls.push(sl.source_url);
                        if (sl.store_list_url) allStoreUrls.push(sl.store_list_url);
                      });
                    });
                    
                    // 重複除去
                    const uniqueImages = Array.from(new Set(allImages));
                    const uniqueStoreUrls = Array.from(new Set(allStoreUrls));
                    
                    // 表示用URL配列（商品画像優先、なければstore_locations）
                    const displayUrls = uniqueImages.length > 0 ? uniqueImages : uniqueStoreUrls;
                    
                    return (
                      <>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {displayUrls.slice(0, 2).map((url, idx) => (
                            <img key={idx} src={url} alt="evidence" className="h-12 w-12 object-cover rounded border" />
                          ))}
                          </div>
                        <div className="mt-2 space-x-3 text-xs">
                          {displayUrls.length > 0 && (
                            <a href={displayUrls[0]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                              {uniqueImages.length > 0 ? '商品画像' : 'アレルギー情報元'}
                            </a>
                          )}
                          {displayUrls.length > 1 && (
                            <a href={displayUrls[1]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">店舗エリアURL</a>
                          )}
                          {displayUrls.length === 0 && (
                            <span className="text-gray-400">画像・リンクなし</span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                </div>
                )}
                </div>
        );
      })}
    </div>
  );
};

export default AllergySearchResults;