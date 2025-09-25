import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';

const AllergySearchResults = ({ items, selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch, allergyOptions }) => {
  const { getFilteredItems } = useRestaurant();
  
  console.log('🔍 AllergySearchResults - items props:', items?.length || 0, '件');
  console.log('🔍 AllergySearchResults - items propsサンプル:', items?.[0]);

  const filteredItems = getFilteredItems();
  console.log('🔍 AllergySearchResults - getFilteredItems():', filteredItems?.length || 0, '件');
  console.log('🔍 AllergySearchResults - filteredItems:', filteredItems);

  // アレルギー適合性チェック（Typesenseデータ用）
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

    // アレルギー情報をチェック
    let hasSelectedAllergy = false;
    
    item.product_allergies.forEach(allergy => {
      if (selectedAllergies.includes(allergy.allergy_item_id)) {
        if (allergy.presence_type === 'direct') {
          hasSelectedAllergy = true;
          console.log('🔍 アレルギー含有 - 商品を除外:', allergy.allergy_item_id);
        } else if (allergy.presence_type === 'trace') {
          console.log('🔍 アレルギーコンタミネーション - 商品を表示:', allergy.allergy_item_id);
        }
      }
    });
    
    if (hasSelectedAllergy) {
      return false;
    }

    console.log('🔍 アレルギー適合 - 商品を表示');
    return true;
  };

  // アレルギー情報を取得（Typesenseデータ用）
  const getContaminationInfo = (item) => {
    console.log(`🔍 getContaminationInfo 呼び出し - 商品: ${item.name || item.product_title}`);
    
    if (!item.product_allergies || !Array.isArray(item.product_allergies)) {
      console.log(`❌ 商品 ${item.name || item.product_title} にproduct_allergiesがありません`);
      return [];
    }

    const contaminationAllergies = [];
    const fragranceAllergies = [];
    
    item.product_allergies.forEach(allergy => {
      const allergyId = allergy.allergy_item_id;
      const presenceType = allergy.presence_type;
      console.log(`アレルギー確認 - 商品: ${item.name || item.product_title}, アレルギー: ${allergyId}, 含有タイプ: ${presenceType}`);
      
      if (presenceType === 'direct' || presenceType === 'contains') {
        const allergyInfo = allergyOptions.find(a => a.id === allergyId);
        
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
      
      // アレルギー適合性チェック
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
        console.log(`商品名:`, menuName);
        
        // アレルギー情報を取得
        const contaminationInfo = getContaminationInfo(item);
        
        stores[storeName].menu_items.push({
          name: menuName,
          display_name: menuName,
          product_allergies: item.product_allergies || [],
          contamination_info: contaminationInfo,
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
    
    // 商品がない店舗を除外
    const result = Object.values(stores).filter(store => store.menu_items.length > 0);
    console.log('groupedStores - final result:', result);
    console.log('groupedStores - stores with products:', result.length);
    console.log('groupedStores - stores with products names:', result.map(s => s.name));
    
    return result;
  };

  const stores = groupedStores();

  if (!stores || stores.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">店舗が見つかりませんでした</p>
        <p className="text-sm text-gray-400 mt-2">検索条件を変更して再度お試しください</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stores.map((store, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {store.category}
            </span>
          </div>
          
          <div className="space-y-3">
            {store.menu_items.map((menuItem, menuIndex) => (
              <div key={menuIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">{menuItem.display_name}</h4>
                  <span className="text-xs text-gray-500">
                    {menuItem.product_allergies?.length || 0} 件のアレルギー情報
                  </span>
                </div>
                
                {menuItem.contamination_info && menuItem.contamination_info.length > 0 ? (
                  <div className="mt-2">
                    {menuItem.contamination_info.map((info, infoIndex) => (
                      <span 
                        key={infoIndex}
                        className={`inline-block px-2 py-1 rounded-full text-xs mr-2 mb-1 ${
                          info.includes('香料') 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {info}
                      </span>
                    ))}
                  </div>
                ) : menuItem.product_allergies && menuItem.product_allergies.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">アレルギー情報あり（詳細なし）</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">アレルギー情報なし</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllergySearchResults;