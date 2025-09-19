import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }) => {
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [allergyMaster, setAllergyMaster] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userSettings, setUserSettings] = useState({
    selectedAllergies: [],
    allowTrace: false,
    allowHeated: true,
    severityLevel: 'medium'
  });

  // 法定8品目（特定原材料）- 表示義務
  const mandatoryAllergies = [
    { id: 'egg', name: '卵', icon: '🥚' },
    { id: 'milk', name: '乳', icon: '🥛' },
    { id: 'wheat', name: '小麦', icon: '🌾' },
    { id: 'buckwheat', name: 'そば', icon: '🍜' },
    { id: 'peanut', name: '落花生', icon: '🥜' },
    { id: 'shrimp', name: 'えび', icon: '🦐' },
    { id: 'crab', name: 'かに', icon: '🦀' },
    { id: 'walnut', name: 'くるみ', icon: '🌰' }
  ];

  // 推奨20品目（特定原材料に準ずるもの）- 表示推奨
  const recommendedAllergies = [
    { id: 'almond', name: 'アーモンド', icon: '🌰' },
    { id: 'abalone', name: 'あわび', icon: '🐚' },
    { id: 'squid', name: 'いか', icon: '🦑' },
    { id: 'salmon_roe', name: 'いくら', icon: '🟠' },
    { id: 'orange', name: 'オレンジ', icon: '🍊' },
    { id: 'cashew', name: 'カシューナッツ', icon: '🥜' },
    { id: 'kiwi', name: 'キウイフルーツ', icon: '🥝' },
    { id: 'beef', name: '牛肉', icon: '🥩' },
    { id: 'gelatin', name: 'ゼラチン', icon: '🍮' },
    { id: 'sesame', name: 'ごま', icon: '🌱' },
    { id: 'salmon', name: 'さけ', icon: '🐟' },
    { id: 'mackerel', name: 'さば', icon: '🐟' },
    { id: 'soy', name: '大豆', icon: '🟤' },
    { id: 'chicken', name: '鶏肉', icon: '🐔' },
    { id: 'banana', name: 'バナナ', icon: '🍌' },
    { id: 'pork', name: '豚肉', icon: '🥓' },
    { id: 'matsutake', name: 'まつたけ', icon: '🍄' },
    { id: 'peach', name: 'もも', icon: '🍑' },
    { id: 'yam', name: 'やまいも', icon: '🍠' },
    { id: 'apple', name: 'りんご', icon: '🍎' }
  ];

  const allergyOptions = [...mandatoryAllergies, ...recommendedAllergies];

  const categories = [
    { id: 'all', name: '全て', icon: '🔍' },
    { id: 'restaurants', name: 'レストラン', icon: '🍽️' },
    { id: 'products', name: 'テイクアウト', icon: '🛒' },
    { id: 'supermarkets', name: 'スーパー', icon: '🏪' },
    { id: 'online', name: 'ネットショップ', icon: '📦' }
  ];

  // サンプルデータを削除 - Supabaseデータのみを使用

  // 共有（DB）から取得した商品
  const [dbProducts, setDbProducts] = useState([]);

  // サンプル商品データを削除 - Supabaseデータのみを使用
  const products = [];

  const supermarkets = [];

  const onlineShops = [];

  // Supabase から最近の共有商品を取得（メニューとアレルギー情報も含む）
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // 効率的なJOINクエリでデータを一括取得（store_locationsは別取得で補完）
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            menu_items (
              *,
              menu_item_allergies (
                *,
                allergy_items (name, icon)
              )
            ),
            product_allergies_matrix (*)
          `)
          .order('id', { ascending: false });
        
        if (error) throw error;
        
        const mapped = (data || []).map((p) => {
          const catRaw = (p.category || '').toString().toLowerCase();
          const normalizedCategory = catRaw.includes('レストラン') || catRaw.includes('restaurant')
            ? 'restaurants'
            : (catRaw.includes('super') || catRaw.includes('スーパー'))
              ? 'supermarkets'
              : (catRaw.includes('online') || catRaw.includes('ネット'))
                ? 'online'
                : 'restaurants';
          
          const isBikkuri = (p.name || '').includes('びっくりドンキー');
          const imageUrl = 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600';
          
          return {
            id: `db_${p.id}`,
            name: p.name,
            image: imageUrl,
            price: '',
            brand: p.brand || '',
            category: normalizedCategory,
            type: p.category || '共有商品',
            description: 'みんなが共有した商品',
      rating: 4.5,
            reviewCount: 0,
            availability: { online: [] },
            allergyFree: [],
            source: { type: 'community', contributor: '共有', lastUpdated: new Date().toISOString(), confidence: 80, verified: false },
            menuItems: p.menu_items || [],
            storeLocations: [], // 後で補完
            allergyMatrix: p.product_allergies_matrix || [],
      allergyInfo: {
              egg: false, milk: false, wheat: false, buckwheat: true,
              peanut: true, shrimp: true, crab: true, walnut: true,
              almond: true, abalone: true, squid: true, salmon_roe: true,
              orange: true, cashew: true, kiwi: true, beef: true,
              gelatin: true, sesame: true, salmon: true, mackerel: true,
              soy: true, chicken: true, banana: true, pork: true,
              matsutake: true, peach: true, yam: true, apple: true
            }
          };
        });

        const pidList = (data || []).map(p => p.id);
        let storeLocationsByProduct = new Map();
        if (pidList.length > 0) {
          const { data: locs, error: locErr } = await supabase
            .from('store_locations')
            .select('*')
            .in('product_id', pidList);
          if (locErr) {
            console.warn('store_locations fetch failed:', locErr.message);
          } else {
            for (const loc of locs || []) {
              const arr = storeLocationsByProduct.get(loc.product_id) || [];
              arr.push(loc);
              storeLocationsByProduct.set(loc.product_id, arr);
            }
          }
        }

        const merged = mapped.map(m => {
          const pid = Number(m.id.slice(3));
          return { ...m, storeLocations: storeLocationsByProduct.get(pid) || [] };
        });
        
        console.log('Supabase products loaded:', merged.length, 'items');
        console.log('Loaded products:', merged.map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category,
          menuItems: p.menuItems?.length || 0,
          storeLocations: p.storeLocations?.length || 0,
          allergyMatrix: p.allergyMatrix?.length || 0
        })));
        
        const bikkuriDonkey = merged.find(p => p.name && p.name.includes('びっくりドンキー'));
        if (bikkuriDonkey) {
          console.log('✅ びっくりドンキーが見つかりました:', bikkuriDonkey);
        } else {
          console.log('❌ びっくりドンキーが見つかりませんでした');
        }
        
        setDbProducts(merged);
      } catch (e) {
        console.error('Supabase products fetch failed:', e);
        console.error('Error details:', {
          message: e.message,
          details: e.details,
          hint: e.hint,
          code: e.code
        });
        setDbProducts([]);
      }
    };
    loadProducts();
  }, []);

  // アレルギーマスタ（表示名/アイコン/並び）
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('allergy_items')
          .select('slug,name,icon,sort_order')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setAllergyMaster(data || []);
      } catch (e) {
        console.warn('allergy master load failed:', e.message);
        setAllergyMaster([]);
      }
    })();
  }, []);

  // 統合データ（Supabaseデータのみを使用）
  const allItems = [...dbProducts];

  // 選択アレルギーに対して、安全メニューを持つ product_id を事前計算
  const [safeProductIds, setSafeProductIds] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        if (!Array.isArray(dbProducts) || dbProducts.length === 0) {
          setSafeProductIds(new Set());
          return;
        }
        if (!Array.isArray(selectedAllergies) || selectedAllergies.length === 0) {
          setSafeProductIds(null);
          return;
        }

        const pidList = dbProducts
          .filter(p => typeof p.id === 'string' && p.id.startsWith('db_'))
          .map(p => Number(p.id.slice(3)));
        if (pidList.length === 0) {
          setSafeProductIds(new Set());
          return;
        }

        // menu_item_allergiesから直接安全判定（direct/trace/noneを正しく処理）
        const { data: allergyData, error: allergyError } = await supabase
          .from('menu_item_allergies')
          .select(`
            menu_item_id,
            allergy_item_slug,
            presence_type,
            menu_items!inner(product_id, name)
          `)
          .in('menu_items.product_id', pidList)
          .in('allergy_item_slug', selectedAllergies);
        
        if (allergyError) throw allergyError;

        // 各商品の安全メニューをチェック
        const byProduct = new Map(); // pid -> array of menu allergy records
        for (const record of allergyData || []) {
          const pid = record.menu_items.product_id;
          const arr = byProduct.get(pid) || [];
          arr.push({
            menuName: record.menu_items.name,
            allergen: record.allergy_item_slug,
            presenceType: record.presence_type
          });
          byProduct.set(pid, arr);
        }

        const okProducts = new Set();
        for (const pid of pidList) {
          const productAllergies = byProduct.get(pid) || [];
          
          // この商品に選択されたアレルギーが含まれているかチェック
          let hasUnsafeMenu = false;
          for (const allergy of productAllergies) {
            if (allergy.presenceType === 'direct') {
              hasUnsafeMenu = true;
              console.log('🚫 直接含有メニュー発見:', {
                productId: pid,
                menuName: allergy.menuName,
                allergen: allergy.allergen,
                presenceType: allergy.presenceType
              });
              break;
            } else if (allergy.presenceType === 'trace') {
              // コンタミネーション（trace）は表示する（ユーザーが判断）
              console.log('⚠️ コンタミネーション含有メニュー（表示対象）:', {
                productId: pid,
                menuName: allergy.menuName,
                allergen: allergy.allergen,
                presenceType: allergy.presenceType,
                note: 'ユーザーが判断してください'
              });
            }
          }
          
          if (!hasUnsafeMenu) {
            okProducts.add(pid);
            const traceMenus = productAllergies.filter(a => a.presenceType === 'trace');
            if (traceMenus.length > 0) {
              console.log('✅ 安全商品（コンタミネーション含む）:', {
                productId: pid,
                traceMenusCount: traceMenus.length,
                traceAllergens: traceMenus.map(t => t.allergen),
                totalMenus: productAllergies.length,
                note: 'コンタミネーションは表示されます'
              });
            } else {
              console.log('✅ 完全安全商品:', {
                productId: pid,
                totalMenus: productAllergies.length,
                note: 'アレルギー含有なし'
              });
            }
          }
        }

        setSafeProductIds(okProducts);
        console.log('✅ safeProductIds computed via matrix:', okProducts.size);
      } catch (e) {
        console.warn('safeProductIds compute failed:', e.message);
        setSafeProductIds(new Set());
      }
    })();
  }, [JSON.stringify(dbProducts.map(p => p.id)), JSON.stringify(selectedAllergies)]);

  // お気に入り機能
  const toggleFavorite = (itemId, category) => {
    const favoriteId = `${category}-${itemId}`;
    setFavorites(prev =>
      prev.includes(favoriteId)
        ? prev.filter(id => id !== favoriteId)
        : [...prev, favoriteId]
    );
  };

  const isFavorite = (itemId, category) => {
    const favoriteId = `${category}-${itemId}`;
    return favorites.includes(favoriteId);
  };

  // 履歴機能
  const addToHistory = (item) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== item.id || h.category !== item.category);
      return [{ ...item, viewedAt: new Date() }, ...newHistory].slice(0, 10);
    });
  };

  // 商品更新機能
  const updateProductInfo = (productId, updateData) => {
    console.log('商品更新:', productId, updateData);
    const updatedProducts = (allItems || []).map(product => {
      if (product.id === productId) {
        return {
          ...product,
          ...updateData.updatedInfo,
          updateHistory: [
            ...(product.updateHistory || []),
            {
              ...updateData,
              id: `update_${Date.now()}`,
              submittedAt: new Date()
            }
          ],
          lastUpdateReport: new Date().toISOString(),
          pendingUpdates: (product.pendingUpdates || 0) + 1
        };
      }
      return product;
    });
    return updatedProducts;
  };

  const scanQRCode = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          productName: 'グルテンフリー米粉パン',
          allergens: ['wheat', 'egg', 'milk'],
          safe: true
        });
      }, 1000);
    });
  };

  const getNearbyItems = (latitude, longitude) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          allItems.filter(item => item.area === '渋谷' || !item.area)
        );
      }, 500);
    });
  };

  // フィルタリング機能
  const getFilteredItems = () => {
    let items = allItems;
    
    console.log('🔍 検索開始:', {
      totalItems: allItems.length,
      selectedCategory,
      selectedAllergies,
      selectedArea,
      searchKeyword
    });
    
    console.log('📋 全アイテム一覧:', allItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      area: item.area,
      isDbData: item.id && typeof item.id === 'string' && item.id.startsWith('db_'),
      hasStoreLocations: item.storeLocations?.length || 0
    })));

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
      console.log('📂 カテゴリフィルター後:', items.length, 'items');
    }

    if (selectedAllergies.length > 0) {
      const beforeAllergyFilter = items.length;
      console.log('🚫 アレルギーフィルター適用前:', {
        selectedAllergies,
        safeProductIds: safeProductIds ? Array.from(safeProductIds) : null,
        safeProductIdsSize: safeProductIds ? safeProductIds.size : 0
      });
      
      // 安全候補が空集合なら、ユーザーに結果ゼロを避けるため一旦フィルタをスキップ
      const shouldApply = safeProductIds && safeProductIds.size > 0;
      items = items.filter(item => {
        if (!(item.id && typeof item.id === 'string' && item.id.startsWith('db_'))) {
          console.log('🚫 非DBデータ除外:', item.name, item.id);
          return false;
        }
        if (!shouldApply) {
          console.log('⚠️ アレルギーフィルタースキップ:', item.name, 'safeProductIdsが空');
          return true;
        }
        const pid = Number(item.id.slice(3));
        const isSafe = safeProductIds.has(pid);
        console.log('🔍 アレルギー安全性チェック:', {
          itemName: item.name,
          productId: pid,
          isSafe: isSafe
        });
        return isSafe;
      });
      console.log('🚫 アレルギーフィルター後:', beforeAllergyFilter, '→', items.length, 'items');
    }

    if (searchKeyword) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.cuisine && item.cuisine.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        item.description.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    if (selectedArea) {
      const beforeAreaFilter = items.length;
      items = items.filter(item => {
        if (item.storeLocations && item.storeLocations.length > 0) {
          const hasMatchingLocation = item.storeLocations.some(location => {
            if (!location.address) return false;
            const address = location.address.toString();
            const searchArea = selectedArea.toString();
            const matches = address.includes(searchArea);
            console.log('📍 住所マッチング:', {
              itemName: item.name,
              address: address,
              searchArea: searchArea,
              matches: matches
            });
            return matches;
          });
          console.log('📍 エリアマッチ結果:', item.name, hasMatchingLocation, {
            locations: item.storeLocations.map(l => l.address) || []
          });
          return hasMatchingLocation;
        } else {
          console.log('📍 住所情報なし:', item.name, '→ 非表示');
          return false;
        }
      });
      console.log('📍 エリアフィルター後:', beforeAreaFilter, '→', items.length, 'items');
    }

    console.log('🎯 最終結果:', items.length, 'items');
    return items;
  };

  const getFilteredRestaurants = () => {
    return getFilteredItems().filter(item => item.category === 'restaurants' || !item.category);
  };

  const getRecommendations = () => {
    if (history.length === 0) return allItems.slice(0, 3);
    const lastViewed = history[0];
    return allItems.filter(item =>
      item.id !== lastViewed.id && item.category === lastViewed.category
    ).slice(0, 3);
  };

  const value = {
    allergyOptions,
    mandatoryAllergies,
    recommendedAllergies,
    categories,
    allItems,

    selectedAllergies,
    setSelectedAllergies,
    searchKeyword,
    setSearchKeyword,
    selectedArea,
    setSelectedArea,
    selectedCategory,
    setSelectedCategory,
    favorites,
    history,
    isLoggedIn,
    setIsLoggedIn,
    userSettings,
    setUserSettings,

    getFilteredRestaurants,
    getFilteredItems,
    toggleFavorite,
    isFavorite,
    addToHistory,
    updateProductInfo,
    scanQRCode,
    getNearbyItems,
    getRecommendations
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export default RestaurantContext;