import React, { useState, useMemo, useEffect } from 'react';
import * as ReactWindow from 'react-window';
const List = (ReactWindow && (ReactWindow.FixedSizeList || ReactWindow.VariableSizeList)) || null;
import { useRestaurant } from '../context/RestaurantContext';

const AllergySearchResults = ({ items, selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch, allergyOptions }) => {
  console.log('🔍 AllergySearchResults - items props:', items?.length || 0, '件');
  console.log('🔍 AllergySearchResults - items propsサンプル:', items?.[0]);
  console.log('🔍 AllergySearchResults - selectedAllergies props:', selectedAllergies);
  console.log('🔍 AllergySearchResults - selectedAllergies length:', selectedAllergies?.length || 0);

  const { getFilteredItems, isLoading } = useRestaurant();
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
  // マトリクス参照のユーティリティ（soy→soybean 吸収）
  const getMatrixRow = (item) => {
    const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
    if (rows.length === 0) return null;
    if (item.menu_item_id) {
      const exact = rows.find(r => String(r.menu_item_id) === String(item.menu_item_id));
      if (exact) return exact;
    }
    return rows[0];
  };

  const mapAllergenKeyToName = (key) => {
    const slug = key === 'soybean' ? 'soy' : key;
    const found = allergyOptions?.find(a => a.id === key || a.id === slug);
    if (found && found.name) return found.name;
    const fallbackDict = {
      egg: '卵', milk: '乳', wheat: '小麦', buckwheat: 'そば', peanut: '落花生', shrimp: 'えび', crab: 'かに', walnut: 'くるみ',
      almond: 'アーモンド', abalone: 'あわび', squid: 'いか', salmon_roe: 'いくら', orange: 'オレンジ', cashew: 'カシューナッツ', kiwi: 'キウイフルーツ',
      beef: '牛肉', gelatin: 'ゼラチン', sesame: 'ごま', salmon: 'さけ', mackerel: 'さば', soybean: '大豆', chicken: '鶏肉', banana: 'バナナ',
      pork: '豚肉', matsutake: 'まつたけ', peach: 'もも', yam: 'やまいも', apple: 'りんご', macadamia: 'マカダミア'
    };
    return fallbackDict[key] || fallbackDict[slug] || key;
  };

  const getMatrixValue = (item, slug) => {
    const matrix = getMatrixRow(item);
    if (!matrix || Object.keys(matrix).length === 0) return null;
    const key = slug === 'soy' ? 'soybean' : slug;
    return matrix[key] ?? null;
  };

  // 選択アレルギーのマトリクス値をデバッグ表示
  const debugSelectedMatrixValues = (item, selected) => {
    if (!Array.isArray(selected) || selected.length === 0) return;
    const list = selected.map(slug => ({ slug, value: getMatrixValue(item, slug) }));
    console.log('🧩 選択アレルギーのmatrix値:', list);
  };

  const classifyAllergyStatus = (item, selectedAllergies) => {
    const allergies = Array.isArray(item.product_allergies) ? item.product_allergies : [];
    const matrix = getMatrixRow(item); // menu_item_id一致のマトリクス行
    const presence = item && item.presenceBySlug ? item.presenceBySlug : null;
    let hasDirect = false;
    let hasTrace = false;
    let hasFragrance = false;
    let hasNone = false;

    const selectedSet = new Set(selectedAllergies || []);

    // presenceBySlug（事前計算）を最優先、その次にmatrix、最後にproduct_allergies
    if (presence && Object.keys(presence).length > 0) {
      console.log('🔍 classifyAllergyStatus - presence使用:', presence);
      selectedAllergies.forEach(allergy => {
        const key = allergy === 'soy' ? 'soy' : allergy;
        const v = (presence[key] == null ? '' : String(presence[key])).trim().toLowerCase();
        if (v === 'none') {
          hasNone = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: none (presence)`);
        } else if (v === 'trace') {
          hasTrace = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: trace (presence)`);
        } else if (v === 'fragrance') {
          hasFragrance = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: fragrance (presence)`);
        } else if (v === 'direct') {
          hasDirect = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: direct (presence)`);
        }
      });
    } else if (matrix && Object.keys(matrix).length > 0) {
      // product_allergies_matrixテーブルの情報を優先チェック
      console.log('🔍 classifyAllergyStatus - matrix存在チェック:', !!matrix, matrix ? Object.keys(matrix) : 'なし');
      console.log('🔍 classifyAllergyStatus - matrix使用:', matrix);
      debugSelectedMatrixValues(item, selectedAllergies);
      selectedAllergies.forEach(allergy => {
        const raw = getMatrixValue(item, allergy);
        const matrixValue = (raw == null ? '' : String(raw)).trim().toLowerCase();
        if (matrixValue === 'none') {
          hasNone = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: none (matrix)`);
        } else if (matrixValue === 'trace') {
          hasTrace = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: trace (matrix)`);
        } else if (matrixValue === 'fragrance') {
          hasFragrance = true;
          console.log(`🔍 classifyAllergyStatus - ${allergy}: fragrance (matrix)`);
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

    const contaminationAllergies = [];
    const fragranceAllergies = [];

    const matrix = getMatrixRow(item);
    const presence = item && item.presenceBySlug ? item.presenceBySlug : null;
    if (presence && Object.keys(presence).length > 0) {
      const keys = Object.keys(presence);
      const skip = new Set(['id','product_id','menu_item_id','menu_name']);
      keys.forEach(k => {
        if (skip.has(k)) return;
        const value = (presence[k] == null ? '' : String(presence[k])).trim().toLowerCase();
        const displayName = mapAllergenKeyToName(k === 'soy' ? 'soybean' : k);
        if (value === 'trace') {
          contaminationAllergies.push(displayName);
          console.log(`コンタミネーション発見(presence): ${displayName}コンタミネーション`);
        } else if (value === 'fragrance') {
          fragranceAllergies.push(displayName);
          console.log(`香料含有発見(presence): ${displayName}香料に含む`);
        }
      });
      console.log('🟨 trace収集一覧:', contaminationAllergies);
      console.log('🟨 fragrance収集一覧:', fragranceAllergies);
    } else if (matrix && Object.keys(matrix).length > 0) {
      // マトリクス優先で黄色ラベル（trace / fragrance）を作る
      const keys = Object.keys(matrix);
      const skip = new Set(['id','product_id','menu_item_id','menu_name']);
      keys.forEach(k => {
        if (skip.has(k)) return;
        const value = (matrix[k] == null ? '' : String(matrix[k])).trim().toLowerCase();
        const displayName = mapAllergenKeyToName(k);
          if (value === 'trace') {
          contaminationAllergies.push(displayName);
          console.log(`コンタミネーション発見(matrix): ${displayName}コンタミネーション`);
        } else if (value === 'fragrance') {
          fragranceAllergies.push(displayName);
          console.log(`香料含有発見(matrix): ${displayName}香料に含む`);
        }
      });
      console.log('🟨 trace収集一覧:', contaminationAllergies);
      console.log('🟨 fragrance収集一覧:', fragranceAllergies);
    } else {
      // フォールバック: product_allergies配列から黄色ラベルを作る
      const list = Array.isArray(item.product_allergies) ? item.product_allergies : [];
      list.forEach((allergy) => {
        const allergyId = allergy.allergy_item_id;
        const presenceType = allergy.presence_type;
        if (!Array.isArray(selectedAllergies) || !selectedAllergies.includes(allergyId)) return;
        const allergyInfo = allergyOptions.find(a => a.id === allergyId);
        if (!allergyInfo) return;
        if (presenceType === 'trace') {
          contaminationAllergies.push(allergyInfo.name);
          console.log(`コンタミネーション発見(fallback): ${allergyInfo.name}コンタミネーション`);
        } else if (presenceType === 'fragrance' || (presenceType === 'direct' && allergy.notes && allergy.notes.includes('香料'))) {
          fragranceAllergies.push(allergyInfo.name);
          console.log(`香料含有発見(fallback): ${allergyInfo.name}香料に含む`);
        }
      });
    }

    // 表示順はUIのアレルギー項目順（allergyOptions）に揃える
    const orderMap = new Map((allergyOptions || []).map((a, idx) => [a.name, idx]));
    const sortByOrder = (a, b) => (orderMap.get(a) ?? 999) - (orderMap.get(b) ?? 999);
    contaminationAllergies.sort(sortByOrder);
    fragranceAllergies.sort(sortByOrder);

    const result = [];
    if (contaminationAllergies.length > 0) result.push(`${contaminationAllergies.join('、')}コンタミネーション`);
    if (fragranceAllergies.length > 0) result.push(`${fragranceAllergies.join('、')}香料に含む`);
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

  // フローティング「上へ戻る」ボタン
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  // アレルギー未選択時のガイダンス表示
  if (!selectedAllergies || selectedAllergies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-700">アレルギーを選択してください</p>
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    if (isLoading) {
      // ローディング中は「店舗がありません」を出さず、スケルトンを表示
    return (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="flex items-center justify-between">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-12 bg-gray-200 rounded" />
              </div>
              <div className="mt-3 h-10 bg-gray-100 rounded" />
                            </div>
          ))}
                        </div>
                      );
    }
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
                  {(!store.products || store.products.length === 0) ? (
                    <div className="text-xs text-gray-400">該当なし（directのみの可能性）</div>
                  ) : List ? (
                    <List
                      height={Math.min(store.products.length, 8) * 60}
                      itemCount={store.products.length}
                      itemSize={56}
                      width={'100%'}
                    >
                      {({ index, style }) => {
                        const product = store.products[index];
                        return (
                          <div style={style} className="border border-gray-200 rounded p-2">
                            <div className="text-sm text-gray-800 truncate flex items-center gap-1">
                              <span>{product.display_name || product.name}</span>
                            </div>
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
                        );
                      }}
                    </List>
                  ) : (
                    // フォールバック（仮想化不可時）
                    (store.products || []).map((product, i) => (
                      <div key={i} className="border border-gray-200 rounded p-2">
                        <div className="text-sm text-gray-800 truncate flex items-center gap-1">
                          <span>{product.display_name || product.name}</span>
                        </div>
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
                    ))
                  )}
                </div>

                {/* 画像・リンク（メニュー欄の最後） */}
                <div className="mt-3 border-t pt-3">
                  {(() => {
                    // 先頭商品の products.source_url / source_url2 を最優先で参照
                    const fp = firstProduct || {};
                    const rp = fp.related_product || {};
                    const imageCandidates = [
                      // products.source_url / source_url2 は item 直下にも保持
                      rp.source_url,
                      rp.source_url2,
                      fp.source_url,
                      fp.source_url2,
                      ...(Array.isArray(fp.image_urls) ? fp.image_urls : [])
                    ].filter(Boolean);
                    const directImages = Array.from(new Set(imageCandidates));
                    const hasAnyImage = directImages.length > 0;
                    const firstLoc = (rp.store_locations || [])[0] || {};

                    console.log('🧩 image check:', {
                      fpId: fp?.related_product?.id || fp?.id,
                      source_url: rp.source_url || fp.source_url,
                      source_url2: rp.source_url2 || fp.source_url2,
                      directImages,
                      hasAnyImage,
                      storeSource: firstLoc.source_url,
                      storeList: firstLoc.store_list_url
                    });
                    
                    return (
                      <div className="mt-2 text-xs flex items-center gap-3">
                        {hasAnyImage ? (
                          <>
                            {directImages[0] && (
                              <a href={directImages[0]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">画像1</a>
                            )}
                            {directImages[1] && (
                              <a href={directImages[1]} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">画像2</a>
                            )}
                          </>
                        ) : (
                          <>
                            {firstLoc.source_url && (
                              <a href={firstLoc.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">情報元URL</a>
                            )}
                            {firstLoc.store_list_url && (
                              <a href={firstLoc.store_list_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">店舗エリアURL</a>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
                </div>
                )}
                </div>
        );
      })}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="ページ上部へ"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 w-12 h-12 flex items-center justify-center"
          title="上へ戻る"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default AllergySearchResults;