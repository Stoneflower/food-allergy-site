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
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allergyOptions, setAllergyOptions] = useState([]);
  const [mandatoryAllergies, setMandatoryAllergies] = useState([]);
  const [recommendedAllergies, setRecommendedAllergies] = useState([]);

  // デフォルトのアレルギー項目（フォールバック用）
  const defaultMandatoryAllergies = [
    { id: 'egg', name: '卵', icon: '🥚' },
    { id: 'milk', name: '乳', icon: '🥛' },
    { id: 'wheat', name: '小麦', icon: '🌾' },
    { id: 'buckwheat', name: 'そば', icon: '🌰' },
    { id: 'peanut', name: '落花生', icon: '🥜' },
    { id: 'shrimp', name: 'えび', icon: '🦐' },
    { id: 'crab', name: 'かに', icon: '🦀' },
    { id: 'walnut', name: 'くるみ', icon: '🌰' }
  ];

  const defaultRecommendedAllergies = [
    { id: 'almond', name: 'アーモンド', icon: '🌰' },
    { id: 'abalone', name: 'あわび', icon: '🐚' },
    { id: 'squid', name: 'いか', icon: '🦑' },
    { id: 'salmon_roe', name: 'いくら', icon: '🐟' },
    { id: 'orange', name: 'オレンジ', icon: '🍊' },
    { id: 'cashew', name: 'カシューナッツ', icon: '🌰' },
    { id: 'kiwi', name: 'キウイフルーツ', icon: '🥝' },
    { id: 'beef', name: '牛肉', icon: '🥩' },
    { id: 'gelatin', name: 'ゼラチン', icon: '🍮' },
    { id: 'sesame', name: 'ごま', icon: '🌰' },
    { id: 'salmon', name: 'さけ', icon: '🐟' },
    { id: 'mackerel', name: 'さば', icon: '🐟' },
    { id: 'soy', name: '大豆', icon: '🫘' },
    { id: 'chicken', name: '鶏肉', icon: '🐔' },
    { id: 'banana', name: 'バナナ', icon: '🍌' },
    { id: 'pork', name: '豚肉', icon: '🐷' },
    { id: 'matsutake', name: 'まつたけ', icon: '🍄' },
    { id: 'peach', name: 'もも', icon: '🍑' },
    { id: 'yam', name: 'やまいも', icon: '🍠' },
    { id: 'apple', name: 'りんご', icon: '🍎' }
  ];

  const defaultAllergyOptions = [...defaultMandatoryAllergies, ...defaultRecommendedAllergies];

  // カテゴリーデータ
  const categories = [
    { id: 'all', name: 'すべて', icon: '🏠' },
    { id: 'restaurants', name: 'レストラン', icon: '🍽️' },
    { id: 'products', name: 'テイクアウト', icon: '🛒' },
    { id: 'supermarkets', name: 'スーパー', icon: '🏪' },
    { id: 'online', name: 'ネットショップ', icon: '📦' }
  ];

  // デフォルトのアレルギー情報を作成する関数
  const createDefaultAllergyInfo = () => {
    const allergyInfo = {};
    defaultAllergyOptions.forEach(allergy => {
      allergyInfo[allergy.id] = false; // デフォルトでは含まれていない
    });
    return allergyInfo;
  };

  // Supabaseからデータを取得する関数
  const fetchDataFromSupabase = async () => {
    console.log('fetchDataFromSupabase開始...');
    setIsLoading(true);
    setError(null);
    
    try {
      // まず基本的なテーブルのみでテスト
      let storeData = null;
      let productData = null;
      
      // 店舗情報を取得（シンプルなクエリ）
      try {
        console.log('store_locationsテーブルにアクセス中...');
        const { data, error } = await supabase
          .from('store_locations')
          .select('*');
        
        if (!error) {
          storeData = data;
          console.log('store_locationsデータ取得成功:', data?.length || 0, '件');
        } else {
          console.error('store_locationsテーブルエラー:', error);
        }
      } catch (err) {
        console.error('store_locationsテーブルアクセスエラー:', err);
      }

      // 商品情報を取得（シンプルなクエリ）
      try {
        console.log('productsテーブルにアクセス中...');
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (!error) {
          productData = data;
          console.log('productsデータ取得成功:', data?.length || 0, '件');
        } else {
          console.error('productsテーブルエラー:', error);
        }
      } catch (err) {
        console.error('productsテーブルアクセスエラー:', err);
      }

      // アレルギー項目を取得
      console.log('allergy_itemsテーブルにアクセス中...');
      const { data: allergyData, error: allergyError } = await supabase
        .from('allergy_items')
        .select('*')
        .order('id');

      if (allergyError) {
        console.error('allergy_itemsテーブルエラー:', allergyError);
        throw allergyError;
      }
      
      console.log('allergy_itemsデータ取得成功:', allergyData?.length || 0, '件');

      // product_allergies_matrixを取得
      let matrixData = [];
      try {
        console.log('product_allergies_matrixテーブルにアクセス中...');
        const { data: matrix, error: matrixError } = await supabase
          .from('product_allergies_matrix')
          .select('*');
        
        if (!matrixError && matrix) {
          matrixData = matrix;
          console.log('product_allergies_matrixデータ取得成功:', matrix.length, '件');
        } else {
          console.error('product_allergies_matrixテーブルエラー:', matrixError);
        }
      } catch (err) {
        console.error('product_allergies_matrixテーブルアクセスエラー:', err);
      }

      // アレルギー項目を分類
      if (allergyData && allergyData.length > 0) {
        const mandatory = allergyData.filter(item => item.category === 'mandatory');
        const recommended = allergyData.filter(item => item.category === 'recommended');
        
        setMandatoryAllergies(mandatory.map(item => ({
          id: item.item_id,
          name: item.name,
          icon: item.icon || '⚠️'
        })));
        
        setRecommendedAllergies(recommended.map(item => ({
          id: item.item_id,
          name: item.name,
          icon: item.icon || '⚠️'
        })));
        
        setAllergyOptions([...mandatory, ...recommended].map(item => ({
          id: item.item_id,
          name: item.name,
          icon: item.icon || '⚠️'
        })));
      } else {
        // フォールバック
        setMandatoryAllergies(defaultMandatoryAllergies);
        setRecommendedAllergies(defaultRecommendedAllergies);
        setAllergyOptions(defaultAllergyOptions);
      }

      // データを統合してallItems形式に変換
      const transformedData = [];
      
      // 店舗データを変換
      if (storeData && storeData.length > 0) {
        console.log('店舗データ変換開始:', storeData);
        console.log('最初の店舗データの構造:', storeData[0]);
        storeData.forEach(store => {
          const defaultAllergyInfo = createDefaultAllergyInfo();
          const allergyFree = Object.keys(defaultAllergyInfo).filter(key => !defaultAllergyInfo[key]);
          
          console.log('店舗データ:', store);
          console.log('store.store_name:', store.store_name);
          console.log('store.name:', store.name);
          console.log('store.product_id:', store.product_id);
          
          // product_idを使ってproductsテーブルから商品名を取得
          const relatedProduct = productData.find(product => product.id === store.product_id);
          console.log('関連商品:', relatedProduct);
          
          const storeName = relatedProduct ? relatedProduct.name : (store.store_name || store.name || '店舗名不明');
          console.log('店舗名:', storeName);
          
          transformedData.push({
            id: store.id,
            name: storeName,
            image: store.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
            rating: 4.0, // デフォルト値
            reviewCount: 0,
            price: '¥1,000～¥2,000', // デフォルト値
            area: store.address || '',
            cuisine: 'レストラン',
            category: 'restaurants',
            brand: '',
            allergyInfo: defaultAllergyInfo,
            allergyFree: allergyFree, // アレルギー対応項目のリスト
            product_allergies_matrix: [], // 店舗には商品マトリックスはない
            description: '',
            source: {
              type: 'official',
              contributor: '店舗公式',
              lastUpdated: new Date().toISOString().split('T')[0],
              confidence: 90,
              verified: true,
              url: ''
            }
          });
        });
        console.log('店舗データ変換完了:', transformedData.filter(item => item.category === 'restaurants'));
      }

      // 商品データを変換
      if (productData && productData.length > 0) {
        console.log('商品データ変換開始:', productData);
        console.log('商品データ数:', productData.length);
        productData.forEach(product => {
          const defaultAllergyInfo = createDefaultAllergyInfo();
          const allergyFree = Object.keys(defaultAllergyInfo).filter(key => !defaultAllergyInfo[key]);
          
          // この商品のproduct_allergies_matrixを取得
          const productMatrix = matrixData.filter(matrix => matrix.product_id === product.id);
          console.log(`商品 ${product.name} のmatrix:`, productMatrix);
          console.log(`商品 ${product.name} のmatrix length:`, productMatrix.length);
          console.log(`matrixData全体:`, matrixData.slice(0, 5)); // 最初の5件を表示
          
          transformedData.push({
            id: product.id + 10000, // 店舗IDと重複しないように
            name: product.name || '商品名不明',
            image: product.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            rating: 4.0,
            reviewCount: 0,
            price: '¥500～¥1,500',
            area: '',
            cuisine: '商品',
            category: 'products',
            brand: product.brand || '',
            allergyInfo: defaultAllergyInfo,
            allergyFree: allergyFree, // アレルギー対応項目のリスト
            product_allergies_matrix: productMatrix, // 実際のproduct_allergies_matrixデータ
            description: product.description || '',
            source: {
              type: 'official',
              contributor: '商品公式',
              lastUpdated: new Date().toISOString().split('T')[0],
              confidence: 85,
              verified: true,
              url: product.source_url || ''
            }
          });
        });
        console.log('商品データ変換完了:', transformedData.filter(item => item.category === 'products'));
        console.log('商品データ変換完了数:', transformedData.filter(item => item.category === 'products').length);
      } else {
        console.log('商品データがありません:', productData);
      }

      console.log('最終的なtransformedData:', transformedData);
      console.log('商品データ数:', transformedData.filter(item => item.category === 'products').length);
      console.log('店舗データ数:', transformedData.filter(item => item.category === 'restaurants').length);
      setAllItems(transformedData);
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase接続テスト
  const testSupabaseConnection = async () => {
    try {
      console.log('Supabase接続テスト開始...');
      const { data, error } = await supabase
        .from('allergy_items')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase接続エラー:', error);
        return false;
      }
      
      console.log('Supabase接続成功');
      return true;
    } catch (err) {
      console.error('接続テスト例外エラー:', err);
      return false;
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    // まず接続テストを実行
    testSupabaseConnection().then(() => {
      console.log('Supabase接続成功、データ取得開始');
      fetchDataFromSupabase();
    }).catch((error) => {
      console.error('Supabase接続エラー:', error);
    });
  }, []);

  // 統合データ（Supabaseデータを優先使用）
  const allItemsData = allItems;

  // お気に入り機能
  const toggleFavorite = (itemId, category) => {
    const favoriteId = `${category}-${itemId}`;
    setFavorites(prev =>
      prev.includes(favoriteId)
        ? prev.filter(id => id !== favoriteId)
        : [...prev, favoriteId]
    );
  };

  // 履歴機能
  const addToHistory = (item) => {
    setHistory(prev => {
      const newHistory = [item, ...prev.filter(h => h.id !== item.id)];
      return newHistory.slice(0, 10); // 最新10件のみ保持
    });
  };

  // フィルタリング機能
  const getFilteredItems = () => {
    let items = allItemsData;
    
    console.log('getFilteredItems - allItemsData:', allItemsData);
    console.log('getFilteredItems - allItemsData products count:', allItemsData.filter(item => item.category === 'products').length);
    console.log('getFilteredItems - allItemsData restaurants count:', allItemsData.filter(item => item.category === 'restaurants').length);
    console.log('getFilteredItems - selectedCategory:', selectedCategory);
    console.log('getFilteredItems - selectedAllergies:', selectedAllergies);
    console.log('getFilteredItems - searchKeyword:', searchKeyword);
    console.log('getFilteredItems - selectedArea:', selectedArea);

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
      console.log('getFilteredItems - after category filter:', items);
    }

    if (searchKeyword) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.cuisine?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      console.log('getFilteredItems - after search filter:', items);
    }

    if (selectedAllergies.length > 0) {
      items = items.filter(item => {
        return selectedAllergies.every(allergyId => {
          const allergyInfo = item.allergyInfo || {};
          return allergyInfo[allergyId] === false; // アレルギー成分が含まれていない
        });
      });
      console.log('getFilteredItems - after allergy filter:', items);
    }

    if (selectedArea) {
      items = items.filter(item => 
        !item.area || item.area.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }

    console.log('getFilteredItems - final result:', items);
    console.log('getFilteredItems - products count:', items.filter(item => item.category === 'products').length);
    console.log('getFilteredItems - restaurants count:', items.filter(item => item.category === 'restaurants').length);
    return items;
  };

  const getFilteredRestaurants = () => {
    return getFilteredItems().filter(item => item.category === 'restaurants' || !item.category);
  };

  const getFilteredProducts = () => {
    return getFilteredItems().filter(item => item.category === 'products');
  };

  const getFilteredSupermarkets = () => {
    return getFilteredItems().filter(item => item.category === 'supermarkets');
  };

  const getFilteredOnlineShops = () => {
    return getFilteredItems().filter(item => item.category === 'online');
  };

  // おすすめ機能
  const getRecommendations = () => {
    return allItemsData.filter(item =>
      item.allergyFree && item.allergyFree.length > 0
    ).slice(0, 6);
  };

  const value = {
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
    setFavorites,
    history,
    setHistory,
    allItemsData,
    isLoading,
    error,
    allergyOptions,
    mandatoryAllergies,
    recommendedAllergies,
    
    // 関数
    toggleFavorite,
    addToHistory,
    getFilteredItems,
    getFilteredRestaurants,
    getFilteredProducts,
    getFilteredSupermarkets,
    getFilteredOnlineShops,
    getRecommendations,
    fetchDataFromSupabase,
    testSupabaseConnection,
    
    // データ
    categories,
    products: getFilteredProducts(),
    restaurants: getFilteredRestaurants()
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};