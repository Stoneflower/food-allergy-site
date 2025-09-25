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

  // アレルギー適合性チェック（詳細表示用: directも含めて表示）
  const checkAllergyCompatibility = (item, selectedAllergies) => {
    console.log('🔍 アレルギー適合性チェック開始:', {
      itemName: item.name || item.product_title,
      selectedAllergies
    });

    // アレルギー検索条件が設定されていない場合は、すべての商品を表示
    if (!selectedAllergies || selectedAllergies.length === 0) {
      console.log('🔍 アレルギー検索条件なし - すべての商品を表示');
      return true;
    }

    // Typesenseから取得したデータにアレルギー情報があるかチェック
    if (!item.product_allergies || !Array.isArray(item.product_allergies)) {
      console.log('⚠️ アレルギー情報なし - 警告表示するが商品は表示');
      return true;
    }

    // アレルギー情報をチェック（directも含めて表示）
    let hasSelectedAllergy = false;
    
    item.product_allergies.forEach(allergy => {
      if (selectedAllergies.includes(allergy.allergy_item_id)) {
        hasSelectedAllergy = true;
        if (allergy.presence_type === 'direct') {
          console.log('🔍 アレルギー含有 - 商品を表示（direct）:', allergy.allergy_item_id);
        } else if (allergy.presence_type === 'trace') {
          console.log('🔍 アレルギーコンタミネーション - 商品を表示:', allergy.allergy_item_id);
        } else if (allergy.presence_type === 'none') {
          console.log('🔍 アレルギー含有しない - 商品を表示:', allergy.allergy_item_id);
        }
      }
    });
    
    // 選択アレルギーに関連する商品はすべて表示（direct/trace/none問わず）
    if (hasSelectedAllergy) {
      console.log('🔍 選択アレルギー関連商品 - 表示');
      return true;
    }

    console.log('🔍 アレルギー適合 - 商品を表示');
    return true;
  };

  // アレルギー除去（safe）/コンタミ（trace）/香料（fragrance）分類
  const classifyAllergyStatus = (item, selectedAllergies) => {
    const allergies = Array.isArray(item.product_allergies) ? item.product_allergies : [];
    let hasDirect = false;
    let hasTrace = false;
    let hasFragrance = false;

    const selectedSet = new Set(selectedAllergies || []);

    allergies.forEach(a => {
      if (!selectedSet.has(a.allergy_item_id)) return;
      if (a.presence_type === 'direct') {
        // 香料例外：notesに香料が入る場合は香料扱い
        if (a.notes && a.notes.includes('香料')) {
          hasFragrance = true;
        } else {
          hasDirect = true;
        }
      } else if (a.presence_type === 'trace') {
        hasTrace = true;
      }
    });

    const isSafe = !hasDirect && !hasTrace && !hasFragrance;
    return { isSafe, hasTrace, hasFragrance };
  };

  // アレルギー情報を取得（Typesenseデータ用）
  const getContaminationInfo = (item) => {
    console.log(`🔍 getContaminationInfo 呼び出し - 商品: ${item.name || item.product_title}`);
    console.log(`🔍 getContaminationInfo - 商品の全プロパティ:`, Object.keys(item));
    console.log(`🔍 getContaminationInfo - product_allergies の値:`, item.product_allergies);
    console.log(`🔍 getContaminationInfo - product_allergies の型:`, typeof item.product_allergies);
    console.log(`🔍 getContaminationInfo - product_allergies は配列か:`, Array.isArray(item.product_allergies));
    
    if (!item.product_allergies || !Array.isArray(item.product_allergies)) {
      console.log(`❌ 商品 ${item.name || item.product_title} にproduct_allergiesがありません`);
      console.log(`❌ 商品 ${item.name || item.product_title} の全プロパティ:`, Object.keys(item));
      return [];
    }

    console.log(`🔍 getContaminationInfo - product_allergies配列の長さ: ${item.product_allergies.length}`);
    if (item.product_allergies.length > 0) {
      console.log(`🔍 getContaminationInfo - 最初の要素の詳細:`, item.product_allergies[0]);
      console.log(`🔍 getContaminationInfo - 最初の要素のキー:`, Object.keys(item.product_allergies[0]));
      console.log(`🔍 getContaminationInfo - 最初の要素のJSON:`, JSON.stringify(item.product_allergies[0], null, 2));
      
      // 最初の3つの要素を詳しく確認
      for (let i = 0; i < Math.min(3, item.product_allergies.length); i++) {
        console.log(`🔍 getContaminationInfo - 要素${i}の詳細:`, {
          element: item.product_allergies[i],
          keys: Object.keys(item.product_allergies[i]),
          values: Object.values(item.product_allergies[i])
        });
      }
      
      // 実際のプロパティ名を確認
      const firstElement = item.product_allergies[0];
      console.log(`🔍 getContaminationInfo - 実際のプロパティ名:`, Object.keys(firstElement));
      console.log(`🔍 getContaminationInfo - 実際の値:`, Object.values(firstElement));
      
      // 期待されるプロパティ名を試す
      const possibleKeys = ['allergy_item_id', 'allergy_item', 'item_id', 'id', 'allergy_id'];
      const possiblePresenceKeys = ['presence_type', 'presence', 'type', 'status'];
      
      possibleKeys.forEach(key => {
        if (firstElement[key]) {
          console.log(`🔍 getContaminationInfo - 発見: ${key} = ${firstElement[key]}`);
        }
      });
      
      possiblePresenceKeys.forEach(key => {
        if (firstElement[key]) {
          console.log(`🔍 getContaminationInfo - 発見: ${key} = ${firstElement[key]}`);
        }
      });
    }

    const contaminationAllergies = [];
    const fragranceAllergies = [];
    
    item.product_allergies.forEach((allergy, index) => {
      console.log(`🔍 getContaminationInfo - アレルギー要素${index}:`, allergy);
      
      const allergyId = allergy.allergy_item_id;
      const presenceType = allergy.presence_type;
      console.log(`アレルギー確認 - 商品: ${item.name || item.product_title}, アレルギー: ${allergyId}, 含有タイプ: ${presenceType}`);
      
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
              contaminationAllergies.push(allergyInfo.name);
              console.log(`含有発見: ${allergyInfo.name}含有`);
            }
          } else if (presenceType === 'none') {
            console.log(`含有しない確認: ${allergyInfo.name}含有しない`);
          }
        } else {
          console.log(`⚠️ アレルギー情報が見つかりません: ${allergyId}`);
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

    console.log(`✅ 商品 ${item.name || item.product_title} の最終結果:`, result);
    return result;
  };

  // Typesenseデータ用の店舗グループ化（アレルギー情報対応）
  const groupedStores = () => {
    console.log('groupedStores - filteredItems processing:', filteredItems);
    
    const stores = {};
    
    filteredItems.forEach((item, index) => {
      console.log(`groupedStores - processing item ${index}:`, item);
      
      // 店舗名を決定（Typesenseデータ用）
      const storeName = item.store_name || item.company_name || item.name || `店舗${index + 1}`;
      console.log('groupedStores - storeName:', storeName);
      
      // 店舗が存在しない場合は作成
        if (!stores[storeName]) {
          stores[storeName] = {
            name: storeName,
          category: item.category || '不明',
            menu_items: []
          };
        }
        
      // アレルギー適合性チェック（会社カード表示条件）
      const isAllergyCompatible = checkAllergyCompatibility(item, selectedAllergies);
      
      if (isAllergyCompatible) {
          console.log('=== 店舗:', storeName, '===');
        console.log('商品情報:', { 
          name: item.name, 
          product_title: item.product_title,
          hasAllergies: !!item.product_allergies?.length
        });
        
        // 商品名の優先順位: product_title > name
        const menuName = item.product_title || item.name || '商品名不明';
        console.log(`🔍 商品名デバッグ - item.product_title:`, item.product_title);
        console.log(`🔍 商品名デバッグ - item.name:`, item.name);
        console.log(`🔍 商品名デバッグ - 最終的なmenuName:`, menuName);
        
        // アレルギー情報を取得（バッジ表示用）
        const contaminationInfo = getContaminationInfo(item);

        // safe/trace/fragrance分類
        const cls = classifyAllergyStatus(item, selectedAllergies);

        stores[storeName].menu_items.push({
              name: menuName,
          display_name: menuName,
          product_allergies: item.product_allergies || [],
          contamination_info: contaminationInfo,
          classify: cls,
              image_urls: [
            item?.source_url,
            item?.source_url2,
            item?.image_url
              ].filter(Boolean)
            });
        console.log('groupedStores - added product with allergies:', menuName, 'to store:', storeName);
        } else {
        console.log(`❌ アレルギー不適合商品除外: ${item.name || item.product_title}`);
      }
    });
    
    // 会社カードはRestaurantContext側のeligible判定で担保される
    const result = Object.values(stores).map(store => {
      const safe = store.menu_items.filter(m => m.classify?.isSafe);
      const trace = store.menu_items.filter(m => m.classify?.hasTrace);
      const fragrance = store.menu_items.filter(m => m.classify?.hasFragrance);
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
        const firstItem = store.menu_items?.[0];
        // 画像/リンク 優先: products.source_url/source_url2 → fallback store_locations
        const imageUrls = Array.from(new Set((store.menu_items || []).flatMap(m => m.image_urls || []))).slice(0, 2);
        const evidenceUrl = firstItem?.image_urls?.[0];
        const storeListUrl = firstItem?.store_list_url || firstItem?.related_product?.store_list_url;
        
        // store_locationsからも画像・リンクを取得
        const storeLocations = firstItem?.related_product?.store_locations || [];
        const storeSourceUrls = storeLocations.flatMap(sl => [sl.source_url, sl.store_list_url]).filter(Boolean);
        const allUrls = [...imageUrls, ...storeSourceUrls].filter(Boolean);
        
        // デバッグ: データ構造確認
        console.log('🔍 画像・リンク表示デバッグ:', {
          storeName: store.name,
          firstItem: firstItem,
          imageUrls: imageUrls,
          storeListUrl: storeListUrl,
          storeLocations: storeLocations,
          storeSourceUrls: storeSourceUrls,
          allUrls: allUrls,
          relatedProduct: firstItem?.related_product
        });
        const isOpen = !!expanded[store.name];

        return (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800 truncate">{store.name}</h3>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => toggleStore(store.name)}
              >
                {isOpen ? '閉じる' : '開く'}
              </button>
            </div>

            {isOpen && (
              <div className="mt-3 space-y-3">
                {/* 単一リスト（コンパクト）。商品名下に黄色テキストを表示 */}
                <div className="space-y-2">
                  {(store.menu_items || []).map((menuItem, i) => (
                    <div key={i} className="border border-gray-200 rounded p-2">
                      <div className="text-sm text-gray-800 truncate">{menuItem.display_name || menuItem.name}</div>
                      {menuItem.contamination_info?.length > 0 && (
                        <div className="mt-1 space-x-1">
                          {menuItem.contamination_info.map((info, infoIndex) => (
                            <span key={infoIndex} className="inline-block text-xs text-yellow-700">
                              {info}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!store.menu_items || store.menu_items.length === 0) && (
                    <div className="text-xs text-gray-400">該当なし（directのみの可能性）</div>
                  )}
                </div>

                {/* 画像・リンク（フッター） */}
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {allUrls.slice(0, 2).map((u, i) => (
                      <img key={i} src={u} alt="evidence" className="h-12 w-12 object-cover rounded border" />
                    ))}
                  </div>
                  <div className="mt-2 space-x-3 text-xs">
                    {allUrls.length > 0 && (
                      <a href={allUrls[0]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {imageUrls.length > 0 ? '商品画像（証拠）' : 'アレルギー情報元'}
                      </a>
                    )}
                    {allUrls.length > 1 && (
                      <a href={allUrls[1]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">店舗エリアURL</a>
                    )}
                    {allUrls.length === 0 && (
                      <span className="text-gray-400">画像・リンクなし</span>
                    )}
                  </div>
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