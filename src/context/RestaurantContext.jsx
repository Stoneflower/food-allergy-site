import React, { createContext, useContext, useState } from 'react';

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

  // 軽量化されたサンプルデータ（更新履歴を追加）
  const restaurants = [
    {
      id: 1,
      name: 'アレルギーフリー カフェ 渋谷店',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      rating: 4.5,
      reviewCount: 128,
      price: '¥1,000～¥2,000',
      area: '渋谷',
      cuisine: 'カフェ・洋食',
      category: 'restaurants',
      allergyFree: ['egg', 'milk', 'wheat'],
      allergyInfo: {
        // 義務8品目
        egg: false,
        milk: false,
        wheat: false,
        buckwheat: true,
        peanut: false,
        shrimp: true,
        crab: true,
        walnut: true,
        // 推奨20品目
        almond: false,
        abalone: true,
        squid: true,
        salmon_roe: true,
        orange: true,
        cashew: false,
        kiwi: true,
        beef: true,
        gelatin: true,
        sesame: true,
        salmon: true,
        mackerel: true,
        soy: true,
        chicken: true,
        banana: true,
        pork: true,
        matsutake: true,
        peach: true,
        yam: true,
        apple: true
      },
      description: 'アレルギーをお持ちの方でも安心してお食事を楽しめるカフェです。',
      address: '東京都渋谷区渋谷1-1-1',
      phone: '03-1234-5678',
      hours: '11:00～22:00',
      closed: '年中無休',
      source: {
        type: 'official',
        contributor: '店舗公式',
        lastUpdated: '2024-01-15',
        confidence: 95,
        verified: true,
        reviewCount: 25,
        url: 'https://example.com/official-allergy-info'
      }
    },
    {
      id: 2,
      name: 'グルテンフリー レストラン 新宿店',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      rating: 4.3,
      reviewCount: 95,
      price: '¥2,000～¥3,000',
      area: '新宿',
      cuisine: 'イタリアン',
      category: 'restaurants',
      allergyFree: ['wheat', 'milk'],
      allergyInfo: {
        // 義務8品目
        egg: true,
        milk: false,
        wheat: false,
        buckwheat: true,
        peanut: true,
        shrimp: true,
        crab: true,
        walnut: true,
        // 推奨20品目
        almond: true,
        abalone: true,
        squid: true,
        salmon_roe: true,
        orange: true,
        cashew: true,
        kiwi: true,
        beef: true,
        gelatin: true,
        sesame: true,
        salmon: true,
        mackerel: true,
        soy: true,
        chicken: true,
        banana: true,
        pork: true,
        matsutake: true,
        peach: true,
        yam: true,
        apple: true
      },
      description: 'グルテンフリーパスタが自慢のイタリアンレストランです。',
      address: '東京都新宿区新宿2-2-2',
      phone: '03-2345-6789',
      hours: '17:00～23:00',
      closed: '月曜日',
      source: {
        type: 'pdf',
        contributor: 'システム解析',
        lastUpdated: '2024-01-20',
        confidence: 88,
        verified: true,
        reviewCount: 12,
        url: 'https://example.com/restaurant-menu.pdf'
      }
    }
  ];

  const products = [
    {
      id: 'p1',
      name: 'グルテンフリー米粉パン',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
      price: '¥480',
      brand: 'アレルギー対応パン工房',
      category: 'products',
      type: 'パン・米粉製品',
      allergyFree: ['wheat', 'egg', 'milk'],
      allergyInfo: {
        // 義務8品目
        egg: false,
        milk: false,
        wheat: false,
        buckwheat: true,
        peanut: true,
        shrimp: true,
        crab: true,
        walnut: true,
        // 推奨20品目
        almond: true,
        abalone: true,
        squid: true,
        salmon_roe: true,
        orange: true,
        cashew: true,
        kiwi: true,
        beef: true,
        gelatin: true,
        sesame: true,
        salmon: true,
        mackerel: true,
        soy: true,
        chicken: true,
        banana: true,
        pork: true,
        matsutake: true,
        peach: true,
        yam: true,
        apple: true
      },
      description: '小麦粉不使用、米粉100%で作られたふわふわパンです。',
      rating: 4.6,
      reviewCount: 89,
      ingredients: [
        '米粉（国産）',
        '砂糖',
        '植物油脂',
        '食塩',
        'イースト',
        'キサンタンガム'
      ],
      availability: {
        supermarkets: ['イオン', 'イトーヨーカドー'],
        online: ['Amazon', '楽天市場']
      },
      source: {
        type: 'user_upload',
        contributor: '田中さん',
        lastUpdated: '2024-01-18',
        confidence: 92,
        verified: false,
        reviewCount: 8,
        uploadDate: '2024-01-18'
      },
      // 更新履歴を追加
      updateHistory: [
        {
          id: 'update_p1_1',
          type: 'info_change',
          submittedBy: '山田さん',
          submittedAt: new Date('2024-01-25'),
          status: 'approved',
          changes: [
            { field: '価格', old: '¥450', new: '¥480' }
          ],
          changeReason: '1月からの値上げを確認しました。',
          reviewedBy: '運営チーム',
          reviewedAt: new Date('2024-01-26')
        }
      ],
      lastUpdateReport: '2024-01-25',
      pendingUpdates: 0
    },
    {
      id: 'p2',
      name: 'オーガニック豆乳ヨーグルト',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      price: '¥298',
      brand: 'オーガニック食品',
      category: 'products',
      type: '乳製品代替',
      allergyFree: ['milk', 'egg'],
      allergyInfo: {
        // 義務8品目
        egg: false,
        milk: false,
        wheat: true,
        buckwheat: true,
        peanut: true,
        shrimp: true,
        crab: true,
        walnut: true,
        // 推奨20品目
        almond: true,
        abalone: true,
        squid: true,
        salmon_roe: true,
        orange: true,
        cashew: true,
        kiwi: true,
        beef: true,
        gelatin: true,
        sesame: true,
        salmon: true,
        mackerel: true,
        soy: true,
        chicken: true,
        banana: true,
        pork: true,
        matsutake: true,
        peach: true,
        yam: true,
        apple: true
      },
      description: '乳製品不使用、豆乳ベースのプロバイオティクスヨーグルトです。',
      rating: 4.3,
      reviewCount: 156,
      ingredients: [
        '有機豆乳',
        '有機砂糖',
        '乳酸菌',
        '寒天',
        'クエン酸'
      ],
      availability: {
        supermarkets: ['ナチュラルローソン', '成城石井'],
        online: ['iHerb', 'ケンコーコム']
      },
      source: {
        type: 'verified',
        contributor: '運営チーム',
        lastUpdated: '2024-01-22',
        confidence: 98,
        verified: true,
        reviewCount: 45
      },
      updateHistory: [
        {
          id: 'update_p2_1',
          type: 'info_change',
          submittedBy: '佐藤さん',
          submittedAt: new Date('2024-01-20'),
          status: 'pending_review',
          changes: [
            { field: 'アレルギー成分（追加）', old: '', new: '🫘 大豆', type: 'addition' }
          ],
          changeReason: 'パッケージに大豆アレルギーの注意書きが追加されていました。'
        }
      ],
      pendingUpdates: 1
    }
  ];

  const supermarkets = [
    {
      id: 's1',
      name: 'イオン 渋谷店',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      category: 'supermarkets',
      area: '渋谷',
      rating: 4.2,
      reviewCount: 445,
      allergyFreeProducts: 25,
      specialFeatures: ['アレルギー対応コーナー', '専門スタッフ常駐'],
      address: '東京都渋谷区渋谷2-24-1',
      hours: '9:00～23:00',
      phone: '03-5456-7890',
      description: 'アレルギー対応商品を豊富に取り揃えているイオンの大型店舗です。',
      source: {
        type: 'community',
        contributor: 'アレルギー情報収集グループ',
        lastUpdated: '2024-01-10',
        confidence: 85,
        verified: false,
        reviewCount: 32
      }
    }
  ];

  const onlineShops = [
    {
      id: 'o1',
      name: 'アレルギー対応食品専門店',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      category: 'online',
      url: 'https://allergy-foods.com',
      rating: 4.8,
      reviewCount: 1234,
      allergyFreeProducts: 150,
      specialFeatures: ['28品目完全対応', '栄養士監修', '全国配送'],
      description: 'アレルギー対応食品に特化した専門オンラインストアです。',
      shippingInfo: '全国送料無料（5,000円以上）',
      deliveryTime: '1-3営業日',
      source: {
        type: 'official',
        contributor: 'ショップ公式',
        lastUpdated: '2024-01-25',
        confidence: 96,
        verified: true,
        reviewCount: 67,
        url: 'https://allergy-foods.com'
      }
    }
  ];

  // 統合データ
  const allItems = [...restaurants, ...products, ...supermarkets, ...onlineShops];

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

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // ログインユーザーの場合はユーザー設定を考慮
    if (isLoggedIn && userSettings.selectedAllergies.length > 0) {
      items = items.filter(item => {
        return userSettings.selectedAllergies.every(allergy => !item.allergyInfo[allergy]);
      });
    } else if (selectedAllergies.length > 0) {
      // 非ログインユーザーは基本的なフィルタリングのみ
      items = items.filter(item => {
        return selectedAllergies.every(allergy => !item.allergyInfo[allergy]);
      });
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
      items = items.filter(item => 
        !item.area || item.area.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }

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
    restaurants,
    products,
    supermarkets,
    onlineShops,
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