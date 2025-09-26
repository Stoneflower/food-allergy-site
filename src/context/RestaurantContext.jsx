import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import searchService from '../lib/searchService';

// product_allergies配列をそのまま使用する関数（変換不要）
const processAllergies = (allergies) => {
  console.log('🔍 processAllergies 呼び出し:', allergies);
  console.log('🔍 processAllergies type:', typeof allergies);
  console.log('🔍 processAllergies isArray:', Array.isArray(allergies));
  
  if (Array.isArray(allergies)) {
    console.log('🔍 processAllergies: 配列として取得、そのまま返す');
    console.log('🔍 processAllergies 配列の長さ:', allergies.length);
    if (allergies.length > 0) {
      console.log('🔍 processAllergies 配列の最初の要素:', allergies[0]);
    }
    return allergies;
  }
  
  console.log('🔍 processAllergies: 配列ではない、空配列を返す');
  return [];
};
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
  const [eligibleProductIds, setEligibleProductIds] = useState(new Set());
  const isFetchingRef = useRef(false);

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
    
    // 手動でデータ取得を実行
    console.log('手動でfetchDataFromSupabaseを実行');
    fetchDataFromSupabase();
  };

  // 新しい検索サービスを使用したデータ取得関数
  const fetchDataFromSupabase = async () => {
    if (isFetchingRef.current) {
      console.log('⚠️ すでに取得中のため、新規フェッチをスキップ');
      return;
    }
    isFetchingRef.current = true;
    console.log('fetchDataFromSupabase開始...');
    setIsLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      
      // SimpleProductDisplayと同じ方法で直接Supabaseから取得
      console.log('🔍 SimpleProductDisplayと同じ方法で直接Supabaseから取得');
      console.log('🔍 検索パラメータ詳細:', {
        searchKeyword,
        selectedAllergies,
        selectedArea,
        selectedCategory,
        limit: 200
      });
      
      // 直接Supabaseから商品データを取得（28品目すべて取得：選択追加時の取りこぼしを防止）
      const matrixSelect = `*`;

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          category,
          description,
          source_url,
          source_url2,
          image_url,
          product_allergies_matrix (${matrixSelect}),
          menu_items (id, name, product_id),
          store_locations (id, branch_name, address, source_url, store_list_url)
        `)
        .limit(200);

      // キーワードのみ軽くサーバ絞り込み（カテゴリ/エリアはクライアント側で緩和ロジック適用）
      if (searchKeyword && searchKeyword.trim() !== '') {
        const kw = searchKeyword.trim();
        query = query.or(`name.ilike.%${kw}%,brand.ilike.%${kw}%`);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        console.error('❌ 商品データ取得エラー:', productsError);
        console.error('❌ エラー詳細:', JSON.stringify(productsError, null, 2));
        throw productsError;
      }

      console.log('✅ 商品データ取得成功:', productsData?.length || 0, '件');
      
      // デバッグ: Supabase から取得した最初のデータ構造
      if (productsData && productsData.length > 0) {
        console.log('📦 最初の商品データ構造:', productsData[0]);
        console.log('📦 rawDataFromSupabase:', productsData[0]);
      }
      
      // データを変換（searchServiceの形式に合わせる）
      const data = productsData?.map(product => ({
        ...product,
        // categoryは元のデータベースの値を保持
        area: '全国' // デフォルト値
      })) || [];
      
      // アレルギー情報のデバッグログ
      console.log('🔍 アレルギー情報デバッグ:');
      data.forEach((item, index) => {
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies:`, item.product_allergies);
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies type:`, typeof item.product_allergies);
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies length:`, item.product_allergies?.length || 0);
        if (item.product_allergies && item.product_allergies.length > 0) {
          console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies[0]:`, item.product_allergies[0]);
        }
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies_matrix:`, item.product_allergies_matrix);
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies_matrix type:`, typeof item.product_allergies_matrix);
        console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies_matrix length:`, item.product_allergies_matrix?.length || 0);
        if (item.product_allergies_matrix && item.product_allergies_matrix.length > 0) {
          console.log(`🔍 アイテム${index + 1}: ${item.name} - product_allergies_matrix[0]:`, item.product_allergies_matrix[0]);
        }
      });
      
      const error = null;

      const executionTime = performance.now() - startTime;
      
      // パフォーマンスログの記録
      try {
        await searchService.logPerformance('hybrid', searchKeyword, {}, executionTime, data?.length || 0);
      } catch (logError) {
        console.warn('パフォーマンスログ記録エラー:', logError);
      }

      if (error) {
        console.error('検索エラー:', error);
        throw error;
      }

      console.log('検索結果:', data?.length || 0, '件', '実行時間:', executionTime.toFixed(2), 'ms');

      // データの変換処理
      console.log('🔍 変換前のデータ:', data?.length || 0, '件');
      console.log('🔍 変換前のデータサンプル:', data?.[0]);
      
      // データベースの実際のカテゴリを詳しく確認
      console.log('🔍 データベースの実際のカテゴリ一覧:');
      data?.forEach((item, index) => {
        console.log(`🔍 アイテム${index + 1}: ${item.name} - カテゴリ: "${item.category}"`);
      });
      
      // 変換前のデータを詳しく確認
      console.log('🔍 変換前のデータ詳細確認:');
      data?.forEach((item, index) => {
        console.log(`🔍 変換前 アイテム${index + 1}: ${item.name}`);
        console.log(`🔍 変換前 product_allergies:`, item.product_allergies);
        console.log(`🔍 変換前 product_allergies type:`, typeof item.product_allergies);
        console.log(`🔍 変換前 product_allergies length:`, item.product_allergies?.length || 0);
      });
      
      const transformedData = transformAndMergeData(data || []);
      
      // 変換後のデータを詳しく確認
      console.log('🔍 変換後のデータ詳細確認:');
      transformedData?.forEach((item, index) => {
        console.log(`🔍 変換後 アイテム${index + 1}: ${item.name}`);
        console.log(`🔍 変換後 product_allergies:`, item.product_allergies);
        console.log(`🔍 変換後 product_allergies type:`, typeof item.product_allergies);
        console.log(`🔍 変換後 product_allergies length:`, item.product_allergies?.length || 0);
      });
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
      
      console.log('🔍 setAllItems呼び出し前 - transformedData長さ:', transformedData.length);
      console.log('🔍 setAllItems呼び出し前 - transformedDataサンプル:', transformedData[0]);
      setAllItems(transformedData);
      console.log('🔍 setAllItems呼び出し完了');

      // 選択アレルギーに基づく会社カード表示対象IDの取得
      try {
        if (selectedAllergies && selectedAllergies.length > 0) {
          const { data: eligibleRows, error: eligErr } = await supabase
            .from('vw_company_card_eligible')
            .select('product_id')
            .in('allergy', selectedAllergies);
          if (eligErr) {
            console.warn('会社カード表示ビュー取得エラー:', eligErr);
            setEligibleProductIds(new Set());
          } else {
            const ids = new Set((eligibleRows || []).map(r => r.product_id));
            setEligibleProductIds(ids);
          }
        } else {
          // アレルギー未選択時は全件対象
          const ids = new Set((transformedData || []).map(p => p.product_id));
          setEligibleProductIds(ids);
        }
      } catch (e) {
        console.warn('会社カード表示対象ID計算エラー:', e);
        setEligibleProductIds(new Set());
      }
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // 選択アレルギー変更時に、マトリクスのみで eligibleProductIds をローカル再計算
  useEffect(() => {
    try {
      if (!allItems || allItems.length === 0) {
        setEligibleProductIds(new Set());
        return;
      }
      if (!selectedAllergies || selectedAllergies.length === 0) {
        const idsAll = new Set((allItems || []).map(p => p.product_id));
        setEligibleProductIds(idsAll);
        return;
      }

      // product_id 単位で「directが無く、none/trace/fragranceが少なくとも1つある」アイテムが存在するか集計
      // product_id単位で、紐づく全menu_item（= allItemsの該当要素）を統合して判定
      const productIdToAggregates = new Map();

      allItems.forEach(item => {
        const productId = item.product_id || (item.id ? String(item.id).split('_')[0] : null);
        if (!productId) return;
        const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
        const matrix = (() => {
          if (rows.length === 0) return null;
          if (item.menu_item_id) {
            const exact = rows.find(r => String(r.menu_item_id) === String(item.menu_item_id));
            if (exact) return exact;
          }
          return rows[0];
        })();

        let agg = productIdToAggregates.get(productId);
        if (!agg) {
          agg = { hasDirect: false, hasNonDirect: false };
          productIdToAggregates.set(productId, agg);
        }

        if (matrix) {
          selectedAllergies.forEach(slug => {
            const key = slug === 'soy' ? 'soybean' : slug;
            const v = matrix[key];
            if (v === 'direct') agg.hasDirect = true;
            if (v === 'none' || v === 'trace' || v === 'fragrance') agg.hasNonDirect = true;
          });
        } else if (Array.isArray(item.product_allergies)) {
          const rel = item.product_allergies.filter(a => selectedAllergies.includes(a.allergy_item_id));
          if (rel.some(a => a.presence_type === 'direct')) agg.hasDirect = true;
          if (rel.some(a => a.presence_type === 'none' || a.presence_type === 'trace' || a.presence_type === 'fragrance')) agg.hasNonDirect = true;
        }
      });

      const ids = new Set();
      productIdToAggregates.forEach((agg, productId) => {
        if (!agg.hasDirect && agg.hasNonDirect) ids.add(productId);
      });
      setEligibleProductIds(ids);
      console.log('✅ eligibleProductIds(集約, matrix基準) 再計算:', Array.from(ids));
    } catch (e) {
      console.warn('会社カード表示対象ID(ローカル, matrix)計算エラー:', e);
      setEligibleProductIds(new Set());
    }
  }, [selectedAllergies, allItems]);

  // データ変換処理
  const transformAndMergeData = (searchData) => {
    const transformedData = [];
    
    try {
      // デバッグ: transformAndMergeData で変換前のアイテム構造
      if (searchData && searchData.length > 0) {
        console.log('🔍 transformAndMergeData - 最初のアイテム構造:', searchData[0]);
      }
      
      searchData.forEach(item => {
        const menuItems = item.menu_items || [];
        console.log(`🔍 transformAndMergeData - ${item.name} のmenu_items数:`, menuItems.length);
        console.log(`🔍 transformAndMergeData - ${item.name} の元データ:`, { 
          id: item.id, 
          name: item.name, 
          category: item.category, 
          brand: item.brand 
        });
        
        // menu_itemsが存在する場合は、各menu_itemを個別のアイテムとして展開
        if (menuItems.length > 0) {
          menuItems.forEach((menuItem, index) => {
            const normalizedCategory = 'レストラン';
            const categoryTokens = Array.from(new Set([...(getCategoryTokens(item.category) || []), 'レストラン']));
              const transformedItem = {
              id: `${item.id}_${menuItem.id}`, // 一意ID（product_id + menu_item_id）
              product_id: item.id, // 元のproduct_idを保持
              menu_item_id: menuItem.id, // menu_item_idを保持
              name: item.name, // 会社名・店舗名（products.name）
              product_name: menuItem.name, // 商品名（menu_items.name）
              image: item.source_url || item.source_url2 || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
                rating: 4.0,
                reviewCount: 0,
                price: '¥500～¥1,500',
              area: item.store_locations?.[0]?.address || 'すべて',
                cuisine: '商品',
              category: normalizedCategory,
              category_tokens: categoryTokens,
              brand: item.brand || '',
              allergyInfo: createDefaultAllergyInfo(),
              allergyFree: [],
              product_allergies: (() => {
                console.log(`🔍 transformAndMergeData - ${menuItem.name} の product_allergies 処理開始:`, item.product_allergies);
                const result = processAllergies(item.product_allergies) || [];
                console.log(`🔍 transformAndMergeData - ${menuItem.name} の product_allergies 処理結果:`, result);
                return result;
              })(),
              product_allergies_matrix: (() => {
                console.log(`🔍 transformAndMergeData - ${menuItem.name} の product_allergies_matrix 処理開始:`, item.product_allergies_matrix);
                const result = item.product_allergies_matrix || [];
                console.log(`🔍 transformAndMergeData - ${menuItem.name} の product_allergies_matrix 処理結果:`, result);
                return result;
              })(),
              related_product: item,
              description: item.description || item.product_title || item.name || '',
              store_list_url: item.store_locations?.[0]?.store_list_url || null,
              store_locations: item.store_locations || [],
              menu_items: [menuItem], // 単一のmenu_item
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
          } else {
          // menu_itemsが存在しない場合は、従来通り1つのアイテムとして処理
          const displayName = item.product_title || item.name || '商品名不明';
            
            const transformedItem = {
            id: item.id,
            product_id: item.id,
            name: item.name, // 会社名・店舗名（products.name）
            product_name: displayName, // 商品名（product_title優先）
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
            product_allergies: (() => {
              console.log(`🔍 transformAndMergeData - ${displayName} の product_allergies 処理開始:`, item.product_allergies);
              const result = processAllergies(item.product_allergies) || [];
              console.log(`🔍 transformAndMergeData - ${displayName} の product_allergies 処理結果:`, result);
              return result;
            })(),
            product_allergies_matrix: (() => {
              console.log(`🔍 transformAndMergeData - ${displayName} の product_allergies_matrix 処理開始:`, item.product_allergies_matrix);
              const result = item.product_allergies_matrix || [];
              console.log(`🔍 transformAndMergeData - ${displayName} の product_allergies_matrix 処理結果:`, result);
              return result;
            })(),
            related_product: item,
            description: item.description || item.product_title || item.name || '',
            store_list_url: item.store_locations?.[0]?.store_list_url || null,
            store_locations: item.store_locations || [],
            menu_items: [],
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
          }
        });
      
      console.log('データ変換完了:', transformedData.length, '件');
      return transformedData;
      
    } catch (err) {
      console.error('データ変換エラー:', err);
      console.error('エラー詳細:', err.stack);
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

  // 初回のみ軽量データを取得（自動検索はしない）
  useEffect(() => {
    console.log('useEffect初回実行開始');
    testSupabaseConnection().then(() => {
      console.log('Supabase接続成功、初期データ取得開始（アレルギー項目のみ）');
      fetchAllergyItems();
      // 自動検索はせず、ユーザーの「検索」操作（executeSearch）でのみ fetch 実行
    }).catch((error) => {
      console.error('Supabase接続エラー:', error);
    });
  }, []);

  // 統合データ
  const allItemsData = allItems;
  console.log('🔍 allItemsData現在の値:', allItemsData?.length || 0, '件');

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
    // 会社カード表示条件: 選択アレルギーで direct以外（none/trace/香料）が1件でもある会社のみ
    if (eligibleProductIds && eligibleProductIds.size > 0) {
      console.log('🔍 eligibleProductIdsフィルタリング開始');
      console.log('🔍 フィルタリング前のアイテム数:', items.length);
      console.log('🔍 eligibleProductIds:', Array.from(eligibleProductIds));
      
      items = items.filter(item => {
        // item.idは "product_id_menu_item_id" 形式なので、product_id部分を抽出
        const productId = item.product_id || item.id.split('_')[0];
        const isEligible = eligibleProductIds.has(productId);
        if (!isEligible && (item.name === 'びっくりドンキー' || item.name === 'スシロー')) {
          console.log('❌ eligibleProductIdsで除外:', item.name, 'ID:', item.id, 'productId:', productId, 'eligibleProductIdsに含まれていない');
        } else if (isEligible && (item.name === 'びっくりドンキー' || item.name === 'スシロー')) {
          console.log('✅ eligibleProductIdsで通過:', item.name, 'ID:', item.id, 'productId:', productId);
        }
        return isEligible;
      });
      console.log('🔍 eligibleProductIdsフィルター後:', items.length, '件');
    }
    
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
        const isRestaurantByMenu = normalizedSelectedCategory === 'レストラン' && Array.isArray(item.menu_items) && item.menu_items.length > 0;
        const matches = isRestaurantByMenu || item.category === normalizedSelectedCategory || 
                       (Array.isArray(item.category_tokens) && item.category_tokens.includes(normalizedSelectedCategory));
        
        // デバッグログを追加
        if (item.name === 'びっくりドンキー' || item.name === 'スシロー') {
          console.log('🔍 カテゴリフィルターデバッグ - 会社:', item.name, {
            normalizedSelectedCategory,
            itemCategory: item.category,
            categoryTokens: item.category_tokens,
            menuItemsLength: item.menu_items?.length || 0,
            isRestaurantByMenu,
            categoryMatch: item.category === normalizedSelectedCategory,
            tokenMatch: Array.isArray(item.category_tokens) && item.category_tokens.includes(normalizedSelectedCategory),
            matches
          });
        }
        
        if (matches) {
          console.log('🔍 マッチしたアイテム:', item.name, 'カテゴリ:', item.category, 'トークン:', item.category_tokens, 'menu_items:', item.menu_items?.length || 0);
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
      console.log('🔍 エリアフィルター適用開始:', selectedArea);
      console.log('🔍 エリアフィルター前のアイテム数:', items.length);
      console.log('🔍 エリアフィルター前のアイテムサンプル:', items[0]?.area);
      
      const isPrefectureNameInput = isPrefectureName(selectedArea);
      console.log('🔍 都道府県名チェック:', isPrefectureNameInput);
      
      if (isPrefectureNameInput) {
        console.log('🔍 都道府県名フィルター適用（緩和版）');
        items = items.filter(item => {
          const isPrefectureNameItem = PREFECTURES.some(pref => 
            item.name === pref || item.area === pref
          );
          
          const areaMatch = isAreaMatch(item.area, selectedArea);
          
          // エリアフィルターを大幅に緩和
          const isAreaAll = item.area === 'すべて' || item.area === '全国' || !item.area;
          
          // レストランチェーンは全国展開が多いため、エリアフィルターを緩和
          const isRestaurantChain = item.category === 'レストラン' || item.category === 'restaurants';
          
          // 柔軟なマッチング：レストランはエリアフィルターを大幅に緩和
          const flexibleMatch = areaMatch || isAreaAll || 
            (item.area && item.area.toLowerCase().includes(selectedArea.toLowerCase())) ||
            (selectedArea && item.area && selectedArea.toLowerCase().includes(item.area.toLowerCase())) ||
            isRestaurantChain; // レストランチェーンはエリア制限を完全に緩和
          
          console.log('🔍 エリアマッチ詳細（緩和版）:', {
            itemName: item.name,
            itemArea: item.area,
            selectedArea,
            isPrefectureNameItem,
            areaMatch,
            isAreaAll,
            isRestaurantChain,
            flexibleMatch,
            result: flexibleMatch && (!isPrefectureNameItem || isRestaurantChain)
          });
          
          // レストランチェーンの場合は都道府県名チェックをスキップ
          return flexibleMatch && (!isPrefectureNameItem || isRestaurantChain);
        });
      } else {
        console.log('🔍 通常のエリアフィルター適用');
        items = items.filter(item => {
          const matches = (item.area === 'すべて') ||
                         (item.area && item.area.toLowerCase().includes(selectedArea.toLowerCase()));
          
          console.log('🔍 通常エリアマッチ詳細:', {
            itemName: item.name,
            itemArea: item.area,
            selectedArea,
            matches
          });
          
          return matches;
        });
      }
      
      console.log('🔍 エリアフィルター後のアイテム数:', items.length);
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