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
  // 開発時のみ詳細ログを出す
  const isDev = typeof import.meta !== 'undefined' ? import.meta.env?.DEV === true : false;
  const devLog = (...args) => {
    if (isDev) console.log(...args);
  };
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
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

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
      'products': 'テイクアウト',
      'takeout': 'テイクアウト'
    };
    
    // 既に日本語の場合はそのまま返す
    if (['レストラン', 'スーパー', 'ネットショップ', '商品', 'テイクアウト', 'スーパー/ネットショップ', 'すべて'].includes(categoryText)) {
      return categoryText;
    }
    
    // 英語の場合は日本語に変換
    const lc = categoryText.toLowerCase().trim();
    // 複合カテゴリ（supermarkets + online）
    if (lc.includes('supermarket') && lc.includes('online')) {
      return 'スーパー/ネットショップ';
    }
    if (lc.includes('supermarkets') && lc.includes('online')) {
      return 'スーパー/ネットショップ';
    }
    if (lc.includes('supermarket/online') || lc.includes('supermarkets/online') || lc.includes('supermarket_online') || lc.includes('supermarkets_online')) {
      return 'スーパー/ネットショップ';
    }
    return categoryMap[lc] || '商品';
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
    // 「スーパー/ネットショップ」は両方に属するトークンを付与
    if (normalizedCategory === 'スーパー/ネットショップ') {
      result.add('スーパー');
      result.add('ネットショップ');
    }
    // 「すべて」は全カテゴリにマッチするため、補助的に全トークンを付与
    if (normalizedCategory === 'すべて') {
      result.add('レストラン');
      result.add('テイクアウト');
      result.add('スーパー');
      result.add('ネットショップ');
    }
    
    return Array.from(result);
  };

  // 検索実行関数
  const executeSearch = (overrides = {}) => {
    const o = overrides || {};
    const nextKeyword = typeof o.searchKeyword === 'string' ? o.searchKeyword : searchKeyword;
    const nextCategory = typeof o.selectedCategory === 'string' ? o.selectedCategory : selectedCategory;
    const nextAllergies = Array.isArray(o.selectedAllergies) ? o.selectedAllergies : selectedAllergies;
    const nextAreaInput = typeof o.areaInputValue === 'string' ? o.areaInputValue : areaInputValue;
    const nextSelectedArea = typeof o.selectedArea === 'string' ? o.selectedArea : selectedArea;
    console.log('検索実行:', { areaInputValue: nextAreaInput, selectedArea: nextSelectedArea, searchKeyword: nextKeyword, selectedCategory: nextCategory, selectedAllergiesCount: nextAllergies?.length || 0 });
    // 左パネルでの即時更新に対応: 入力欄 or selectedArea を参照
    const currentArea = (nextAreaInput && nextAreaInput.trim()) || (nextSelectedArea && nextSelectedArea.trim()) || '';
    if (!currentArea) {
      console.log('エリア入力が空のため、検索を実行しません');
      setSelectedArea('');
      return;
    }
    // 双方向に同期
    setSelectedArea(currentArea);
    if (currentArea !== areaInputValue) {
      setAreaInputValue(currentArea);
    }
    // 直前で受け取った条件も反映（レース条件回避）
    if (nextKeyword !== searchKeyword) setSearchKeyword(nextKeyword);
    if (nextCategory !== selectedCategory) setSelectedCategory(nextCategory);
    if (Array.isArray(nextAllergies) && nextAllergies !== selectedAllergies) setSelectedAllergies(nextAllergies);
    console.log('検索実行完了:', currentArea);
    
    // 初回のみデータ取得。それ以降はローカルフィルタのみ
    if (!hasLoadedAll) {
      console.log('初回のためfetchDataFromSupabaseを実行');
      fetchDataFromSupabase();
    } else {
      console.log('既に全件ロード済み。ローカルフィルタのみ実行');
      // ローカル再計算を促すため、eligibleProductIdsを再計算する依存（selectedAllergies/allItems）の更新に任せる
      // 明示的にsetAllItemsを触らずとも、表示側はgetFilteredItemsで再描画される
    }
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
          product_category_id,
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
      // 詳細ログは開発時のみ
      if (isDev && productsData && productsData.length > 0) {
        devLog('📦 最初の商品データ構造:', productsData[0]);
      }
      
      // データを変換（searchServiceの形式に合わせる）
      const data = productsData?.map(product => ({
        ...product,
        // categoryは元のデータベースの値を保持
        area: '全国' // デフォルト値
      })) || [];
      
      // 重いループ出力は開発時のみ
      if (isDev) {
        devLog('🔍 アレルギー情報デバッグ（開発時のみ）');
        data.slice(0, 3).forEach((item, index) => {
          devLog(`🔍 アイテム${index + 1}: ${item.name} - matrix.length:`, item.product_allergies_matrix?.length || 0);
        });
      }
      
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
      devLog('🔍 変換前のデータ:', data?.length || 0, '件');
      if (isDev) devLog('🔍 変換前のデータサンプル:', data?.[0]);
      
      // データベースの実際のカテゴリを詳しく確認
      if (isDev) {
        devLog('🔍 データベースの実際のカテゴリ（開発時のみ一部）');
        data?.slice(0, 5).forEach((item, index) => {
          devLog(`🔍 アイテム${index + 1}: ${item.name} - カテゴリ: "${item.category}"`);
        });
      }
      
      // 変換前のデータを詳しく確認
      if (isDev) {
        devLog('🔍 変換前のデータ詳細確認（開発時のみ一部）');
        data?.slice(0, 3).forEach((item, index) => {
          devLog(`🔍 変換前 アイテム${index + 1}: ${item.name}`);
        });
      }

      // 重い変換前にレンダリングへ制御を返す（UIフリーズ回避）
      await new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => resolve());
      } else {
          setTimeout(resolve, 0);
        }
      });
      
      const transformedData = transformAndMergeData(data || []);
      
      // 変換後のデータを詳しく確認
      if (isDev) {
        devLog('🔍 変換後のデータ詳細確認（開発時のみ一部）');
        devLog('🔍 変換後のデータ:', transformedData.length, '件');
        devLog('🔍 変換後のデータサンプル:', transformedData[0]);
      }
      
      // カテゴリの詳細ログ
      if (isDev) {
        transformedData.slice(0, 5).forEach((item, index) => {
          devLog(`🔍 アイテム${index + 1}:`, {
            name: item.name,
            category: item.category,
            category_tokens: item.category_tokens
          });
        });
      }
      
      console.log('✅✅✅ setAllItems呼び出し前 - transformedData長さ:', transformedData.length);
      if (isDev) devLog('🔍 setAllItems呼び出し前 - transformedDataサンプル:', transformedData[0]);
      setAllItems(transformedData);
      console.log('✅✅✅ setAllItems呼び出し完了 - allItems更新されました!');

      // 選択アレルギーに基づく会社カード表示対象IDのローカル即時計算（matrix基準: 通常/香料/コンタミを考慮）
      try {
        const hasAnyAllergies = (selectedAllergies && selectedAllergies.length > 0) ||
          (selectedFragranceForSearch && selectedFragranceForSearch.length > 0) ||
          (selectedTraceForSearch && selectedTraceForSearch.length > 0);
        if (!hasAnyAllergies) {
          const ids = new Set((transformedData || []).map(p => p.product_id));
          setEligibleProductIds(ids);
        } else {
          const normalAllergies = selectedAllergies || [];
          const fragranceAllergies = selectedFragranceForSearch || [];
          const traceAllergies = selectedTraceForSearch || [];
          const productIdToSafe = new Map();
          (transformedData || []).forEach(item => {
            const productId = item.product_id || (item.id ? String(item.id).split('_')[0] : null);
            if (!productId) return;
            let safeForThisItem = true;
            const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
            const matrix = (() => {
              if (rows.length === 0) return null;
              if (item.menu_item_id) {
                const exact = rows.find(r => String(r.menu_item_id) === String(item.menu_item_id));
                if (exact) return exact;
              }
              return rows[0];
            })();
            if (matrix) {
              const allUserAllergens = new Set([
                ...normalAllergies,
                ...fragranceAllergies,
                ...traceAllergies
              ]);
              allUserAllergens.forEach(slug => {
                const key = slug === 'soy' ? 'soybean' : slug;
                const raw = matrix[key];
                const v = (raw == null ? 'none' : String(raw)).trim().toLowerCase();
                if (v === 'direct' || v === 'fragrance' || v === 'trace') {
                  safeForThisItem = false;
                }
              });
            } else if (Array.isArray(item.product_allergies)) {
              const allUserAllergens = new Set([
                ...normalAllergies,
                ...fragranceAllergies,
                ...traceAllergies
              ]);
              const rel = item.product_allergies.filter(a => allUserAllergens.has(a.allergy_item_id));
              const hasDangerous = rel.some(a => a.presence_type === 'direct' || a.presence_type === 'fragrance' || a.presence_type === 'trace');
              if (hasDangerous) safeForThisItem = false;
            }
            const prev = productIdToSafe.has(productId) ? productIdToSafe.get(productId) : true;
            const next = prev && safeForThisItem;
            productIdToSafe.set(productId, next);
          });
          const ids = new Set();
          productIdToSafe.forEach((isSafe, productId) => { if (isSafe) ids.add(productId); });
          setEligibleProductIds(ids);
        }
      } catch (e) {
        console.warn('会社カード表示対象ID(初期, matrix)計算エラー:', e);
        setEligibleProductIds(new Set());
      }
      
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      setHasLoadedAll(true);
    }
  };

  // 選択アレルギー変更時に、マトリクスのみで eligibleProductIds をローカル再計算
  useEffect(() => {
    console.log('🔥🔥🔥 useEffect実行開始（アレルギーフィルタリング）');
    console.log('🔥 selectedAllergies:', selectedAllergies);
    console.log('🔥 selectedFragranceForSearch:', selectedFragranceForSearch);
    console.log('🔥 selectedTraceForSearch:', selectedTraceForSearch);
    console.log('🔥 allItems.length:', allItems?.length || 0);
    
    try {
      if (!allItems || allItems.length === 0) {
        console.log('🔥 早期リターン: allItemsが空');
        // 未ロードの場合は即座に取得を開始して、アレルギーフィルタの再計算へ繋げる
        if (!hasLoadedAll) {
          console.log('🚀 allItems未ロードのためfetchDataFromSupabaseを起動');
          fetchDataFromSupabase();
        }
        setEligibleProductIds(new Set());
        return;
      }
      
      // すべてのアレルギー設定が空の場合は全件表示
      const hasAnyAllergies = (selectedAllergies && selectedAllergies.length > 0) ||
                              (selectedFragranceForSearch && selectedFragranceForSearch.length > 0) ||
                              (selectedTraceForSearch && selectedTraceForSearch.length > 0);
      
      console.log('🔥 hasAnyAllergies:', hasAnyAllergies);
      
      if (!hasAnyAllergies) {
        console.log('🔥 早期リターン: アレルギー設定が空 → 既存のeligibleProductIdsを維持して終了');
        return;
      }

      // 通常アレルギー、香料アレルギー、コンタミアレルギーを取得
      const normalAllergies = selectedAllergies || [];
      const fragranceAllergies = selectedFragranceForSearch || [];
      const traceAllergies = selectedTraceForSearch || [];

      console.log('🔍 フィルタリング設定:', {
        normalAllergies: normalAllergies,
        fragranceAllergies: fragranceAllergies,
        traceAllergies: traceAllergies
      });

      // product_id 単位で、「選択アレルゲンを含む menu_item が1つでもあればその商品は危険」とする
      // 初期値は true（安全）とし、危険が見つかったら false に落とす
      const productIdToSafe = new Map();

      allItems.forEach(item => {
        const productId = item.product_id || (item.id ? String(item.id).split('_')[0] : null);
        if (!productId) return;

        let safeForThisItem = true; // デフォルトは安全（この menu_item 単位）

        const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
        const matrix = (() => {
          if (rows.length === 0) return null;
          if (item.menu_item_id) {
            const exact = rows.find(r => String(r.menu_item_id) === String(item.menu_item_id));
            if (exact) return exact;
          }
          return rows[0];
        })();

        if (matrix) {
          // ユーザーが選択した全アレルゲンを統合（重複排除）
          // どの区分（通常/香料/コンタミ）で選んでも、該当アレルゲンがdirect/fragrance/traceのいずれかで含まれていたら非表示
          const allUserAllergens = new Set([
            ...normalAllergies,
            ...fragranceAllergies,
            ...traceAllergies
          ]);

          console.log(`🔍 [${item.name || item.product_name}] ユーザー選択アレルゲン統合:`, Array.from(allUserAllergens));

          // 各アレルゲンについて、direct/fragrance/traceのいずれかが含まれていたら非表示
          allUserAllergens.forEach(slug => {
            const key = slug === 'soy' ? 'soybean' : slug;
            const raw = matrix[key];
            const v = (raw == null ? 'none' : String(raw)).trim().toLowerCase();
            
            if (v === 'direct' || v === 'fragrance' || v === 'trace') {
              console.log(`❌ [${item.name || item.product_name}] アレルゲン "${slug}" が ${v} → 非表示`);
              safeForThisItem = false; // どれか含まれていたら危険
            }
          });
        } else if (Array.isArray(item.product_allergies)) {
          // レガシー product_allergies 対応
          const allUserAllergens = new Set([
            ...normalAllergies,
            ...fragranceAllergies,
            ...traceAllergies
          ]);
          
          const rel = item.product_allergies.filter(a => allUserAllergens.has(a.allergy_item_id));
          const hasDangerous = rel.some(a => 
            a.presence_type === 'direct' || 
            a.presence_type === 'fragrance' || 
            a.presence_type === 'trace'
          );
          if (hasDangerous) {
            safeForThisItem = false;
          }
        }
        // CSV追加: 香料・コンタミ配列もチェック（どれか一致で危険）
        if (safeForThisItem) {
          const fragList = Array.isArray(item.product_fragrance_allergies) ? item.product_fragrance_allergies : [];
          const traceList = Array.isArray(item.product_trace_allergies) ? item.product_trace_allergies : [];
          const allUserAllergens = new Set([
            ...normalAllergies,
            ...fragranceAllergies,
            ...traceAllergies
          ]);
          const hasFragHit = fragList.some(slug => allUserAllergens.has(slug));
          const hasTraceHit = traceList.some(slug => allUserAllergens.has(slug));
          if (hasFragHit || hasTraceHit) {
            safeForThisItem = false;
          }
        }

        // 店舗/商品カードは「1つでも安全なメニューがあれば表示」（OR集約）に変更
        // 未設定なら現在の menu_item の判定で初期化。既に true なら維持。
        const prev = productIdToSafe.has(productId) ? productIdToSafe.get(productId) : false;
        const next = prev || safeForThisItem;
        productIdToSafe.set(productId, next);
      });

      const ids = new Set();
      productIdToSafe.forEach((isSafe, productId) => {
        if (isSafe) ids.add(productId);
      });
      setEligibleProductIds(ids);
      console.log('✅ eligibleProductIds(集約, matrix基準, 香料・コンタミ対応) 再計算:', Array.from(ids));
    } catch (e) {
      console.warn('会社カード表示対象ID(ローカル, matrix)計算エラー:', e);
      setEligibleProductIds(new Set());
    }
  }, [selectedAllergies, selectedFragranceForSearch, selectedTraceForSearch, allItems]);

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
            // products.category をそのまま正規化して利用
            const normalizedCategory = normalizeCategory(item.category);
            const categoryTokens = Array.from(new Set(getCategoryTokens(item.category) || []));
            // menu_item_id一致のマトリクス行を抽出
            const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
            const matrixRow = (() => {
              if (rows.length === 0) return null;
              const exact = rows.find(r => String(r.menu_item_id) === String(menuItem.id));
              return exact || rows[0];
            })();
            // presence事前計算
            const presenceBySlug = (() => {
              const result = {};
              const entries = Object.entries(matrixRow || {});
              entries.forEach(([key, val]) => {
                if (['id','product_id','menu_item_id','menu_name'].includes(key)) return;
                const slug = key === 'soybean' ? 'soy' : key;
                const v = (val == null ? '' : String(val)).trim().toLowerCase();
                if (v) result[slug] = v;
              });
              return result;
            })();
            // CSV向け: 香料・コンタミ配列（あれば保持）
            const fragranceList = Array.isArray(item.product_fragrance_allergies) ? item.product_fragrance_allergies : [];
            const traceList = Array.isArray(item.product_trace_allergies) ? item.product_trace_allergies : [];
              const transformedItem = {
              id: `${item.id}_${menuItem.id}`, // 一意ID（product_id + menu_item_id）
              product_id: item.id, // 元のproduct_idを保持
              menu_item_id: menuItem.id, // menu_item_idを保持
              name: item.name, // 会社名・店舗名（products.name）
              // 商品名は matrix.menu_name を優先し、なければ menu_items.name
              product_name: (matrixRow && matrixRow.menu_name) ? matrixRow.menu_name : menuItem.name,
              image: item.source_url || item.source_url2 || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
              // 元productsの画像URLを保持（表示判定用）
              source_url: item.source_url || null,
              source_url2: item.source_url2 || null,
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
              presenceBySlug,
              product_fragrance_allergies: fragranceList,
              product_trace_allergies: traceList,
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
              // 県名フィルタ最適化用の事前計算
              location_addresses: (item.store_locations || []).map(sl => sl?.address).filter(Boolean),
              has_all_address: (item.store_locations || []).some(sl => String(sl?.address || '').trim() === 'すべて'),
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
          // マトリクス先頭行からpresenceを作成
          const rows = Array.isArray(item.product_allergies_matrix) ? item.product_allergies_matrix : [];
          const matrixRow = rows[0] || null;
          const presenceBySlug = (() => {
            const result = {};
            const entries = Object.entries(matrixRow || {});
            entries.forEach(([key, val]) => {
              if (['id','product_id','menu_item_id','menu_name'].includes(key)) return;
              const slug = key === 'soybean' ? 'soy' : key;
              const v = (val == null ? '' : String(val)).trim().toLowerCase();
              if (v) result[slug] = v;
            });
            return result;
          })();
          // CSV向け: 香料・コンタミ配列（あれば保持）
          const fragranceList = Array.isArray(item.product_fragrance_allergies) ? item.product_fragrance_allergies : [];
          const traceList = Array.isArray(item.product_trace_allergies) ? item.product_trace_allergies : [];
            
            const transformedItem = {
            id: item.id,
            product_id: item.id,
            name: item.name, // 会社名・店舗名（products.name）
            product_name: displayName, // 商品名（product_title優先）
            image: item.source_url || item.source_url2 || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
            // 元productsの画像URLを保持（表示判定用）
            source_url: item.source_url || null,
            source_url2: item.source_url2 || null,
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
            presenceBySlug,
            product_fragrance_allergies: fragranceList,
            product_trace_allergies: traceList,
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
            // 県名フィルタ最適化用の事前計算
            location_addresses: (item.store_locations || []).map(sl => sl?.address).filter(Boolean),
            has_all_address: (item.store_locations || []).some(sl => String(sl?.address || '').trim() === 'すべて'),
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
      
      console.log('✅✅✅ データ変換完了:', transformedData.length, '件');
      return transformedData;
      
    } catch (err) {
      console.error('❌❌❌ データ変換エラー:', err);
      console.error('❌ エラー詳細:', err.stack);
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
    // 会社カード表示条件: 選択アレルギーがある場合は eligibleProductIds を必ず適用
    const hasAnySelectedAllergies = (selectedAllergies && selectedAllergies.length > 0) ||
      (selectedFragranceForSearch && selectedFragranceForSearch.length > 0) ||
      (selectedTraceForSearch && selectedTraceForSearch.length > 0);

    if (hasAnySelectedAllergies) {
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

      // 会社カード通過後: メニュー単位の危険判定で最終除外（direct/fragrance/trace のいずれか一致で除外）
      const normalAllergies = selectedAllergies || [];
      const fragranceAllergies = selectedFragranceForSearch || [];
      const traceAllergies = selectedTraceForSearch || [];
      const allUserAllergens = new Set([...normalAllergies, ...fragranceAllergies, ...traceAllergies]);

      const isMenuSafe = (it) => {
        // matrix優先
        const rows = Array.isArray(it.product_allergies_matrix) ? it.product_allergies_matrix : [];
        const matrix = (() => {
          if (rows.length === 0) return null;
          if (it.menu_item_id) {
            const exact = rows.find(r => String(r.menu_item_id) === String(it.menu_item_id));
            if (exact) return exact;
          }
          return rows[0];
        })();
        if (matrix) {
          for (const slug of allUserAllergens) {
            const key = slug === 'soy' ? 'soybean' : slug;
            const raw = matrix[key];
            const v = (raw == null ? 'none' : String(raw)).trim().toLowerCase();
            if (v === 'direct' || v === 'fragrance' || v === 'trace') return false;
          }
          return true;
        }
        // レガシーデータ（念のため）
        if (Array.isArray(it.product_allergies)) {
          const rel = it.product_allergies.filter(a => allUserAllergens.has(a.allergy_item_id));
          return !rel.some(a => a.presence_type === 'direct' || a.presence_type === 'fragrance' || a.presence_type === 'trace');
        }
        return true;
      };

      const before = items.length;
      items = items.filter(isMenuSafe);
      console.log(`🔍 メニュー単位の危険除外後: ${before} → ${items.length} 件`);
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
        'products': 'テイクアウト',
        'takeout': 'テイクアウト'
      };
      const normalizedSelectedCategory = categoryMap[selectedCategory] || selectedCategory;
      console.log('🔍 正規化されたカテゴリ:', normalizedSelectedCategory);

      // 要件に基づく許容カテゴリ集合
      let allowed = new Set();
      if (normalizedSelectedCategory === 'レストラン') {
        allowed = new Set(['レストラン', 'すべて']);
      } else if (normalizedSelectedCategory === 'スーパー') {
        allowed = new Set(['スーパー', 'ネットショップ', 'スーパー/ネットショップ', 'すべて']);
      } else if (normalizedSelectedCategory === 'ネットショップ') {
        allowed = new Set(['スーパー', 'ネットショップ', 'スーパー/ネットショップ', 'すべて']);
      } else if (normalizedSelectedCategory === 'テイクアウト') {
        allowed = new Set(['テイクアウト', 'すべて']);
      } else {
        // 不明値は念のため全件通過
        allowed = null;
      }

      if (allowed) {
      items = items.filter(item => {
          const tokens = Array.isArray(item.category_tokens) ? item.category_tokens : [];
          const rawCat = item.category;
          const normCat = typeof rawCat === 'string' ? rawCat.trim() : rawCat;
          const normalizedCatNoSpace = typeof normCat === 'string' ? normCat.replace(/\s+/g, '') : normCat;
          const isAll = normalizedCatNoSpace === 'すべて' || tokens.includes('すべて');
          const categoryMatch = normalizedCatNoSpace && (allowed.has(normalizedCatNoSpace) || isAll);
          const tokenMatch = tokens.some(t => allowed.has(t) || t === 'すべて');
          // レストラン判定の安全策: category未設定(空/空白/全角空白のみ)時のみ menu_items で補完
          const isRestaurantByMenu = normalizedSelectedCategory === 'レストラン'
            && (!normalizedCatNoSpace || normalizedCatNoSpace.length === 0)
            && Array.isArray(item.menu_items) && item.menu_items.length > 0;
          const matches = categoryMatch || tokenMatch || isRestaurantByMenu;
          return matches;
        });
      }
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
        // 入力から都道府県名を抽出（カンマ/スペース/読点区切りにも対応）
        const input = selectedArea.trim();
        const rawTokens = input.split(/[、,\s]+/).filter(Boolean);
        const selectedPrefectures = PREFECTURES.filter(pref => rawTokens.some(t => pref.includes(t) || t.includes(pref)));
        console.log('🔍 都道府県名フィルター適用（厳格, store_locations.addressベース）', { input, rawTokens, selectedPrefectures });
        items = items.filter(item => {
          const addresses = Array.isArray(item.location_addresses) ? item.location_addresses :
            (Array.isArray(item.store_locations) ? item.store_locations.map(sl => sl?.address).filter(Boolean) : []);
          const hasAllFlag = !!item.has_all_address || addresses.some(addr => String(addr).trim() === 'すべて');
          const hasAnySelected = selectedPrefectures.length > 0
            ? addresses.some(addr => selectedPrefectures.some(pref => isAreaMatch(addr, pref)))
            : addresses.some(addr => isAreaMatch(addr, selectedArea));
          const keep = hasAllFlag || hasAnySelected;
          
          // 詳細デバッグログ
          if (item.name === '菓道' || item.name === '日清シスコ') {
            console.log(`🔍🔍🔍 [${item.name}] 都道府県フィルター詳細:`, {
              itemName: item.name,
              product_id: item.product_id,
              has_all_address: item.has_all_address,
              location_addresses: item.location_addresses,
              store_locations_count: item.store_locations?.length,
              addresses: addresses,
              hasAllFlag: hasAllFlag,
              hasAnySelected: hasAnySelected,
              selectedArea: selectedArea,
              keep: keep
            });
          }
          
          // 都道府県指定時: addressが"すべて"なら常に表示。そうでなければ選択都道府県のいずれかに一致する場合のみ表示
          return keep;
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