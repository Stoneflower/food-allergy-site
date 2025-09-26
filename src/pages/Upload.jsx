import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';
import { PREFECTURES } from '../constants/prefectures';
import imageCompression from 'browser-image-compression';
import MultiImageUploader from '../components/MultiImageUploader';

const { FiCamera, FiUpload, FiX, FiCheck, FiAlertCircle, FiEdit3, FiSave, FiImage, FiRefreshCw, FiTrendingUp } = FiIcons;

const Upload = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: 撮影/アップロード, 2: 情報確認, 3: 完了
  const [capturedImages, setCapturedImages] = useState([]); // 複数画像を管理
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [editedInfo, setEditedInfo] = useState({
    productName: '',
    brand: '',
    ingredients: [],
    allergens: [],
    lastUpdated: new Date(),
    confidence: 0
  });
  const [fragranceAllergens, setFragranceAllergens] = useState([]); // 香料に含まれるアレルギー
  const [contaminationAllergens, setContaminationAllergens] = useState([]); // コンタミネーション（混入可能性）
  const [contaminationOpen, setContaminationOpen] = useState(false); // コンタミ欄の開閉
  const [heatStatus, setHeatStatus] = useState('none'); // heated | none | uncertain | unused
  const [fragranceOpen, setFragranceOpen] = useState(false); // 香料セクション開閉
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);
  const [channels, setChannels] = useState({
    restaurant: false,
    takeout: false,
    supermarket: false,
    onlineShop: false
  });
  const [selectedPrefecture, setSelectedPrefecture] = useState('すべて');
  const [createdProductId, setCreatedProductId] = useState(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadErrorsState, setUploadErrorsState] = useState([]); // 画像アップロード失敗の可視化
  const [productCategories, setProductCategories] = useState([]); // 商品カテゴリ一覧
  const [selectedProductCategory, setSelectedProductCategory] = useState(null); // 選択された商品カテゴリ
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { allergyOptions } = useRestaurant();
  const location = useLocation();

  // ページ遷移時に重要情報バーまでスクロール
  useEffect(() => {
    // トップページから遷移した場合のみスクロール
    if (location.state?.fromHome) {
      setTimeout(() => {
        const importantNotice = document.querySelector('[data-testid="important-notice-bar"]');
        if (importantNotice) {
          importantNotice.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [location]);
  
  // アレルギーIDを文字列から整数に変換する関数
  const convertAllergyIdToInt = async (allergyIdString) => {
    try {
      const { data, error } = await supabase
        .from('allergy_items')
        .select('id')
        .eq('item_id', allergyIdString)
        .single();
      
      if (error) {
        console.error('アレルギーID変換エラー:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (err) {
      console.error('アレルギーID変換例外エラー:', err);
      return null;
    }
  };

  // 商品カテゴリを取得
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        
        if (error) {
          console.error(t('upload.messages.categoryFetchError'), error);
          return;
        }
        
        setProductCategories(data || []);
        console.log(t('upload.messages.categoryFetchSuccess'), data);
      } catch (err) {
        console.error(t('upload.messages.categoryFetchException'), err);
      }
    };

    fetchProductCategories();
  }, []);

  // カメラで撮影（複数枚対応）
  const handleCameraCapture = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleImageFiles(files, true); // 追加モードを指定
    }
  };

  // ファイルアップロード（複数枚対応）
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleImageFiles(files);
    }
  };

  // 画像の順番入れ替え（indexの画像を上下へ）
  const moveCapturedImage = (index, direction) => {
    setCapturedImages(prev => {
      const next = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = tmp;
      return next;
    });
  };

  // 複数画像ファイル処理（上限2枚）
  const handleImageFiles = (files, isAppendMode = false) => {
    // 追加モードの場合、既存画像数と合わせて上限チェック
    const currentCount = isAppendMode ? capturedImages.length : 0;
    const totalCount = currentCount + files.length;
    
    if (totalCount > 2) {
      const availableSlots = 2 - currentCount;
      if (availableSlots <= 0) {
        alert(t('upload.messages.maxImagesReached'));
        return;
      }
      alert(t('upload.messages.maxImagesRemaining', { count: availableSlots }));
      files = files.slice(0, availableSlots);
    }

    // 複数画像を読み込んで配列に格納
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Date.now() + Math.random(), // ユニークID
            url: e.target.result,
            file: file,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      if (isAppendMode) {
        // 追加モード：既存画像に新しい画像を追加
        setCapturedImages(prev => [...prev, ...newImages]);
      } else {
        // 置換モード：既存画像を新しい画像で置換
        setCapturedImages(newImages);
        // 手動入力用の初期データを設定
        initializeManualInput();
        // 画像を表示して手動入力フォームに進む
        setStep(2);
      }
    });
    
    // 複数枚選択されたことをユーザーに通知
    if (files.length > 1) {
      alert(t('upload.messages.imagesSelected', { count: files.length }));
    }
  };

  // 手動入力用の初期データ設定
  const initializeManualInput = () => {
    const initialInfo = {
      productName: '',
      brand: '',
      ingredients: [],
      allergens: [],
      confidence: 0,
      lastUpdated: new Date()
    };

    setExtractedInfo(initialInfo);
    setSimilarProducts([]);
    setShowSimilarProducts(false);
    
    setEditedInfo({
      productName: '',
      brand: '',
      ingredients: [],
      allergens: [],
      lastUpdated: new Date(),
      confidence: 0
    });
    setFragranceAllergens([]);
    setContaminationAllergens([]);
    setHeatStatus('none');
    setChannels({ restaurant: false, takeout: false, supermarket: false, onlineShop: false });
    setSelectedPrefecture('すべて');
  };

  // 類似商品を選択
  const selectSimilarProduct = (product) => {
    setEditedInfo({
      productName: product.name,
      brand: product.brand,
      ingredients: editedInfo.ingredients, // 現在の成分表示を保持
      allergens: product.allergens,
      notes: `${product.lastUpdated}の情報を基に更新`,
      lastUpdated: new Date(),
      confidence: product.confidence
    });
    setShowSimilarProducts(false);
  };

  // アレルギー成分の切り替え
  const toggleAllergen = (allergenId) => {
    setEditedInfo(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter(id => id !== allergenId)
        : [...prev.allergens, allergenId]
    }));
  };

  // 情報の更新
  const handleInfoChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 原材料リストの更新
  const updateIngredients = (newIngredients) => {
    setEditedInfo(prev => ({
      ...prev,
      ingredients: newIngredients.split('\n').filter(item => item.trim())
    }));
  };

  // 投稿完了（CSVコンバーターと同ロジック方針）
  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // 入力バリデーション（商品名またはブランドのどちらか必須）
      const productNameForSave = (editedInfo.brand || editedInfo.productName || '').trim();
      if (!productNameForSave) {
        alert('商品名またはブランド・メーカーのいずれかを入力してください');
        setIsProcessing(false);
        return;
      }
      // 利用シーンを products.category へ（複数選択時はスラッシュ区切り）
      const channelLabels = Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => ({
          restaurant: 'レストラン',
          takeout: 'テイクアウト',
          supermarket: 'スーパー',
          onlineShop: 'ネットショップ'
        }[k]))
        .filter(Boolean);

      const categoryValue = channelLabels.length > 0 ? channelLabels.join('/') : null;

      // 選択された最大2枚を圧縮→シンレンタルサーバーAPIにアップロード
      const uploadApiUrl = import.meta?.env?.VITE_UPLOAD_API_URL || 'https://stoneflower.net/api/upload.php';
      const uploadApiKey = import.meta?.env?.VITE_UPLOAD_API_KEY || '9d8c74e1b6a5f234c98b02e37f46d01e5bb2c8e5f77d9a6210c5d4939f82d7ab';
      // デバッグ: 環境値と対象ファイル
      console.log('[UploadAPI] url=', uploadApiUrl, 'key set=', !!uploadApiKey);
      try {
        console.log(
          '[UploadAPI] files=',
          capturedImages
            .filter(i => !!i?.file)
            .slice(0, 2)
            .map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type }))
        );
      } catch (e) {
        console.warn('[UploadAPI] files log failed:', e);
      }
      let uploadedUrls = [];
      let uploadErrors = [];
      if (capturedImages.length > 0 && uploadApiUrl && uploadApiKey) {
        const files = capturedImages.filter(img => !!img?.file).slice(0, 2).map(img => img.file);
        if (files.length > 0) {
          try {
            // 逐次アップロード + 軽いリトライ
            for (let idx = 0; idx < files.length; idx++) {
              const file = files[idx];
              const attempt = async (maxWidthOrHeight, initialQuality) => {
                // 圧縮（強制JPEG）
                const compressed = await imageCompression(file, {
                  maxSizeMB: 0.5,
                  maxWidthOrHeight,
                  initialQuality,
                  fileType: 'image/jpeg',
                  useWebWorker: true,
                });
                console.log(`[UploadAPI] start index=${idx}`, { name: file.name, size: file.size, type: file.type });
                console.log(`[UploadAPI] compressed index=${idx}`, { size: compressed.size, type: compressed.type });
                const fd = new FormData();
                fd.append('file', compressed, file.name);
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                const res = await fetch(uploadApiUrl, {
                  method: 'POST',
                  headers: { 'X-API-KEY': uploadApiKey, 'Accept': 'application/json' },
                  body: fd,
                  signal: controller.signal,
                });
                clearTimeout(timeout);
                console.log(`[UploadAPI] response index=${idx}`, res.status);
                let bodyTxt = '';
                try { bodyTxt = await res.clone().text(); } catch (e) { console.warn('[UploadAPI] read body failed:', e); }
                console.log(`[UploadAPI] body index=${idx}`, bodyTxt?.slice(0, 300));
                const json = bodyTxt ? JSON.parse(bodyTxt) : {};
                if (!res.ok || !json?.url) throw new Error(json?.error || 'upload_failed');
                console.log(`[UploadAPI] 成功 index=${idx}, url=${json.url}`);
                uploadedUrls.push(json.url);
              };
              try {
                await attempt(500, 0.5);
              } catch (e1) {
                console.warn(`[UploadAPI] retry index=${idx} with stronger compression`, e1);
                try {
                  await attempt(400, 0.45);
                } catch (e2) {
                  console.warn(`[UploadAPI] 失敗 index=${idx} after retry:`, e2);
                  uploadErrors.push({ index: idx, error: e2?.message || String(e2) });
                }
              }
            }
          } catch (e) {
            console.warn('UploadAPIの一部/全部に失敗しました:', e);
          }
        }
      }

      const uploadedImageUrl = uploadedUrls[0] || null; // 先頭URL
      const uploadedImageUrl2 = uploadedUrls[1] || null; // 2枚目URL（任意）
      // 失敗一覧を状態に反映
      setUploadErrorsState(uploadErrors);

      // マッピング変更:
      // products.product_title <= 商品名（editedInfo.productName）
      // products.name          <= ブランド・メーカー（editedInfo.brand）
      // products.brand         <= NULL（未使用）
      // products.category      <= 利用シーン
      // 画像URL               <= products.source_url

      // 既存チェック: 優先はバーコード、無ければ (name + product_title)
      const rawTitle = (editedInfo.productName || '').trim();
      const nameToSave = (editedInfo.brand || '').trim() || null;              // メーカー → products.name

      // product_title 正規化（200文字制限）
      const truncate200 = (s) => (s?.length > 200 ? s.slice(0, 200) : s);
      const withEllipsis = (s) => (s?.length > 199 ? (s.slice(0, 199) + '…') : s);
      const productTitleToSave = rawTitle ? truncate200(rawTitle) : null;

      // 既存照合用の候補（生値/200カット/199+…）
      const titleCandidates = Array.from(new Set([
        rawTitle || null,
        productTitleToSave,
        withEllipsis(rawTitle || '') || null,
      ].filter(Boolean)));

      let existingProduct = null;
      if (editedInfo.barcode && String(editedInfo.barcode).trim()) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('barcode', String(editedInfo.barcode).trim())
          .maybeSingle();
        if (error) throw error;
        existingProduct = data || null;
      }
      if (!existingProduct && nameToSave && titleCandidates.length > 0) {
        for (const titleCandidate of titleCandidates) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('name', nameToSave)
            .eq('product_title', titleCandidate)
            .maybeSingle();
          if (error) throw error;
          if (data) { existingProduct = data; break; }
        }
      }

      // さらに片方欠損するケースも考慮: product_title 単独でも既存チェック（すり抜け防止）
      if (!existingProduct && titleCandidates.length > 0) {
        for (const titleCandidate of titleCandidates) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('product_title', titleCandidate)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          if (data) { existingProduct = data; break; }
        }
      }

      let productId = null;
      if (existingProduct) {
        // 既存があれば更新（画像URLは取得できたときのみ上書き）
        const updatePayload = {
          name: nameToSave || existingProduct.name,
          product_title: productTitleToSave || existingProduct.product_title,
          brand: null,
          category: categoryValue,
          product_category_id: selectedProductCategory?.id || null,
          description: existingProduct.description || null,
          barcode: editedInfo.barcode ? String(editedInfo.barcode).trim() : (existingProduct.barcode || null),
          heat_status: heatStatus || 'none',
        };
        // 画像URLは products.source_url へ保存
        if (uploadedImageUrl) updatePayload.source_url = uploadedImageUrl;
        if (uploadedImageUrl2) updatePayload.source_url2 = uploadedImageUrl2;
        const { error: upErr } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', existingProduct.id);
        if (upErr) throw upErr;
        productId = existingProduct.id;
      } else {
        // 無ければ新規作成
        const insertPayload = {
          name: nameToSave,
          product_title: productTitleToSave,
          brand: null,
          category: categoryValue,
          product_category_id: selectedProductCategory?.id || null,
          description: null,
          source_url: uploadedImageUrl,
          source_url2: uploadedImageUrl2,
          image_url: null,
          image_id: null,
          barcode: editedInfo.barcode ? String(editedInfo.barcode).trim() : null,
          heat_status: heatStatus || 'none',
        };
        const { data: productData, error: productError } = await supabase
          .from('products')
          .insert([insertPayload])
          .select()
          .single();
        if (productError) throw productError;
        productId = productData?.id;
      }
      setCreatedProductId(productId || null);

      // 都道府県は「すべて」を含め常に store_locations.address として保存（既存あれば上書き、無ければ追加）
      if (productId && selectedPrefecture) {
        const { data: loc, error: locSelErr } = await supabase
          .from('store_locations')
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();
        if (locSelErr) throw locSelErr;
        if (loc) {
          const { error: locUpErr } = await supabase
            .from('store_locations')
            .update({ address: selectedPrefecture })
            .eq('id', loc.id);
          if (locUpErr) throw locUpErr;
        } else {
          const { error: locInsErr } = await supabase
            .from('store_locations')
            .insert([{ product_id: productId, address: selectedPrefecture, branch_name: null, phone: null, hours: null, notes: null, closed: null, source_url: null, store_list_url: null }]);
          if (locInsErr) throw locInsErr;
        }
      }

      // 画像由来アレルギーもCSVと同じ product_allergies_matrix に統一保存
      if (productId) {
        // 重複排除
        const uniqFragrance = Array.isArray(fragranceAllergens)
          ? Array.from(new Set(fragranceAllergens.filter(Boolean)))
          : [];
        const uniqDirect = Array.isArray(editedInfo.allergens)
          ? Array.from(new Set(editedInfo.allergens.filter(Boolean)))
          : [];
        const uniqContam = Array.isArray(contaminationAllergens)
          ? Array.from(new Set(contaminationAllergens.filter(Boolean)))
          : [];

        // 28品目（列名はmatrixのスキーマに合わせる）
        const standardSlugs = [
          'egg','milk','wheat','buckwheat','peanut','shrimp','crab','walnut','almond','abalone','squid','salmon_roe','orange','cashew','kiwi','beef','gelatin','sesame','salmon','mackerel','soybean','chicken','banana','pork','matsutake','peach','yam','apple','macadamia'
        ];

        // 基本はnone
        const baseRow = standardSlugs.reduce((acc, key) => { acc[key] = 'none'; return acc; }, {});

        const applyPresence = (slug, presence) => {
          if (!slug) return;
          const key = slug === 'soy' ? 'soybean' : slug;
          if (!(key in baseRow)) return;
          // 優先度: direct > trace > fragrance > none
          const current = baseRow[key];
          const rank = { direct: 3, trace: 2, fragrance: 1, none: 0 };
          if (rank[presence] > rank[current]) baseRow[key] = presence;
        };

        uniqDirect.forEach(slug => applyPresence(slug, 'direct'));
        uniqContam.forEach(slug => applyPresence(slug, 'trace'));
        uniqFragrance.forEach(slug => applyPresence(slug, 'fragrance'));

        // menu_item_id が NOT NULL + FK のため、製品全体既定用のダミー menu_item を用意
        let defaultMenuItemId = null;
        {
          const DEFAULT_NAME = '__default__';
          const { data: foundDefault, error: findErr } = await supabase
            .from('menu_items')
            .select('id')
            .eq('product_id', productId)
            .eq('name', DEFAULT_NAME)
            .maybeSingle();
          if (findErr) throw findErr;
          if (foundDefault?.id) {
            defaultMenuItemId = foundDefault.id;
          } else {
            const { data: insDefault, error: insDefErr } = await supabase
              .from('menu_items')
              .insert([{ product_id: productId, name: DEFAULT_NAME }])
              .select('id')
              .single();
            if (insDefErr) throw insDefErr;
            defaultMenuItemId = insDefault.id;
          }
        }

        const rowToUpsert = {
          product_id: productId,
          menu_item_id: defaultMenuItemId,
          // 画像アップロード画面で入力された商品名をmenu_nameへ保存
          menu_name: (productTitleToSave || editedInfo?.productName || null),
          ...baseRow
        };

        console.log('🔄 matrixへ統一保存行:', rowToUpsert);
        // 42P10対策: 複合ユニーク制約がない環境でも動くよう、手動UPSERT
        const { data: existingRow, error: selErr } = await supabase
          .from('product_allergies_matrix')
          .select('id')
          .eq('product_id', productId)
          .eq('menu_item_id', defaultMenuItemId)
          .maybeSingle();
        if (selErr) throw selErr;
        if (existingRow?.id) {
          const { error: updErr } = await supabase
            .from('product_allergies_matrix')
            .update(rowToUpsert)
            .eq('id', existingRow.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('product_allergies_matrix')
            .insert([rowToUpsert]);
          if (insErr) throw insErr;
        }
      }

      // 画像アップロードに失敗・未実施の場合も保存は継続し、後から追加できるUIを出す
      if ((uploadedUrls?.length || 0) === 0 && productId) {
        console.warn('画像なしで保存完了。後から画像を追加できます。');
      }

      setStep(3);
    } catch (err) {
      console.error('保存エラー:', err);
      alert(`保存に失敗しました: ${err?.message || '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // リセット
  const resetForm = () => {
    setStep(1);
    setCapturedImages([]);
    setExtractedInfo(null);
    setSimilarProducts([]);
    setShowSimilarProducts(false);
    setEditedInfo({
      productName: '',
      brand: '',
      ingredients: [],
      allergens: [],
      lastUpdated: new Date(),
      confidence: 0
    });
    setFragranceAllergens([]);
    setContaminationAllergens([]);
    setHeatStatus('none');
    setChannels({ restaurant: false, takeout: false, supermarket: false, onlineShop: false });
    setSelectedPrefecture('すべて');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > stepNum ? <SafeIcon icon={FiCheck} className="w-4 h-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNum ? 'bg-orange-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>情報取得</span>
            <span>情報確認</span>
            <span>投稿完了</span>
          </div>
        </div>

        {/* Step 1: 撮影・アップロード */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiCamera} className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                商品情報を入力
              </h2>
              <p className="text-gray-600">
                商品パッケージを撮影して、手動でアレルギー情報を入力できます
              </p>
            </div>

            {/* 常時マウントしておく隠し入力（カメラ/ファイル） */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {capturedImages.length === 0 && !isProcessing && (
              <div className="space-y-4">
                    {/* カメラ撮影ボタン */}
                    <button
                      onClick={() => { if (cameraInputRef.current) { cameraInputRef.current.value = ''; cameraInputRef.current.click(); } }}
                      className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-md"
                    >
                      <SafeIcon icon={FiCamera} className="w-6 h-6" />
                  <span className="text-lg font-semibold">カメラで撮影する（最大2枚）</span>
                    </button>

                    {/* ファイルアップロードボタン */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                    >
                      <SafeIcon icon={FiUpload} className="w-6 h-6" />
                  <span className="text-lg font-semibold">写真をアップロード（最大2枚）</span>
                    </button>

                    {/* 隠し入力は上で常時マウント済み */}

                {/* 撮影のコツ */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                    <SafeIcon icon={FiAlertCircle} className="w-5 h-5" />
                    <span>きれいに撮影するコツ</span>
                  </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 原材料名の部分を中心に撮影してください</li>
                      <li>• 明るい場所で撮影し、影が入らないようにしてください</li>
                    <li>• 文字がはっきり見えるよう、ピントを合わせてください</li>
                      <li>• パッケージ全体ではなく、成分表示部分を大きく撮影してください</li>
                    <li>• 最大2枚まで選択できます（参考用として表示されます）</li>
                    </ul>
                </div>
              </div>
            )}

            {/* 撮影した画像の表示 */}
            {capturedImages.length > 0 && !isProcessing && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    選択された画像 ({capturedImages.length}/2枚)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {capturedImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={`商品画像 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                        {index + 1}
                      </div>
                      {capturedImages.length > 1 && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveCapturedImage(index, 'up')}
                            className="px-2 py-1 text-[11px] bg-white/80 border rounded hover:bg-white disabled:opacity-50"
                            disabled={index === 0}
                          >↑</button>
                          <button
                            type="button"
                            onClick={() => moveCapturedImage(index, 'down')}
                            className="px-2 py-1 text-[11px] bg-white/80 border rounded hover:bg-white disabled:opacity-50"
                            disabled={index === capturedImages.length - 1}
                          >↓</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 2枚目撮影ボタン（1枚目の場合のみ表示） */}
                {capturedImages.length === 1 && (
                  <div className="text-center mb-4">
                    <button
                      onClick={() => { if (cameraInputRef.current) { cameraInputRef.current.value = ''; cameraInputRef.current.click(); } }}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 mx-auto"
                    >
                      <SafeIcon icon={FiCamera} className="w-4 h-4" />
                      <span>2枚目を撮影する</span>
                    </button>
                  </div>
                )}
                
                <div className="flex justify-center items-center gap-3">
                  <button
                    onClick={resetForm}
                    className="px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
                  >
                    画像を変更する
                  </button>
                  <button
                    onClick={() => {
                      if (!capturedImages || capturedImages.length === 0) {
                        alert('少なくとも1枚の画像を撮影または選択してください。');
                        return;
                      }
                      setStep(2);
                      
                      // 次のページに遷移後、撮影した画像を一番上に表示するようスクロール
                      setTimeout(() => {
                        const imageSection = document.querySelector('[data-testid="captured-images"]');
                        if (imageSection) {
                          imageSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                          });
                        }
                      }, 100);
                    }}
                    className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                  >
                    情報入力に進む
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* Step 2: 情報確認・編集 */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 類似商品の表示 */}
            {showSimilarProducts && similarProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-800 flex items-center space-x-2">
                    <SafeIcon icon={FiTrendingUp} className="w-5 h-5" />
                    <span>類似商品が見つかりました</span>
                  </h3>
                  <button
                    onClick={() => setShowSimilarProducts(false)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <SafeIcon icon={FiX} className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-yellow-700 text-sm mb-4">
                  既に登録されている類似商品があります。最新の情報に更新しますか？
                </p>
                <div className="space-y-3">
                  {similarProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">ブランド: {product.brand}</p>
                          <p className="text-xs text-gray-500">
                            最終更新: {product.lastUpdated} ({product.userCount}人が確認)
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.allergens.map(allergenId => {
                              const allergy = allergyOptions.find(a => a.id === allergenId);
                              return allergy ? (
                                <span key={allergenId} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                  {allergy.icon} {allergy.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => selectSimilarProduct(product)}
                          className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                        >
                          この情報を使用
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* 撮影画像 */}
            {capturedImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6" data-testid="captured-images">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <SafeIcon icon={FiImage} className="w-5 h-5" />
                  <span>撮影した画像 ({capturedImages.length}枚)</span>
                </h3>
                {capturedImages.length === 1 ? (
                  <img
                    src={capturedImages[0].url}
                    alt="撮影した商品画像"
                    className="w-full max-h-48 object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {capturedImages.map((image, index) => (
                      <div key={image.id} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={`商品画像 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 left-1 bg-blue-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                          {index + 1}
                        </div>
                        {capturedImages.length > 1 && (
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveCapturedImage(index, 'up')}
                              className="px-2 py-1 text-[11px] bg-white/80 border rounded hover:bg-white disabled:opacity-50"
                              disabled={index === 0}
                            >↑</button>
                            <button
                              type="button"
                              onClick={() => moveCapturedImage(index, 'down')}
                              className="px-2 py-1 text-[11px] bg-white/80 border rounded hover:bg-white disabled:opacity-50"
                              disabled={index === capturedImages.length - 1}
                            >↓</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 商品情報編集（画像の直下） */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <SafeIcon icon={FiEdit3} className="w-5 h-5" />
                <span>商品情報</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名
                  </label>
                  <input
                    type="text"
                    value={editedInfo.productName}
                    onChange={(e) => handleInfoChange('productName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="商品名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ブランド・メーカー
                  </label>
                  <input
                    type="text"
                    value={editedInfo.brand}
                    onChange={(e) => handleInfoChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ブランド名を入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品カテゴリ
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {productCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedProductCategory(category)}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          selectedProductCategory?.id === category.id
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-lg mr-2">{category.icon}</span>
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 原材料名は仕様により非表示 */}
              </div>
            </div>

            {/* 利用シーン */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">利用シーン</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'restaurant', label: 'レストラン' },
                  { key: 'takeout', label: 'テイクアウト' },
                  { key: 'supermarket', label: 'スーパー' },
                  { key: 'onlineShop', label: 'ネットショップ' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setChannels(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      channels[item.key]
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
                </div>

            {/* 都道府県 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">都道府県</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedPrefecture('すべて')}
                  className={`p-2 rounded border text-sm ${selectedPrefecture === 'すべて' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 hover:border-teal-300'}`}
                >
                  すべて
                </button>
                {PREFECTURES.map(pref => (
                  <button
                    key={pref}
                    onClick={() => setSelectedPrefecture(pref)}
                    className={`p-2 rounded border text-sm ${selectedPrefecture === pref ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-gray-200 hover:border-teal-300'}`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* 商品情報編集（重複を削除。画像直下に移動済み） */}

            {/* アレルギー成分選択 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">含まれるアレルギー成分</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {allergyOptions.map(allergy => (
                  <button
                    key={allergy.id}
                    onClick={() => toggleAllergen(allergy.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      editedInfo.allergens.includes(allergy.id)
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{allergy.icon}</div>
                      <div className="font-medium">{allergy.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 香料に含まれるアレルギー成分（折りたたみ） */}
            <div className="bg-white rounded-xl shadow-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-6"
                onClick={() => setFragranceOpen(v => !v)}
              >
                <h3 className="text-lg font-semibold">香料に含まれるアレルギー成分</h3>
                <span className="text-sm text-gray-500">
                  {fragranceAllergens.length > 0
                    ? `選択: ${fragranceAllergens.map(id => allergyOptions.find(a => a.id === id)?.name).filter(Boolean).join('、')}`
                    : (fragranceOpen ? '閉じる' : '開く')}
                </span>
              </button>
              {fragranceOpen && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allergyOptions.map(allergy => (
                      <button
                        key={`frag-${allergy.id}`}
                        onClick={() => setFragranceAllergens(prev => (
                          prev.includes(allergy.id)
                            ? prev.filter(id => id !== allergy.id)
                            : [...prev, allergy.id]
                        ))}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          fragranceAllergens.includes(allergy.id)
                            ? 'bg-purple-500 text-white border-purple-500'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{allergy.icon}</div>
                          <div className="font-medium">{allergy.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* コンタミネーション（混入の可能性） 折りたたみ */}
            <div className="bg-white rounded-xl shadow-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-6"
                onClick={() => setContaminationOpen(v => !v)}
              >
                <h3 className="text-lg font-semibold">コンタミネーション（混入の可能性）</h3>
                <span className="text-sm text-gray-500">
                  {contaminationAllergens.length > 0
                    ? `選択: ${contaminationAllergens.map(id => allergyOptions.find(a => a.id === id)?.name).filter(Boolean).join('、')}`
                    : (contaminationOpen ? '閉じる' : '開く')}
                </span>
              </button>
              {contaminationOpen && (
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allergyOptions.map(allergy => (
                      <button
                        key={`contam-${allergy.id}`}
                        onClick={() => setContaminationAllergens(prev => (
                          prev.includes(allergy.id)
                            ? prev.filter(id => id !== allergy.id)
                            : [...prev, allergy.id]
                        ))}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          contaminationAllergens.includes(allergy.id)
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{allergy.icon}</div>
                          <div className="font-medium">{allergy.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 加熱ステータス（コンタミの下に移動） */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">加熱ステータス</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'heated', label: '加熱（heated）' },
                  { key: 'none', label: '非加熱（none）' },
                  { key: 'uncertain', label: '未確定（uncertain）' },
                  { key: 'unused', label: '使用しない（unused）' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setHeatStatus(item.key)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      heatStatus === item.key
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* アップロード失敗の表示 */}
            {uploadErrorsState && uploadErrorsState.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm font-medium">一部の画像アップロードに失敗しました。</p>
                <ul className="mt-1 text-xs text-red-700 list-disc list-inside space-y-0.5">
                  {uploadErrorsState.map((e, i) => (
                    <li key={i}>画像{(e.index ?? i) + 1}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                やり直す
              </button>
              <button
                onClick={handleSubmit}
                disabled={!editedInfo.productName && !editedInfo.brand}
                className="flex-1 py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiSave} className="w-5 h-5" />
                <span>情報を共有する</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: 投稿完了 */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <SafeIcon icon={FiCheck} className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              投稿が完了しました！
            </h2>
            <p className="text-gray-600 mb-8">
              「{editedInfo.productName}」の情報が正常に共有されました。<br />
              多くの方に役立つ情報をありがとうございます！
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">共有された情報</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>商品名:</strong> {editedInfo.productName}</p>
                <p><strong>ブランド:</strong> {editedInfo.brand}</p>
                <p><strong>アレルギー成分:</strong> {
                  editedInfo.allergens.length > 0
                    ? editedInfo.allergens.map(id => allergyOptions.find(a => a.id === id)?.name).join('、')
                    : 'なし'
                }</p>
                <p><strong>香料由来:</strong> {
                  fragranceAllergens.length > 0
                    ? fragranceAllergens.map(id => allergyOptions.find(a => a.id === id)?.name).filter(Boolean).join('、')
                    : 'なし'
                }</p>
                <p><strong>利用シーン:</strong> {
                  Object.entries(channels).filter(([,v]) => v).map(([k]) => ({
                    restaurant: 'レストラン',
                    takeout: 'テイクアウト',
                    supermarket: 'スーパー',
                    onlineShop: 'ネットショップ'
                  }[k])).filter(Boolean).join('、') || '未選択'
                }</p>
                <p><strong>都道府県:</strong> {selectedPrefecture}</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetForm}
                className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                もう一つ投稿する
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          </motion.div>
        )}
      </div>
      {/* 後から画像追加用のモーダルは非表示（要望によりボタンも削除） */}
    </div>
  );
};

export default Upload;