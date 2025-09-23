import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  // エリア入力（検索ボタン方式）
  const [areaInputValue, setAreaInputValue] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 検索実行関数（検索ボタン方式）
  const executeSearch = () => {
    console.log('検索実行:', { areaInputValue, searchKeyword, selectedCategory });
    
    // エリア入力が空の場合は検索しない
    if (!areaInputValue || areaInputValue.trim() === '') {
      console.log('エリア入力が空のため、検索を実行しません');
      setSelectedArea('');
      return;
    }
    
    // エリア入力をselectedAreaに設定して検索実行
    setSelectedArea(areaInputValue.trim());
    console.log('検索実行完了:', areaInputValue.trim());
  };
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
      allergyInfo[allergy.id] = false; // デフォルトでは含まれていない
    });
    return allergyInfo;
  };

  // 利用シーン（products.category 文字列）→ 内部カテゴリIDへの正規化
  const normalizeCategory = (categoryText) => {
    if (!categoryText || typeof categoryText !== 'string') return 'products';
    // 複数選択時はスラッシュ区切りで保存されている想定
    const tokens = categoryText.split(/[/、,\s]+/).filter(Boolean);
    const text = categoryText;
    // 優先順位: スーパー → ネットショップ → テイクアウト → レストラン
    if (tokens.some(t => t.includes('スーパー')) || text.includes('スーパー')) return 'supermarkets';
    if (tokens.some(t => t.includes('ネットショップ')) || text.includes('ネットショップ')) return 'online';
    if (tokens.some(t => t.includes('テイクアウト')) || text.includes('テイクアウト')) return 'products';
    if (tokens.some(t => t.includes('レストラン')) || text.includes('レストラン')) return 'restaurants';
    return 'products';
  };

  // すべての含有カテゴリトークンを配列で返す（フィルタ用）
  const getCategoryTokens = (categoryText) => {
    if (!categoryText || typeof categoryText !== 'string') return [];
    const tokens = categoryText.split(/[/、,\s]+/).filter(Boolean);
    const result = new Set();
    if (tokens.some(t => t.includes('スーパー')) || categoryText.includes('スーパー')) result.add('supermarkets');
    if (tokens.some(t => t.includes('ネットショップ')) || categoryText.includes('ネットショップ')) result.add('online');
    if (tokens.some(t => t.includes('テイクアウト')) || categoryText.includes('テイクアウト')) result.add('products');
    if (tokens.some(t => t.includes('レストラン')) || categoryText.includes('レストラン')) result.add('restaurants');
    return Array.from(result);
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
      
      // 店舗情報を取得
      try {
        console.log('store_locationsテーブルにアクセス中...');
        const { data, error } = await supabase
          .from('store_locations')
          .select('*');
        
        if (!error) {
          storeData = data;
          console.log('store_locationsデータ取得成功:', data?.length || 0, '件');
          console.log('store_locationsデータ詳細:', data);
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
          console.log('productsデータ詳細:', data);
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

      // 追加: product_allergies（行形式）も取得し、UI用にproduct_allergies_matrix風に組み立てる
      let productAllergiesRows = [];
      try {
        console.log('product_allergiesテーブルにアクセス中...');
        const { data: par, error: parErr } = await supabase
          .from('product_allergies')
          .select('*');
        if (!parErr && par) {
          productAllergiesRows = par;
          console.log('product_allergiesデータ取得成功:', par.length, '件');
        } else {
          console.error('product_allergiesテーブルエラー:', parErr);
        }
      } catch (err) {
        console.error('product_allergiesテーブルアクセスエラー:', err);
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
          
          console.log('store_locationsデータ:', store);
          console.log('store.branch_name:', store.branch_name);
          console.log('store.address:', store.address);
          console.log('store.product_id:', store.product_id);
          console.log('store.source_url:', store.source_url);
          console.log('store.store_list_url:', store.store_list_url);
          console.log('store.store_list_urlの型:', typeof store.store_list_url);
          console.log('store.store_list_urlが空かどうか:', !store.store_list_url);
          console.log('store.store_list_urlがnullかどうか:', store.store_list_url === null);
          console.log('store.store_list_urlがundefinedかどうか:', store.store_list_url === undefined);
          
          // branch_nameまたはaddressを使用して店舗名を作成
          const storeName = store.branch_name || store.address || '店舗名不明';
          console.log('店舗名:', storeName);
          
          // この店舗に関連する商品を取得
          const relatedProduct = productData && store.product_id ? productData.find(product => product.id === store.product_id) : null;
          console.log('関連商品:', relatedProduct);
          
          // 関連商品のproduct_allergies_matrixを取得
          const productMatrix = relatedProduct ? matrixData.filter(matrix => matrix.product_id === relatedProduct.id) : [];
          console.log('関連商品のmatrix:', productMatrix);
          
          // 商品情報がない店舗は除外する（ただし、store_list_urlがある場合は除外しない）
          if (!relatedProduct && productMatrix.length === 0 && (!store.store_list_url || store.store_list_url.trim() === '')) {
            console.log('商品情報がない店舗のため除外:', storeName);
            return; // この店舗の処理をスキップ
          }
          
          const transformedItem = {
            id: store.id,
            name: storeName,
            image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400', // デフォルト画像
            rating: 4.0, // デフォルト値
            reviewCount: 0,
            price: '¥1,000～¥2,000', // デフォルト値
            area: store.address || '',
            cuisine: 'レストラン',
            category: 'restaurants',
            brand: relatedProduct?.brand || '',
            allergyInfo: defaultAllergyInfo,
            allergyFree: allergyFree, // アレルギー対応項目のリスト
            product_allergies_matrix: productMatrix, // 関連商品のマトリックス
            related_product: relatedProduct, // 関連商品
            description: store.notes || relatedProduct?.description || '',
            store_list_url: store.store_list_url || null, // エリア情報のリンク先
            source: {
              type: 'official',
              contributor: '店舗公式',
              lastUpdated: new Date().toISOString().split('T')[0],
              confidence: 90,
              verified: true,
              url: store.source_url || '' // アレルギー情報元のリンク先
            }
          };
          
          console.log('変換後のstore_list_url:', transformedItem.store_list_url);
          console.log('変換後のstore_list_urlの型:', typeof transformedItem.store_list_url);
          console.log('変換後のstore_list_urlがnullかどうか:', transformedItem.store_list_url === null);
          console.log('変換後のstore_list_urlがundefinedかどうか:', transformedItem.store_list_url === undefined);
          
          transformedData.push(transformedItem);
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
          
          // デバッグ: 商品データの構造を確認
          console.log(`商品データ構造確認 - ${product.name}:`, product);
          console.log(`商品の全プロパティ:`, Object.keys(product));
          console.log(`商品のstore_list_url:`, product.store_list_url);
          console.log(`商品のstore_list_urlの型:`, typeof product.store_list_url);
          
          // この商品に関連するstore_locationsを取得
          const relatedStores = storeData ? storeData.filter(store => store.product_id === product.id) : [];
          console.log(`商品 ${product.name} の関連店舗:`, relatedStores);
          
          // この商品のproduct_allergies_matrixを取得
          let productMatrix = matrixData.filter(matrix => matrix.product_id === product.id);
          // 行形式のproduct_allergiesからもmatrix風オブジェクトを生成して追加
          const rowsForProduct = productAllergiesRows.filter(r => r.product_id === product.id);
          if (rowsForProduct.length > 0) {
            const generated = {};
            rowsForProduct.forEach(r => {
              // presence_typeのマッピング: そのまま保持（Includedは'Included'のまま）
              let mapped = r.presence_type;
              // 'Included'は'Included'のまま保持して、AllergySearchResultsで正しく処理されるようにする
              
              // 同じallergy_item_idに対して複数のpresence_typeがある場合の処理
              if (generated[r.allergy_item_id]) {
                // 既に値がある場合は、配列として管理する
                if (Array.isArray(generated[r.allergy_item_id])) {
                  generated[r.allergy_item_id].push(mapped);
                } else {
                  // 既存の値を配列に変換して追加
                  generated[r.allergy_item_id] = [generated[r.allergy_item_id], mapped];
                }
              } else {
                generated[r.allergy_item_id] = mapped;
              }
            });
            productMatrix.push({ ...generated, menu_name: product.product_title || product.name });
          }
          console.log(`商品 ${product.name} のmatrix:`, productMatrix);
          
          // 関連店舗がある場合は店舗ごとにデータを作成、ない場合は商品データとして作成
          if (relatedStores.length > 0) {
            relatedStores.forEach(store => {
              // 商品情報がない店舗は除外する
              if (!product && productMatrix.length === 0) {
                console.log('商品情報がない店舗のため除外:', store.branch_name || store.address);
                return; // この店舗の処理をスキップ
              }
              
              const transformedItem = {
                id: `product-${product.id}-store-${store.id}`, // 商品と店舗の組み合わせID
                name: store.branch_name || product.name || '店舗名不明',
                image: product.source_url || product.source_url2 || product.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
                rating: 4.0,
                reviewCount: 0,
                price: '¥500～¥1,500',
                area: store.address || '',
                cuisine: '商品',
                category: normalizeCategory(product.category),
                category_tokens: getCategoryTokens(product.category),
                brand: product.brand || '',
                allergyInfo: defaultAllergyInfo,
                allergyFree: allergyFree,
                product_allergies_matrix: productMatrix,
                related_product: product,
                description: product.description || product.product_title || product.name || '',
                store_list_url: store.store_list_url || product.store_list_url || null, // エリア情報のリンク先（アレルギー情報元と同じロジック）
                source: {
                  type: 'official',
                  contributor: '商品公式',
                  lastUpdated: new Date().toISOString().split('T')[0],
                  confidence: 85,
                  verified: true,
                  url: store.source_url || product.source_url || '' // アレルギー情報元のリンク先
                }
              };
              
              console.log(`商品-店舗組み合わせ ${product.name}-${store.branch_name || store.address} のstore_list_url:`, transformedItem.store_list_url);
              console.log(`元のstore.store_list_url:`, store.store_list_url);
              
              transformedData.push(transformedItem);
            });
          } else {
            // 関連店舗がない場合は商品データとして作成
            // 商品情報がない場合は除外する
            if (!product && productMatrix.length === 0) {
              console.log('商品情報がない商品のため除外:', product.name);
              return; // この商品の処理をスキップ
            }
            
            // 関連するstore_locationsからstore_list_urlを取得（アレルギー情報元と同じロジック）
            const relatedStoreForUrl = storeData ? storeData.find(store => store.product_id === product.id) : null;
            const storeListUrl = relatedStoreForUrl ? relatedStoreForUrl.store_list_url : (product.store_list_url || null);
            
            const transformedItem = {
              id: product.id + 10000,
              name: product.name || '商品名不明',
              image: product.source_url || product.source_url2 || product.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
              rating: 4.0,
              reviewCount: 0,
              price: '¥500～¥1,500',
              area: 'すべて',
              cuisine: '商品',
              category: normalizeCategory(product.category),
              category_tokens: getCategoryTokens(product.category),
              brand: product.brand || '',
              allergyInfo: defaultAllergyInfo,
              allergyFree: allergyFree,
              product_allergies_matrix: productMatrix,
              related_product: product,
              description: product.description || product.product_title || product.name || '',
              store_list_url: storeListUrl, // store_locationsから取得
              source: {
                type: 'official',
                contributor: '商品公式',
                lastUpdated: new Date().toISOString().split('T')[0],
                confidence: 85,
                verified: true,
                url: product.source_url || ''
              }
            };
            
            console.log(`商品単体 ${product.name} のstore_list_url:`, transformedItem.store_list_url);
            console.log(`関連するstore_locations:`, relatedStoreForUrl);
            console.log(`store_locationsから取得したstore_list_url:`, storeListUrl);
            
            transformedData.push(transformedItem);
          }
        });
        console.log('商品データ変換完了:', transformedData.filter(item => item.category === 'restaurants'));
        console.log('商品データ変換完了数:', transformedData.filter(item => item.category === 'restaurants').length);
        } else {
        console.log('商品データがありません:', productData);
      }

      console.log('最終的なtransformedData:', transformedData);
      console.log('商品データ数:', transformedData.filter(item => item.category === 'products').length);
      console.log('店舗データ数:', transformedData.filter(item => item.category === 'restaurants').length);
      console.log('transformedData.length:', transformedData.length);
      setAllItems(transformedData);
      console.log('setAllItems完了');
      
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
    console.log('useEffect実行開始');
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

  // お気に入り状態の確認
  const isFavorite = (itemId, category) => {
    const favoriteId = `${category}-${itemId}`;
    return favorites.includes(favoriteId);
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
      items = items.filter(item => {
        if (item.category === selectedCategory) return true;
        if (Array.isArray(item.category_tokens) && item.category_tokens.includes(selectedCategory)) return true;
        return false;
      });
      console.log('getFilteredItems - after category filter:', items);
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
      console.log('getFilteredItems - after search filter:', items);
    }

    // アレルギーフィルタリングはAllergySearchResults.jsxで行うため、ここでは削除
    // if (selectedAllergies.length > 0) { ... }

    // エリア入力が空の場合は結果をクリア（DBアクセスを避ける）
    if (!selectedArea || selectedArea.trim() === '') {
      console.log('エリア入力が空のため、結果をクリア');
      items = [];
    } else if (selectedArea) {
      // 都道府県名の判定（静的データを使用）
      const isPrefectureNameInput = isPrefectureName(selectedArea);
      
      if (isPrefectureNameInput) {
        // 都道府県名が入力された場合、その都道府県内の具体的な店舗のみを表示
        // 1. 入力された都道府県内の店舗のみを表示
        // 入力された都道府県名と完全一致する店舗名は除外
        // 他の都道府県名の店舗も除外
        items = items.filter(item => {
          const isPrefectureNameItem = PREFECTURES.some(pref => 
            item.name.includes(pref) && (
              item.name === pref || // 完全一致
              item.name.includes(`${pref}(`) || // "鳥取県(401件)" 形式
              item.name.includes(`${pref} `) || // "鳥取県 " 形式
              item.name.startsWith(pref) // "鳥取県" で始まる
            )
          );
          
          if (isPrefectureNameItem) {
            // 都道府県名の店舗の場合
            const isExactMatch = PREFECTURES.some(pref => 
              selectedArea.toLowerCase().includes(pref.toLowerCase()) && item.name === pref
            );
            
            if (isExactMatch) {
              // 入力された都道府県名と完全一致する場合は除外
              console.log('❌ 入力された都道府県名と完全一致するため除外:', item.name);
              return false;
            } else {
              // 他の都道府県名の店舗は除外
              console.log('❌ 他の都道府県名の店舗のため除外:', item.name);
              return false;
            }
          }
          
          // 都道府県名でない店舗は除外しない
          return true;
        });
        
        // 2. その都道府県内の具体的な店舗のみをフィルタリング
        // ただし、都道府県名の店舗は除外
        items = items.filter(item => {
          // エリアフィルタリング（静的データを使用）
          let areaMatch = isAreaMatch(item.area, selectedArea);
          // 追加: store_locations.address が『すべて』なら常に表示
          if (item.area === 'すべて') areaMatch = true;
          
          // 都道府県名の店舗かどうかをチェック
          const isPrefectureNameItem = PREFECTURES.some(pref => 
            item.name.includes(pref) && (
              item.name === pref || // 完全一致
              item.name.includes(`${pref}(`) || // "島根県(401件)" 形式
              item.name.includes(`${pref} `) || // "島根県 " 形式
              item.name.startsWith(pref) // "島根県" で始まる
            )
          );
          
          // エリアにマッチし、かつ都道府県名の店舗でない場合のみ表示
          return areaMatch && !isPrefectureNameItem;
        });
        
        console.log('getFilteredItems - 都道府県名の店舗を除外し、具体的な店舗のみ表示:', items);
      } else {
        // 都道府県名以外の場合は通常のフィルタリング
        items = items.filter(item =>
          (item.area === 'すべて') ||
          (item.area && item.area.toLowerCase().includes(selectedArea.toLowerCase()))
        );
      }
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
    areaInputValue,
    setAreaInputValue,
    executeSearch,
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