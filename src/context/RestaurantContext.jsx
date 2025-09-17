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
            store_locations (*)
          `)
          .order('id', { ascending: false })
          .limit(24);
        
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
          
          return {
            id: `db_${p.id}`,
            name: p.name,
            image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600',
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
            // Supabaseデータ用の追加フィールド
            menuItems: p.menu_items || [],
            storeLocations: p.store_locations || [],
            // サンプルデータとの互換性のため
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
        
        console.log('Supabase products loaded:', mapped.length, 'items');
        setDbProducts(mapped);
      } catch (e) {
        console.warn('Supabase products fetch failed:', e.message);
      }
    };
    loadProducts();
  }, []);

  // 統合データ（Supabaseデータのみを使用）
  const allItems = [...dbProducts];

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
      return [{ ...item, viewedAt: new Date() }, ...newHistory].slice(0, 10); // 最新10件
    });
  };

  // 商品更新機能
  const updateProductInfo = (productId, updateData) => {
    // 実際にはここでAPIを呼び出してデータベースを更新
    console.log('商品更新:', productId, updateData);
    // ローカル状態の更新（実際の実装では不要）
    const updatedProducts = products.map(product => {
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

  // QRコード機能（モック）
  const scanQRCode = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // モックデータを返す
        resolve({
          productName: 'グルテンフリー米粉パン',
          allergens: ['wheat', 'egg', 'milk'],
          safe: true
        });
      }, 1000);
    });
  };

  // 位置情報機能（モック）
  const getNearbyItems = (latitude, longitude) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 渋谷周辺のモックデータ
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
    
    // 全アイテムの詳細情報をログ出力
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

    // アレルギーフィルター
    if (selectedAllergies.length > 0) {
      const beforeAllergyFilter = items.length;
      items = items.filter(item => {
        // Supabaseデータの場合は特別な処理
        if (item.id && typeof item.id === 'string' && item.id.startsWith('db_')) {
          console.log('🍽️ Supabaseデータのアレルギーチェック:', item.name, {
            menuItems: item.menuItems?.length || 0,
            selectedAllergies
          });
          
          // Supabaseのメニューデータからアレルギー情報を確認
          const hasSafeMenu = item.menuItems && item.menuItems.some(menuItem => {
            return selectedAllergies.every(allergyId => {
              return menuItem.menu_item_allergies && menuItem.menu_item_allergies.some(allergy => 
                allergy.allergy_item_id === allergyId && 
                (allergy.presence_type === 'none' || allergy.presence_type === 'trace')
              );
            });
          });
          
          console.log('✅ アレルギー安全メニュー:', hasSafeMenu);
          return hasSafeMenu;
        } else {
          // サンプルデータの場合は既存のロジック（allergyInfoが存在する場合のみ）
          if (item.allergyInfo) {
            return selectedAllergies.every(allergy => !item.allergyInfo[allergy]);
          }
          // allergyInfoが存在しない場合は安全でないとみなす
          return false;
        }
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

    // エリア検索（store_locationsのaddressカラムを参照）
    if (selectedArea) {
      const beforeAreaFilter = items.length;
      items = items.filter(item => {
        // すべてのデータでstore_locationsのaddressを参照
        if (item.storeLocations && item.storeLocations.length > 0) {
          const hasMatchingLocation = item.storeLocations.some(location => {
            if (!location.address) return false;
            
            // 都道府県名での検索（部分一致）
            const address = location.address.toString();
            const searchArea = selectedArea.toString();
            
            // 都道府県名が含まれているかチェック
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
          // store_locationsがない場合は表示しない（エリア検索が有効な場合）
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

  // レコメンド機能
  const getRecommendations = () => {
    if (history.length === 0) return allItems.slice(0, 3);

    // 履歴から類似アイテムを推薦（簡単なロジック）
    const lastViewed = history[0];
    return allItems.filter(item =>
      item.id !== lastViewed.id && item.category === lastViewed.category
    ).slice(0, 3);
  };

  const value = {
    // データ
    allergyOptions,
    mandatoryAllergies,
    recommendedAllergies,
    categories,
    allItems,

    // 状態
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

    // 機能
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