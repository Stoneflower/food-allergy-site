import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { searchService } from '../lib/searchService';
import { PREFECTURES, isPrefectureName, isAreaMatch } from '../constants/prefectures';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }) => {
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
    { id: 'pork', name: '豚肉', icon: '🥓' },
    { id: 'matsutake', name: 'まつたけ', icon: '🍄' },
    { id: 'peach', name: 'もも', icon: '🍑' },
    { id: 'yam', name: 'やまいも', icon: '🍠' },
    { id: 'apple', name: 'りんご', icon: '🍎' }
  ];

  const defaultAllergyOptions = [...defaultMandatoryAllergies, ...defaultRecommendedAllergies];

  // 状態管理
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedFragranceForSearch, setSelectedFragranceForSearch] = useState([]);
  const [selectedTraceForSearch, setSelectedTraceForSearch] = useState([]);
  const [activeAllergyTarget, setActiveAllergyTarget] = useState(() => {
    try {
      const raw = localStorage.getItem('activeAllergyTarget');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [areaInputValue, setAreaInputValue] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // アレルギー項目の状態
  const [allergyOptions, setAllergyOptions] = useState(defaultAllergyOptions);
  const [mandatoryAllergies, setMandatoryAllergies] = useState(defaultMandatoryAllergies);
  const [recommendedAllergies, setRecommendedAllergies] = useState(defaultRecommendedAllergies);

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
      allergyInfo[allergy.id] = false;
    });
    return allergyInfo;
  };

  // 利用シーン（products.category 文字列）→ 内部カテゴリIDへの正規化
  const normalizeCategory = (categoryText) => {
    if (!categoryText || typeof categoryText !== 'string') return '商品';
    
    // データベースのカテゴリを日本語にマッピング
    const categoryMap = {
      'restaurants': 'レストラン',
      'supermarkets': 'スーパー', 
      'online': 'ネットショップ',
      'products': '商品',
      'takeout': 'テイクアウト'
    };
    
    // 既に日本語の場合はそのまま返す
    if (['レストラン', 'スーパー', 'ネットショップ', '商品', 'テイクアウト'].includes(categoryText)) {
      return categoryText;
    }
    
    // 英語の場合は日本語に変換
    return categoryMap[categoryText] || '商品';
  };

  // カテゴリトークンの生成（日本語統一）
  const getCategoryTokens = (categoryText) => {
    if (!categoryText || typeof categoryText !== 'string') return ['商品'];
    
    const result = new Set();
    result.add('商品'); // デフォルト
    
    // カテゴリマッピング
    const categoryMap = {
      'restaurants': 'レストラン',
      'supermarkets': 'スーパー', 
      'online': 'ネットショップ',
      'products': '商品',
      'takeout': 'テイクアウト'
    };
    
    // 英語→日本語変換
    const normalizedCategory = normalizeCategory(categoryText);
    result.add(normalizedCategory);
    
    return Array.from(result);
  };

  // 検索実行関数
  const executeSearch = () => {
    console.log('検索実行:', { areaInputValue, searchKeyword, selectedCategory });
    
    if (!areaInputValue || areaInputValue.trim() === '') {
      console.log('エリア入力が空のため、検索を実行しません');
      setSelectedArea('');
      return;
    }
    
    setSelectedArea(areaInputValue.trim());
    console.log('検索実行完了:', areaInputValue.trim());
  };

  // 新しい検索サービスを使用したデータ取得関数
  const fetchDataFromSupabase = async () => {
    console.log('fetchDataFromSupabase開始...');
    setIsLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      
      // 元の商品検索のみに戻す（緊急対応）
      console.log('緊急対応: 商品検索のみ実行');
      const { data, error } = await searchService.hybridSearch(
        searchKeyword,
        {
          allergies: selectedAllergies,
          area: selectedArea,
          category: selectedCategory,
          limit: 200
        }
      );

      const executionTime = performance.now() - startTime;
      
      // パフォーマンスログの記録
      await searchService.logSearchPerformance(searchKeyword, executionTime, data?.length || 0);

      if (error) {
        console.error('検索エラー:', error);
        throw error;
      }

      console.log('検索結果:', data?.length || 0, '件', '実行時間:', executionTime.toFixed(2), 'ms');

      // データの変換処理
      console.log('🔍 変換前のデータ:', data?.length || 0, '件');
      console.log('🔍 変換前のデータサンプル:', data?.[0]);
      const transformedData = transformAndMergeData(data || []);
      console.log('🔍 変換後のデータ:', transformedData.length, '件');
      console.log('🔍 変換後のデータサンプル:', transformedData[0]);
      
      // カテゴリの詳細ログ
      transformedData.forEach((item, index) => {
        console.log(`🔍 アイテム${index + 1}:`, {
          name: item.name,
          category: item.category,
          category_tokens: item.category_tokens
        });
      });
      
      setAllItems(transformedData);
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // データ変換処理
  const transformAndMergeData = (searchData) => {
    const transformedData = [];
    
    try {
      searchData.forEach(item => {
        const transformedItem = {
          id: item.id,
          name: item.name || '商品名不明',
          image: item.source_url || item.source_url2 || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
          rating: 4.0,
          reviewCount: 0,
          price: '¥500～¥1,500',
          area: item.store_locations?.[0]?.address || 'すべて',
          cuisine: '商品',
          category: normalizeCategory(item.category),
          category_tokens: getCategoryTokens(item.category),
          brand: item.brand || '',
          allergyInfo: createDefaultAllergyInfo(),
          allergyFree: [],
          product_allergies_matrix: item.product_allergies || [],
          related_product: item,
          description: item.description || item.product_title || item.name || '',
          store_list_url: item.store_locations?.[0]?.store_list_url || null,
          source: {
            type: 'official',
            contributor: '商品公式',
            lastUpdated: new Date().toISOString().split('T')[0],
            confidence: 85,
            verified: true,
            url: item.store_locations?.[0]?.source_url || ''
          }
        };
        
        transformedData.push(transformedItem);
      });
      
      console.log('データ変換完了:', transformedData.length, '件');
      return transformedData;
      
    } catch (err) {
      console.error('データ変換エラー:', err);
      return [];
    }
  };

  // アレルギー項目の取得と設定
  const fetchAllergyItems = async () => {
    try {
      const { data: allergyData, error: allergyError } = await supabase
        .from('allergy_items')
        .select('*')
        .order('id');

      if (allergyError) {
        console.error('allergy_itemsテーブルエラー:', allergyError);
        throw allergyError;
      }

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
    } catch (err) {
      console.error('アレルギー項目取得エラー:', err);
      // フォールバック
      setMandatoryAllergies(defaultMandatoryAllergies);
      setRecommendedAllergies(defaultRecommendedAllergies);
      setAllergyOptions(defaultAllergyOptions);
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
    console.log('useEffect実行開始');
    testSupabaseConnection().then(() => {
      console.log('Supabase接続成功、データ取得開始');
      fetchAllergyItems();
      fetchDataFromSupabase();
    }).catch((error) => {
      console.error('Supabase接続エラー:', error);
    });
  }, [searchKeyword, selectedArea, selectedCategory, selectedAllergies]);

  // 統合データ
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

  const isFavorite = (itemId, category) => {
    const favoriteId = `${category}-${itemId}`;
    return favorites.includes(favoriteId);
  };

  // 履歴機能
  const addToHistory = (item) => {
    setHistory(prev => {
      const newHistory = [item, ...prev.filter(h => h.id !== item.id)];
      return newHistory.slice(0, 10);
    });
  };

  // フィルタリング機能
  const getFilteredItems = () => {
    let items = allItemsData;
    
    console.log('🔍 getFilteredItems開始 - allItemsData:', allItemsData.length);
    console.log('🔍 フィルター条件:', { selectedCategory, searchKeyword, selectedArea, selectedAllergies: selectedAllergies.length });

    if (selectedCategory !== 'すべて' && selectedCategory !== 'all') {
      console.log('🔍 カテゴリフィルター適用:', selectedCategory);
      
      // 英語カテゴリを日本語に変換
      const categoryMap = {
        'restaurants': 'レストラン',
        'supermarkets': 'スーパー', 
        'online': 'ネットショップ',
        'products': '商品',
        'takeout': 'テイクアウト'
      };
      
      const normalizedSelectedCategory = categoryMap[selectedCategory] || selectedCategory;
      console.log('🔍 正規化されたカテゴリ:', normalizedSelectedCategory);
      
      items = items.filter(item => {
        const matches = item.category === normalizedSelectedCategory || 
                       (Array.isArray(item.category_tokens) && item.category_tokens.includes(normalizedSelectedCategory));
        if (matches) {
          console.log('🔍 マッチしたアイテム:', item.name, 'カテゴリ:', item.category, 'トークン:', item.category_tokens);
        }
        return matches;
      });
      console.log('🔍 カテゴリフィルター後:', items.length, '件');
    }

    if (searchKeyword) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.cuisine?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.area?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.related_product && item.related_product.name?.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (item.related_product && item.related_product.description?.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }

    if (!selectedArea || selectedArea.trim() === '') {
      console.log('エリア入力が空: クリアせず全件から他条件のみ適用');
    } else if (selectedArea) {
      const isPrefectureNameInput = isPrefectureName(selectedArea);
      
      if (isPrefectureNameInput) {
        items = items.filter(item => {
          const isPrefectureNameItem = PREFECTURES.some(pref => 
            item.name === pref || item.area === pref
          );
          
          const areaMatch = isAreaMatch(item.area, selectedArea);
          
          return areaMatch && !isPrefectureNameItem;
        });
      } else {
        items = items.filter(item =>
          (item.area === 'すべて') ||
          (item.area && item.area.toLowerCase().includes(selectedArea.toLowerCase()))
        );
      }
    }

    console.log('🔍 getFilteredItems完了 - final result:', items.length);
    console.log('🔍 フィルタリング後のアイテムサンプル:', items[0]);
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
    selectedFragranceForSearch,
    selectedTraceForSearch,
    activeAllergyTarget,
    searchKeyword,
    setSearchKeyword,
    selectedArea,
    setSelectedArea,
    selectedCategory,
    setSelectedCategory,
    areaInputValue,
    setAreaInputValue,
    favorites,
    history,
    allItemsData,
    isLoading,
    error,
    allergyOptions,
    mandatoryAllergies,
    recommendedAllergies,
    categories,
    
    // 関数
    toggleFavorite,
    isFavorite,
    addToHistory,
    getFilteredItems,
    getFilteredRestaurants,
    getFilteredProducts,
    getFilteredSupermarkets,
    getFilteredOnlineShops,
    getRecommendations,
    fetchDataFromSupabase,
    testSupabaseConnection,
    executeSearch,
    applyAllergyTarget: async (target) => {
      try {
        if (!target || target.profileType === 'none') {
          setActiveAllergyTarget(null);
          localStorage.removeItem('activeAllergyTarget');
          setSelectedAllergies([]);
          setSelectedFragranceForSearch([]);
          setSelectedTraceForSearch([]);
          return;
        }

        setActiveAllergyTarget(target);
        localStorage.setItem('activeAllergyTarget', JSON.stringify(target));
        const match = target.profileType === 'user'
          ? { profile_type: 'user', profile_id: target.id }
          : { profile_type: 'member', member_id: target.id };
        const { data } = await supabase
          .from('allergy_settings')
          .select('selected_allergies')
          .match(match)
          .maybeSingle();
        const all = Array.isArray(data?.selected_allergies) ? data.selected_allergies : [];
        const normal = all.filter(a => typeof a === 'string' && !a.startsWith('included:') && !a.startsWith('fragrance:') && !a.startsWith('trace:'));
        const fragRaw = all
          .filter(a => typeof a === 'string' && (a.startsWith('included:') || a.startsWith('fragrance:')))
          .map(a => a.replace('included:', '').replace('fragrance:', ''));
        const traceRaw = all
          .filter(a => typeof a === 'string' && a.startsWith('trace:'))
          .map(a => a.replace('trace:', ''));
        const frag = Array.from(new Set(fragRaw));
        const trace = Array.from(new Set(traceRaw));
        setSelectedAllergies(normal);
        setSelectedFragranceForSearch(frag);
        setSelectedTraceForSearch(trace);
      } catch (err) {
        console.error('アレルギー設定適用エラー:', err);
      }
    }
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};