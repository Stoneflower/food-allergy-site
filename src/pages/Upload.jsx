import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
// PDFアップローダは廃止（CSV取込へ移行）

const { FiCamera, FiUpload, FiX, FiCheck, FiAlertCircle, FiEdit3, FiSave, FiImage, FiRefreshCw, FiTrendingUp, FiFileText } = FiIcons;

const Upload = () => {
  const [step, setStep] = useState(1); // 1: 撮影/アップロード, 2: 情報確認, 3: 完了
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [editedInfo, setEditedInfo] = useState({
    productName: '',
    brand: '',
    ingredients: [],
    allergens: [],
    notes: '',
    lastUpdated: new Date(),
    confidence: 0
  });
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);
  // PDFは廃止
  const [uploadType, setUploadType] = useState('image'); // 'image' or 'csv'
  const [csvFile, setCsvFile] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const readFileAsText = (file) => new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('ファイル読み込みに失敗しました'));
      reader.readAsText(file, 'utf-8');
    } catch (e) {
      reject(e);
    }
  });
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { allergyOptions, userSettings } = useRestaurant();

  // カメラで撮影
  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // ファイルアップロード
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  // 画像ファイル処理
  const handleImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target.result);
      processImage(file);
    };
    reader.readAsDataURL(file);
  };

  // 画像解析処理（モック）
  const processImage = async (file) => {
    setIsProcessing(true);
    
    // モック処理：実際にはOCRやAI画像解析を行う
    setTimeout(() => {
      const mockExtractedInfo = {
        productName: 'グルテンフリー米粉パン',
        brand: 'アレルギー対応パン工房',
        ingredients: [
          '米粉（国産）',
          '砂糖',
          '植物油脂',
          '食塩',
          'イースト',
          'キサンタンガム'
        ],
        allergens: ['soy'], // 大豆由来成分が含まれている例
        confidence: 85,
        lastUpdated: new Date()
      };

      // 類似商品の検索（モック）
      const mockSimilarProducts = [
        {
          id: 'similar1',
          name: 'グルテンフリー米粉パン（別ブランド）',
          brand: '健康パン工房',
          lastUpdated: '2024年1月15日',
          allergens: ['soy'],
          confidence: 92,
          userCount: 15
        },
        {
          id: 'similar2', 
          name: 'グルテンフリー米粉パン（同ブランド・旧版）',
          brand: 'アレルギー対応パン工房',
          lastUpdated: '2023年11月20日',
          allergens: ['wheat', 'soy'],
          confidence: 78,
          userCount: 8
        }
      ];

      setExtractedInfo(mockExtractedInfo);
      setSimilarProducts(mockSimilarProducts);
      setShowSimilarProducts(mockSimilarProducts.length > 0);
      
      setEditedInfo({
        productName: mockExtractedInfo.productName,
        brand: mockExtractedInfo.brand,
        ingredients: mockExtractedInfo.ingredients,
        allergens: mockExtractedInfo.allergens,
        notes: '',
        lastUpdated: mockExtractedInfo.lastUpdated,
        confidence: mockExtractedInfo.confidence
      });
      setIsProcessing(false);
      setStep(2);
    }, 2000);
  };

  // PDF解析結果の処理
  const handlePDFResult = (pdfResult) => {
    // レストラン情報が含まれている場合の処理
    const restaurantInfo = pdfResult.restaurantInfo || {};
    
    const mockExtractedInfo = {
      productName: restaurantInfo.name || 'PDFから抽出された情報',
      brand: restaurantInfo.category || 'レストラン・店舗',
      ingredients: pdfResult.consolidatedInfo.menuItems || [],
      allergens: pdfResult.consolidatedInfo.foundAllergies || [],
      confidence: pdfResult.consolidatedInfo.confidence || 0,
      lastUpdated: new Date(),
      pdfSource: true,
      warnings: pdfResult.consolidatedInfo.warnings || [],
      restaurantInfo: restaurantInfo
    };

    setExtractedInfo(mockExtractedInfo);
    setEditedInfo({
      productName: mockExtractedInfo.productName,
      brand: mockExtractedInfo.brand,
      ingredients: mockExtractedInfo.ingredients,
      allergens: mockExtractedInfo.allergens,
      notes: [
        ...mockExtractedInfo.warnings,
        restaurantInfo.description ? `店舗説明: ${restaurantInfo.description}` : '',
        restaurantInfo.area ? `エリア: ${restaurantInfo.area}` : ''
      ].filter(Boolean).join('\n'),
      lastUpdated: mockExtractedInfo.lastUpdated,
      confidence: mockExtractedInfo.confidence
    });
    
    // PDF機能は廃止: 直接Step遷移のみ
    setStep(2);
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

  // 投稿完了（PDF解析結果は Functions 経由で保存を発火）
  const handleSubmit = async () => {
    try {
    setIsProcessing(true);
      // PDF由来の場合は保存APIを発火
      if (extractedInfo?.pdfSource) {
        // ID正規化（DBのitem_idに合わせる）
        const normalizeId = (id) => (id === 'soy' ? 'soybean' : id);

        const product = {
          name: (editedInfo.productName || '').trim(),
          brand: editedInfo.brand || null,
          category: extractedInfo.pdfSource ? 'レストラン・店舗' : null
        };
        if (!product.name) {
          alert('店舗名（商品名）を入力してください');
          setIsProcessing(false);
          return;
        }

        // presence/amount 自動推定
        const textBlob = [
          ...(extractedInfo?.warnings || []),
          ...(Array.isArray(editedInfo.ingredients) ? editedInfo.ingredients : [])
        ].join(' ');
        const hasFragrance = /香料/.test(textBlob);
        const processedHeatedRegex = /(加工品|加熱|加熱済|加熱処理|焼成|ボイル|揚げ|フライ|炒め|蒸し|レトルト|殺菌)/;
        const isProcessedHeated = processedHeatedRegex.test(textBlob);

        // 28品目すべてを保存（未検出は presence_type='none'）
        const allIds = (Array.isArray(allergyOptions) ? allergyOptions : []).map(a => normalizeId(a.id));
        // OCR由来の検出があるのにUIで未操作の場合のフォールバック
        const baseSelected = Array.isArray(editedInfo.allergens) && editedInfo.allergens.length > 0
          ? editedInfo.allergens
          : (Array.isArray(extractedInfo?.allergens) ? extractedInfo.allergens : []);
        const selected = new Set(baseSelected.map(normalizeId));
        const allergies = allIds.map(id => {
          const detected = selected.has(id);
          const presence = detected ? (hasFragrance ? 'trace' : (isProcessedHeated ? 'heated' : 'direct')) : 'none';
          const amount = detected ? (hasFragrance ? 'trace' : 'unknown') : 'none';
          const note = detected ? (hasFragrance ? '香料表記を検出' : (isProcessedHeated ? '加工/加熱表記を検出' : 'shared from upload page')) : '';
          return {
            allergy_item_id: id,
            presence_type: presence,
            amount_level: amount,
            notes: note
          };
        });

        console.log('POST /.netlify/functions/save-product', { product, allergies });
        // メニュー行の組み立て（PDFのメニュー項目ごとに28品目を作成）
        const allIdsForMenu = (Array.isArray(allergyOptions) ? allergyOptions : []).map(a => normalizeId(a.id));
        const buildMenuAllergies = (menuName) => {
          // 簡易推定: 全メニューに同じpresenceを適用（将来: 行ごと推定に拡張）
          return allIdsForMenu.map(id => ({
            allergy_item_id: id,
            presence_type: hasFragrance ? 'trace' : (isProcessedHeated ? 'heated' : 'none'),
            amount_level: hasFragrance ? 'trace' : (isProcessedHeated ? 'unknown' : 'none'),
            notes: hasFragrance ? '香料表記を検出' : (isProcessedHeated ? '加工/加熱表記を検出' : '')
          }));
        };
        const menuItems = Array.isArray(extractedInfo?.ingredients) && extractedInfo.ingredients.length > 0
          ? extractedInfo.ingredients.slice(0, 50).map(name => ({ name, allergies: buildMenuAllergies(name) }))
          : [];

        const resp = await fetch('/.netlify/functions/save-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, allergies, menuItems })
        });
        const txt = await resp.text();
        if (!resp.ok) {
          console.error('save-product error', resp.status, txt);
          alert(`保存エラー: ${resp.status}`);
          setIsProcessing(false);
          return;
        }
        console.log('save-product ok', txt);
      }

      // 保存成功または画像由来（将来拡張）の場合は完了画面へ
      setIsProcessing(false);
      setStep(3);
    } catch (e) {
      console.error('投稿保存中エラー', e);
      alert(`投稿に失敗しました: ${e.message}`);
      setIsProcessing(false);
    }
  };

  // あなた向け判定（表を見せずに可否表示）
  const getPersonalVerdict = () => {
    const allowTrace = !!userSettings?.allowTrace; // 既定: false
    const allowHeated = !!userSettings?.allowHeated; // 既定: true
    const hasSelection = Array.isArray(editedInfo.allergens) && editedInfo.allergens.length > 0;
    // 判定素材（注意書き + メニュー/原材料）
    const textBlob = [
      ...(extractedInfo?.warnings || []),
      ...(Array.isArray(editedInfo.ingredients) ? editedInfo.ingredients : [])
    ].join(' ');
    const hasFragrance = /香料/.test(textBlob);
    const processedHeatedRegex = /(加工品|加熱|加熱済|加熱処理|焼成|ボイル|揚げ|フライ|炒め|蒸し|レトルト|殺菌)/;
    const isProcessedHeated = processedHeatedRegex.test(textBlob);

    if (!hasSelection) {
      return { level: 'ok', label: '食べられます', reason: '該当アレルギー成分は検出されませんでした' };
    }

    // 単純な優先順: direct > heated > trace
    if (!hasFragrance && !isProcessedHeated) {
      return { level: 'ng', label: '食べられません', reason: '該当アレルギーが含有されています' };
    }
    if (isProcessedHeated) {
      return allowHeated
        ? { level: 'ok', label: '食べられます', reason: '該当アレルギーは加熱済み相当（許容設定）' }
        : { level: 'caution', label: '条件付きでOK', reason: '加熱済みですが許容設定が必要です' };
    }
    if (hasFragrance) {
      return allowTrace
        ? { level: 'ok', label: '食べられます', reason: '香料レベルの微量（許容設定）' }
        : { level: 'caution', label: '条件付きでOK', reason: '香料レベルの微量。微量許容でOKになります' };
    }
    return { level: 'caution', label: '条件付きでOK', reason: '詳細不明のためご注意ください' };
  };

  // リセット
  const resetForm = () => {
    setStep(1);
    setCapturedImage(null);
    setExtractedInfo(null);
    setSimilarProducts([]);
    setShowSimilarProducts(false);
    setUploadType('image');
    setEditedInfo({
      productName: '',
      brand: '',
      ingredients: [],
      allergens: [],
      notes: '',
      lastUpdated: new Date(),
      confidence: 0
    });
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
                アレルギー情報を取得
              </h2>
              <p className="text-gray-600">
                商品パッケージの撮影またはレストランのPDFから情報を取得できます
              </p>
            </div>

            {/* Upload Type Selection */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 max-w-md mx-auto">
                <button
                  onClick={() => setUploadType('image')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    uploadType === 'image'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiCamera} className="w-4 h-4" />
                  <span>商品撮影</span>
                </button>
                {/* PDF解析は廃止 */}
                <button
                  onClick={() => setUploadType('csv')}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    uploadType === 'csv'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiFileText} className="w-4 h-4" />
                  <span>CSV取込</span>
                </button>
              </div>
            </div>

            {!capturedImage && !isProcessing && (
              <div className="space-y-4">
                {uploadType === 'image' ? (
                  <>
                    {/* カメラ撮影ボタン */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-md"
                    >
                      <SafeIcon icon={FiCamera} className="w-6 h-6" />
                      <span className="text-lg font-semibold">カメラで撮影する</span>
                    </button>

                    {/* ファイルアップロードボタン */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                    >
                      <SafeIcon icon={FiUpload} className="w-6 h-6" />
                      <span className="text-lg font-semibold">写真をアップロード</span>
                    </button>

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </>
                ) : (
                  <>
                    {/* CSVアップロード */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <h3 className="font-semibold mb-2">CSVアップロード（店舗名＋メニュー＋28品目）</h3>
                        <div className="flex items-center gap-3">
                          <input type="file" accept=".csv" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setCsvFile(file);
                          }} />
                    <button
                            disabled={!csvFile || csvImporting}
                            onClick={async () => {
                            try {
                            if (!csvFile) return;
                            setCsvImporting(true);
                            const text = await readFileAsText(csvFile);
                            const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map(r => {
                              // CSVの分割を改善：カンマで分割し、空の要素も保持
                              const parts = r.split(',');
                              // 38列に調整（不足分は空文字で埋める）
                              while (parts.length < 38) {
                                parts.push('');
                              }
                              return parts.map(s => s.replace(/^"|"$/g,'').trim());
                            });
                            const header = rows.shift();
                            // 期待ヘッダー（指定順 + 住所・電話情報 + 店舗リストURL）
                            const expected = ['店舗名','系列','カテゴリ','住所','電話番号','営業時間','定休日','情報元URL','店舗リストURL','メニュー名','卵','乳','小麦','そば','落花生','えび','かに','くるみ','大豆','牛肉','豚肉','鶏肉','さけ','さば','あわび','いか','いくら','オレンジ','キウイフルーツ','もも','りんご','やまいも','ゼラチン','バナナ','カシューナッツ','ごま','アーモンド','まつたけ'];
                            if (!header || expected.some((h,i)=>header[i]!==h)) {
                              alert('ヘッダーが想定と異なります。テンプレートCSVをご利用ください。');
                              setCsvImporting(false); return;
                            }
                            // 日本語→IDマップ
                            const idMap = { '卵':'egg','乳':'milk','小麦':'wheat','そば':'buckwheat','落花生':'peanut','えび':'shrimp','かに':'crab','くるみ':'walnut','大豆':'soybean','牛肉':'beef','豚肉':'pork','鶏肉':'chicken','さけ':'salmon','さば':'mackerel','あわび':'abalone','いか':'squid','いくら':'salmon_roe','オレンジ':'orange','キウイフルーツ':'kiwi','もも':'peach','りんご':'apple','やまいも':'yam','ゼラチン':'gelatin','バナナ':'banana','カシューナッツ':'cashew','ごま':'sesame','アーモンド':'almond','まつたけ':'matsutake' };
                            console.log('idMap:', idMap);
                            console.log('=== CSV取込開始:', new Date().toISOString(), '===');
                            const toPresence = (mark) => (mark==='●' ? 'direct' : (mark==='△' ? 'trace' : 'none'));

                            // 47都道府県の完全なリスト
                            const allPrefectures = [
                                '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
                                '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
                                '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
                                '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
                                '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
                                '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
                                '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
                            ];

                            // CSVから抽出された都道府県を取得
                            const csvPrefectures = new Set();
                            console.log('🔍 CSV解析開始:');
                            for (const cols of rows) {
                                const address = cols[3]; // D列（住所）
                                if (address && allPrefectures.includes(address)) {
                                    csvPrefectures.add(address);
                                    console.log('  - 検出された都道府県:', address);
                                } else if (address) {
                                    console.log('  - 無効な住所:', address);
                                }
                            }
                            console.log('CSV解析完了 - 検出された都道府県数:', csvPrefectures.size);
                            console.log('検出された都道府県一覧:', Array.from(csvPrefectures).sort());
                            
                            // 鳥取県、島根県の存在確認
                            const hasTottori = csvPrefectures.has('鳥取県');
                            const hasShimane = csvPrefectures.has('島根県');
                            console.log('🔍 CSV内の都道府県確認:');
                            console.log('  - 鳥取県が含まれている:', hasTottori);
                            console.log('  - 島根県が含まれている:', hasShimane);
                            
                            // 鳥取県、島根県が含まれている場合は警告
                            if (hasTottori || hasShimane) {
                                console.warn('⚠️ CSVに鳥取県、島根県が含まれています。これらは自動補完機能で追加された可能性があります。');
                            }

                            // 欠落している都道府県を特定
                            const missingPrefectures = allPrefectures.filter(pref => !csvPrefectures.has(pref));
                            console.log('📊 CSV解析結果:');
                            console.log('  - CSVに含まれている都道府県数:', csvPrefectures.size);
                            console.log('  - CSVに含まれている都道府県:', Array.from(csvPrefectures).sort());
                            console.log('  - 欠落している都道府県:', missingPrefectures);
                            console.log('  - 欠落件数:', missingPrefectures.length);
                            
                            // 47都道府県の完全なリストとの比較
                            console.log('📋 47都道府県の完全なリスト:');
                            console.log('  - 総数:', allPrefectures.length);
                            console.log('  - リスト:', allPrefectures.sort());
                            
                            // 鳥取県、島根県の詳細確認
                            console.log('🔍 鳥取県、島根県の詳細確認:');
                            console.log('  - 鳥取県がCSVに含まれている:', csvPrefectures.has('鳥取県'));
                            console.log('  - 島根県がCSVに含まれている:', csvPrefectures.has('島根県'));
                            console.log('  - 鳥取県が欠落リストに含まれている:', missingPrefectures.includes('鳥取県'));
                            console.log('  - 島根県が欠落リストに含まれている:', missingPrefectures.includes('島根県'));

                            // 自動補完機能を無効化：実際のCSVデータのみを処理
                            const completedRows = [...rows];
                            console.log('処理対象行数:', completedRows.length, '(自動補完なし)');
                            
                            // 欠落している都道府県がある場合は警告を表示
                            console.log('🔍 削除処理の条件チェック:');
                            console.log('- missingPrefectures.length:', missingPrefectures.length);
                            console.log('- missingPrefectures:', missingPrefectures);
                            console.log('- csvPrefectures.size:', csvPrefectures.size);
                            console.log('- allPrefectures.length:', allPrefectures.length);
                            
                            // 削除処理の条件確認
                            const shouldDelete = missingPrefectures.length > 0;
                            console.log('🔧 削除処理の条件確認:');
                            console.log('  - missingPrefectures.length:', missingPrefectures.length);
                            console.log('  - shouldDelete:', shouldDelete);
                            console.log('  - 条件: missingPrefectures.length > 0');
                            
                            if (missingPrefectures.length > 0) {
                                console.warn('⚠️ 以下の都道府県がCSVに含まれていません:', missingPrefectures.join(', '));
                                console.warn('これらの都道府県には店舗がない可能性があります。');
                                console.log('🗑️ 削除処理はCSV取込完了後に実行されます');
                            } else {
                                console.log('🔧 削除処理は実行されません');
                                console.log('  - 理由: missingPrefectures.length = 0');
                                console.log('  - CSVにすべての都道府県が含まれているか、削除対象がない');
                            }

                            // 複数店舗対応：各行で住所情報を個別に保存
                            const processedLocations = new Set(); // 重複住所防止用
                            let processedCount = 0;
                            let skippedCount = 0;
                            let errorCount = 0;
                            
                            // Supabase設定を最初に定義
                            const base = import.meta.env.VITE_SUPABASE_URL;
                            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
                            
                            for (const cols of completedRows) {
                              try {
                                processedCount++;
                                console.log(`=== 行 ${processedCount}/${completedRows.length} 処理開始 ===`);
                                console.log('CSV行データ:', cols);
                              const [store, brand, category, address, phone, hours, closed, sourceUrl, storeListUrl, rawMenuName, ...marks] = cols;
                              
                              // 空欄をNULLで対応：空文字列や"-"をnullに変換
                              const normalizeValue = (value) => {
                                if (!value || value.trim() === '' || value.trim() === '-') {
                                  return null;
                                }
                                return value.trim();
                              };
                              
                              const normalizedAddress = normalizeValue(address);
                              const normalizedPhone = normalizeValue(phone);
                              const normalizedHours = normalizeValue(hours);
                              const normalizedClosed = normalizeValue(closed);
                              const normalizedSourceUrl = normalizeValue(sourceUrl);
                              const normalizedStoreListUrl = normalizeValue(storeListUrl);
                              
                              // 宮城県の行を特定しやすくする
                              if (store && store.includes('宮城')) {
                                console.log('=== 宮城県の行を発見 ===');
                                console.log('宮城県の行データ:', { store, brand, category, address, phone, hours, closed, sourceUrl, storeListUrl, rawMenuName });
                                console.log('正規化後:', { normalizedAddress, normalizedPhone, normalizedHours, normalizedClosed, normalizedSourceUrl, normalizedStoreListUrl });
                              }
                              const menuName = (rawMenuName || '').replace(/[\u00A0\u2000-\u200B\u3000]/g,' ').trim();
                              
                              // A列（店舗名）が空または無効な場合はスキップ（productsテーブルに不要なレコードを作成しない）
                              if (!store || store.trim() === '' || 
                                  store.includes('（乳小麦卵使わないHB•ソイHB用）') ||
                                  store.includes('★') ||
                                  store.includes('ディッシュ') ||
                                  store.includes('バーグ') ||
                                  store.includes('サラダ') ||
                                  store.length < 2) {
                                console.log('A列（店舗名）が無効なため、メニュー情報の保存をスキップ:', store);
                                skippedCount++;
                                continue;
                              }
                              
                              // メニュー名が空でも住所情報がある場合は住所のみ保存
                              if (!menuName) { 
                                console.log('メニュー名が空 - 住所情報のみチェック', cols);
                                // 住所情報の正規化
                                const normalizeValue = (value) => {
                                  if (!value || value.trim() === '' || value.trim() === '-') {
                                    return null;
                                  }
                                  return value.trim();
                                };
                                
                                const normalizedAddress = normalizeValue(address);
                                const normalizedPhone = normalizeValue(phone);
                                const normalizedHours = normalizeValue(hours);
                                const normalizedClosed = normalizeValue(closed);
                                const normalizedSourceUrl = normalizeValue(sourceUrl);
                                const normalizedStoreListUrl = normalizeValue(storeListUrl);
                                
                                // A列（店舗名）が空の場合は、既存の店舗（びっくりドンキー）に関連付けて住所情報を保存
                                let targetProductId = null;
                                if (!store || store.trim() === '') {
                                  console.log('A列（店舗名）が空のため、既存の店舗に関連付けて住所情報を保存');
                                  // 既存の店舗（びっくりドンキー）を検索
                                  const findRes = await fetch(`${base}/rest/v1/products?name=eq.びっくりドンキー&select=id`, { headers:{ apikey:key, Authorization:`Bearer ${key}` }});
                                  if (findRes.ok) {
                                    const findJson = await findRes.json();
                                    targetProductId = findJson[0]?.id;
                                  }
                                  if (!targetProductId) {
                                    console.log('既存の店舗が見つからないため、スキップ');
                                    continue;
                                  }
                                }
                                
                                // 住所情報がある場合は保存
                                const shouldSaveLocation = normalizedAddress || normalizedPhone || normalizedHours || normalizedClosed || normalizedSourceUrl || normalizedStoreListUrl;
                                if (shouldSaveLocation) {
                                  console.log('住所情報のみ保存:', { address: normalizedAddress, phone: normalizedPhone });
                                  
                                  // 店舗情報を取得または作成
                                  let pid = targetProductId;
                                  if (!pid) {
                                    const product = { name: (store||'').trim(), brand: (brand||'').trim() || null, category: (category||'').trim() || null, source_url: (sourceUrl||'').trim() || null };
                                    
                                    // 店舗の取得または作成
                                    const pRes = await fetch(`${base}/rest/v1/products?on_conflict=name,brand`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([product]) });
                                    if (!pRes.ok) { const t = await pRes.text(); throw new Error(`products作成エラー ${pRes.status}: ${t}`); }
                                    const pJson = await pRes.json();
                                    pid = pJson[0]?.id;
                                  }
                                  
                                  if (pid) {
                                    // 住所情報の保存
                                    const locationKey = `${pid}_${normalizedAddress}`;
                                    if (!processedLocations.has(locationKey)) {
                                      const locationPayload = [{ 
                                        product_id: pid, 
                                        branch_name: null,
                                        address: normalizedAddress, 
                                        phone: normalizedPhone, 
                                        hours: normalizedHours, 
                                        closed: normalizedClosed, 
                                        source_url: normalizedSourceUrl, 
                                        store_list_url: normalizedStoreListUrl,
                                        notes: null 
                                      }];
                                      console.log('住所のみ保存:', locationPayload);
                                      const slRes = await fetch(`${base}/rest/v1/store_locations?on_conflict=product_id,address`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation,resolution=merge-duplicates' }, body: JSON.stringify(locationPayload) });
                                      if (!slRes.ok) { const t = await slRes.text(); console.warn(`store_locations作成エラー ${slRes.status}: ${t}`); }
                                      processedLocations.add(locationKey);
                                      console.log('住所保存完了:', normalizedAddress);
                                    }
                                  }
                                }
                                continue; 
                              }
                              if (/^[-\s]*$/.test(menuName)) continue; // 空のメニュー名のみスキップ（★で始まるメニュー名は住所情報がある場合は処理を続行）
                              
                              const product = { name: (store||'').trim(), brand: (brand||'').trim() || null, category: (category||'').trim() || null, source_url: (sourceUrl||'').trim() || null };
                              console.log('marks:', marks);
                              console.log('expected配列:', expected);
                              console.log('expected[9]:', expected[9]);
                              console.log('expected[10]:', expected[10]);
                              const menuAllergies = marks.map((m,i)=>({ 
                                allergy_item_id: idMap[expected[10+i]], 
                                presence_type: toPresence(m||'－'), 
                                amount_level: (m==='△'?'trace':(m==='●'?'unknown':'none')),
                                notes: null
                              }));
                              console.log('menuAllergies生成データ:', menuAllergies);
                              console.log('menuAllergies最初の要素:', menuAllergies[0]);

                              // products + product_allergiesはスキップし、menu_items中心に保存
                              // 既存products検索（同名）
                              const q = new URLSearchParams({ select:'id', name:`eq.${store}` });
                              const findRes = await fetch(`${base}/rest/v1/products?${q.toString()}`, { headers:{ apikey:key, Authorization:`Bearer ${key}` }});
                              let pid;
                              if (findRes.ok) {
                                const arr = await findRes.json();
                                pid = arr[0]?.id;
                              }
                              if (!pid) {
                                const up = await fetch(`${base}/rest/v1/products?on_conflict=name,brand`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([product]) });
                                if (!up.ok) { const t = await up.text(); throw new Error(`products作成/更新エラー ${up.status}: ${t}`); }
                                const upJson = await up.json();
                                pid = upJson?.[0]?.id;
                              } else {
                                await fetch(`${base}/rest/v1/products?id=eq.${pid}`, { method:'PATCH', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json' }, body: JSON.stringify({ source_url: product.source_url, brand: product.brand, category: product.category }) });
                              }
                              if (!pid) { alert('products作成に失敗しました'); break; }
                              
                              // store_locations（住所・電話情報）を各行で保存（重複チェック付き）
                              console.log(`店舗: ${store}, 住所: "${address}", 電話: "${phone}", 営業時間: "${hours}", 定休日: "${closed}", 情報元URL: "${sourceUrl}", 店舗リストURL: "${storeListUrl}"`);
                              console.log(`正規化後: 住所=${normalizedAddress}, 電話=${normalizedPhone}, 営業時間=${normalizedHours}, 定休日=${normalizedClosed}, 情報元URL=${normalizedSourceUrl}, 店舗リストURL=${normalizedStoreListUrl}`);
                              console.log(`条件チェック: address=${!!normalizedAddress}, phone=${!!normalizedPhone}, hours=${!!normalizedHours}, closed=${!!normalizedClosed}, sourceUrl=${!!normalizedSourceUrl}, storeListUrl=${!!normalizedStoreListUrl}`);
                              const shouldSave = normalizedAddress || normalizedPhone || normalizedHours || normalizedClosed || normalizedSourceUrl || normalizedStoreListUrl;
                              console.log(`保存判定: ${shouldSave}`);
                              if (shouldSave) {
                                const locationKey = `${pid}_${normalizedAddress}`; // 重複チェック用キー（product_id + address）
                                console.log(`locationKey: ${locationKey}, 既に処理済み: ${processedLocations.has(locationKey)}`);
                                if (!processedLocations.has(locationKey)) {
                                  const locationPayload = [{ 
                                    product_id: pid, 
                                    branch_name: null, // 支店名は空
                                    address: normalizedAddress, 
                                    phone: normalizedPhone, 
                                    hours: normalizedHours, 
                                    closed: normalizedClosed, 
                                    source_url: normalizedSourceUrl, 
                                    store_list_url: normalizedStoreListUrl, // 店舗リストURL
                                    notes: null 
                                  }];
                                  console.log('store_locations保存データ:', locationPayload);
                                  const slRes = await fetch(`${base}/rest/v1/store_locations?on_conflict=product_id,address`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation,resolution=merge-duplicates' }, body: JSON.stringify(locationPayload) });
                                  if (!slRes.ok) { const t = await slRes.text(); console.warn(`store_locations作成エラー ${slRes.status}: ${t}`); }
                                  processedLocations.add(locationKey);
                                  console.log('store_locations保存完了');
                                  console.log(`保存されたデータ: 店舗ID=${pid}, 住所="${normalizedAddress}", 電話="${normalizedPhone}", 作成日時=${new Date().toISOString()}`);
                                } else {
                                  console.log('重複のためスキップ');
                                }
                              } else {
                                console.log('住所・電話・営業時間・定休日・URLがすべて空のためスキップ');
                              }
                              
                              // menu_items
                              const miRes = await fetch(`${base}/rest/v1/menu_items?on_conflict=product_id,name`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([{ product_id: pid, name: menuName }]) });
                              if (!miRes.ok) { const t = await miRes.text(); throw new Error(`menu_items作成エラー ${miRes.status}: ${t}`); }
                              const miJson = await miRes.json();
                              const menuId = miJson?.[0]?.id;
                              if (!menuId) { alert('menu_items作成に失敗しました'); break; }
                              // menu_item_allergies
                              await fetch(`${base}/rest/v1/menu_item_allergies?menu_item_id=eq.${menuId}`, { method:'DELETE', headers:{ apikey:key, Authorization:`Bearer ${key}` }});
                              const miaData = menuAllergies.map(a=>({ 
                                menu_item_id: menuId,
                                allergy_item_id: a.allergy_item_id,
                                presence_type: a.presence_type,
                                amount_level: a.amount_level,
                                notes: a.notes
                              }));
                              console.log('menu_item_allergies送信データ:', miaData);
                              console.log('送信データ最初の要素:', miaData[0]);
                              const miaRes = await fetch(`${base}/rest/v1/menu_item_allergies`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json' }, body: JSON.stringify(miaData) });
                              if (!miaRes.ok) { const t = await miaRes.text(); throw new Error(`menu_item_allergies作成エラー ${miaRes.status}: ${t}`); }
                              } catch (rowError) {
                                errorCount++;
                                console.error(`行 ${processedCount} でエラーが発生:`, rowError);
                                console.error('エラー詳細:', rowError.message);
                                // エラーが発生しても次の行の処理を続行
                                continue;
                              }
                            }
                            console.log('=== CSV取込完了:', new Date().toISOString(), '===');
                            console.log('処理統計:');
                            console.log('- 総行数:', completedRows.length);
                            console.log('- 処理済み:', processedCount);
                            console.log('- スキップ:', skippedCount);
                            console.log('- エラー:', errorCount);
                            console.log('- 保存された住所数:', processedLocations.size);
                            
                            // CSV取込完了後に削除処理を実行
                            if (missingPrefectures.length > 0) {
                                console.log('🗑️ CSV取込完了後の削除処理開始');
                                console.log('削除対象の都道府県:', missingPrefectures);
                                console.log('削除対象の都道府県数:', missingPrefectures.length);
                                
                                try {
                                    // 既存のstore_locationsから、CSVに含まれていない都道府県の店舗を削除
                                    const existingRes = await fetch(`${base}/rest/v1/store_locations?select=id,address,product_id`, { 
                                        headers: { apikey: key, Authorization: `Bearer ${key}` } 
                                    });
                                    
                                    if (existingRes.ok) {
                                        const existingLocations = await existingRes.json();
                                        console.log('📋 既存のstore_locations情報:');
                                        console.log('  - 既存のstore_locations数:', existingLocations.length);
                                        console.log('  - 既存の都道府県:', [...new Set(existingLocations.map(l => l.address))].sort());
                                        
                                        // CSVに含まれていない都道府県の店舗を特定
                                        const locationsToDelete = existingLocations.filter(loc => 
                                            loc.address && missingPrefectures.includes(loc.address)
                                        );
                                        
                                        console.log('🔍 削除対象の店舗特定:');
                                        console.log('  - 削除対象の店舗数:', locationsToDelete.length);
                                        console.log('  - 削除対象の都道府県:', locationsToDelete.map(l => l.address));
                                        console.log('  - 削除対象の店舗詳細:', locationsToDelete.map(l => ({ id: l.id, address: l.address, product_id: l.product_id })));
                                        
                                        if (locationsToDelete.length > 0) {
                                            console.log('🗑️ 削除処理開始:');
                                            
                                            // 物理削除
                                            for (const location of locationsToDelete) {
                                                console.log('削除中:', location.address, '(ID:', location.id, ')');
                                                const deleteRes = await fetch(`${base}/rest/v1/store_locations?id=eq.${location.id}`, { 
                                                    method: 'DELETE', 
                                                    headers: { apikey: key, Authorization: `Bearer ${key}` } 
                                                });
                                                if (deleteRes.ok) {
                                                    console.log('✅ 削除完了:', location.address);
                                                } else {
                                                    const errorText = await deleteRes.text();
                                                    console.warn('❌ 削除失敗:', location.address, deleteRes.status, errorText);
                                                }
                                            }
                                            console.log('🗑️ 削除処理完了');
                                        } else {
                                            console.log('削除対象の店舗はありません');
                                        }
                                    } else {
                                        console.error('既存のstore_locations取得エラー:', existingRes.status, await existingRes.text());
                                    }
                                } catch (error) {
                                    console.error('🚨 削除処理中にエラーが発生:', error);
                                    console.error('  - エラー名:', error.name);
                                    console.error('  - エラーメッセージ:', error.message);
                                    console.error('  - スタックトレース:', error.stack);
                                    console.warn('削除処理でエラーが発生しましたが、CSV取込は完了しています');
                                }
                            }
                            
                            // 欠落している都道府県がある場合は警告を表示
                            let alertMessage = `CSV取込が完了しました。\n処理行数: ${processedCount}\n保存された住所数: ${processedLocations.size}`;
                            if (missingPrefectures.length > 0) {
                                alertMessage += `\n\n⚠️ 注意: 以下の都道府県がCSVに含まれていません:\n${missingPrefectures.join(', ')}\n\nこれらの都道府県の店舗は削除されました。`;
                            }
                            
                            alert(alertMessage);
                            setCsvImporting(false);
                            setCsvFile(null);
                          } catch (err) {
                            setCsvImporting(false);
                            alert(err.message || 'CSV取り込み中にエラーが発生しました');
                          }
                          }}
                            className={`px-4 py-2 rounded ${csvFile ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                          >{csvImporting ? '取り込み中...' : 'CSVを取り込む'}</button>
                          <a
                            onClick={(e)=>{
                              // テンプレCSV生成（指定順 + 住所・電話情報 + 店舗リストURL）
                              const headers = ['店舗名','系列','カテゴリ','住所','電話番号','営業時間','定休日','情報元URL','店舗リストURL','メニュー名','卵','乳','小麦','そば','落花生','えび','かに','くるみ','大豆','牛肉','豚肉','鶏肉','さけ','さば','あわび','いか','いくら','オレンジ','キウイフルーツ','もも','りんご','やまいも','ゼラチン','バナナ','カシューナッツ','ごま','アーモンド','まつたけ'];
                              const samples = [
                                ['びっくりドンキー','ハンバーグレストラン','レストラン・店舗','東京都渋谷区宇田川町1-1','03-1234-5678','11:00-23:00','年中無休','https://example.com/allergy-info','https://www.bikkuri-donkey.com/store/','レギュラーバーグディッシュ', '－','－','－','－','－','－','－','－','－','●','●','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－'],
                                ['びっくりドンキー','ハンバーグレストラン','レストラン・店舗','東京都新宿区新宿3-1-1','03-2345-6789','10:00-24:00','火曜日','https://example.com/allergy-info','https://www.bikkuri-donkey.com/store/','チキンバーグディッシュ', '－','－','－','－','－','－','－','－','－','－','●','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－'],
                                ['びっくりドンキー','ハンバーグレストラン','レストラン・店舗','大阪府大阪市北区梅田1-1-1','06-3456-7890','11:00-22:00','水曜日','https://example.com/allergy-info','https://www.bikkuri-donkey.com/store/','フィッシュバーグディッシュ', '－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－','－']
                              ];
                              const csv = [headers, ...samples].map(r=>r.join(',')).join('\n');
                              const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                              const a = document.createElement('a');
                              a.href = URL.createObjectURL(blob);
                              a.download = 'アレルギー取込テンプレート.csv';
                              a.click();
                              URL.revokeObjectURL(a.href);
                              e.preventDefault();
                            }}
                            href="#"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >テンプレートをダウンロード</a>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">記号: ●=含有, △=工場由来(微量), －=不含</p>
                      </div>
                    </div>
                  </>
                )}

                {/* 撮影のコツ */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                    <SafeIcon icon={FiAlertCircle} className="w-5 h-5" />
                    <span>
                      {uploadType === 'image' ? 'きれいに撮影するコツ' : 'CSVアップロードについて'}
                    </span>
                  </h3>
                  {uploadType === 'image' ? (
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 原材料名の部分を中心に撮影してください</li>
                      <li>• 明るい場所で撮影し、影が入らないようにしてください</li>
                      <li>• 文字がぼけないよう、ピントを合わせてください</li>
                      <li>• パッケージ全体ではなく、成分表示部分を大きく撮影してください</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 店舗名・メニュー名・28品目（●/△/－）のCSVを取り込めます</li>
                      <li>• テンプレートCSVをダウンロードして編集してください</li>
                      <li>• 取込後はSupabaseに自動保存されます</li>
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* 撮影した画像の表示 */}
            {capturedImage && !isProcessing && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="撮影した商品画像"
                    className="w-full max-h-96 object-contain rounded-lg shadow-md"
                  />
                  <button
                    onClick={resetForm}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <SafeIcon icon={FiX} className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => processImage(null)}
                  className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  この画像で解析を開始
                </button>
              </div>
            )}

            {/* 処理中 */}
            {isProcessing && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {uploadType === 'image' ? '画像を解析しています...' : 'PDFを解析しています...'}
                </h3>
                <p className="text-gray-600">
                  AIが成分表示を読み取っています。しばらくお待ちください。
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: 情報確認・編集 */}
        {step === 2 && extractedInfo && (
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

            {/* 解析結果の信頼度 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">解析結果</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">信頼度:</span>
                  <span className={`font-semibold ${
                    extractedInfo.confidence >= 80 ? 'text-green-600' : 
                    extractedInfo.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {extractedInfo.confidence}%
                  </span>
                </div>
              </div>
              {extractedInfo.confidence < 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    解析の信頼度が低いため、情報を確認・修正してください。
                  </p>
                </div>
              )}
              
              {extractedInfo.pdfSource && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm flex items-center space-x-2">
                    <SafeIcon icon={FiFileText} className="w-4 h-4" />
                    <span>
                      {extractedInfo.restaurantInfo ? 
                        `${extractedInfo.restaurantInfo.name || 'レストラン'}のPDFから抽出された情報です。` :
                        'PDFから抽出された情報です。レストランの公式情報として処理されます。'
                      }
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* 撮影画像またはPDF情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <SafeIcon icon={extractedInfo.pdfSource ? FiFileText : FiImage} className="w-5 h-5" />
                <span>
                  {extractedInfo.pdfSource ? 
                    (extractedInfo.restaurantInfo ? 
                      `${extractedInfo.restaurantInfo.name}のPDF` : 
                      '解析したPDF'
                    ) : 
                    '撮影した画像'
                  }
                </span>
              </h3>
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="撮影した商品画像"
                  className="w-full max-h-48 object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <SafeIcon icon={FiFileText} className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {extractedInfo.restaurantInfo ? 
                      `${extractedInfo.restaurantInfo.name}のPDFから情報を抽出しました` :
                      'PDFから情報を抽出しました'
                    }
                  </p>
                  {extractedInfo.restaurantInfo?.sourceUrl && (
                    <a 
                      href={extractedInfo.restaurantInfo.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block"
                    >
                      元のPDFを確認
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 商品情報編集 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <SafeIcon icon={FiEdit3} className="w-5 h-5" />
                <span>{extractedInfo.pdfSource ? '店舗・レストラン情報' : '商品情報'}</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {extractedInfo.pdfSource ? '店舗名・レストラン名' : '商品名'}
                  </label>
                  <input
                    type="text"
                    value={editedInfo.productName}
                    onChange={(e) => handleInfoChange('productName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={extractedInfo.pdfSource ? '店舗名を入力' : '商品名を入力'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {extractedInfo.pdfSource ? '系列・チェーン名' : 'ブランド・メーカー'}
                  </label>
                  <input
                    type="text"
                    value={editedInfo.brand}
                    onChange={(e) => handleInfoChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={extractedInfo.pdfSource ? '系列名を入力' : 'ブランド名を入力'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {extractedInfo.pdfSource ? 'メニュー項目・原材料名' : '原材料名'}
                  </label>
                  <textarea
                    value={editedInfo.ingredients.join('\n')}
                    onChange={(e) => updateIngredients(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={extractedInfo.pdfSource ? 'メニュー項目を1行に1つずつ入力' : '原材料を1行に1つずつ入力'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {extractedInfo.pdfSource ? 'メニュー項目を1行に1つずつ入力してください' : '原材料を1行に1つずつ入力してください'}
                  </p>
                </div>
              </div>
            </div>

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

            {/* メモ・コメント */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">メモ・コメント（任意）</h3>
              <textarea
                value={editedInfo.notes}
                onChange={(e) => handleInfoChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder={extractedInfo.pdfSource ? '店舗の特徴や注意事項があれば入力してください' : '商品についての補足情報があれば入力してください'}
              />
            </div>

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
                disabled={!editedInfo.productName}
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
                <p><strong>{extractedInfo?.pdfSource ? '店舗名' : '商品名'}:</strong> {editedInfo.productName}</p>
                <p><strong>{extractedInfo?.pdfSource ? '系列' : 'ブランド'}:</strong> {editedInfo.brand}</p>
                <p><strong>アレルギー成分:</strong> {
                  editedInfo.allergens.length > 0
                    ? editedInfo.allergens.map(id => allergyOptions.find(a => a.id === id)?.name).join('、')
                    : 'なし'
                }</p>
              </div>
            </div>

            {/* あなた向けの判定（簡易表示） */}
            {(() => {
              const verdict = getPersonalVerdict();
              const color = verdict.level === 'ok' ? 'green' : verdict.level === 'ng' ? 'red' : 'yellow';
              return (
                <div className={`border rounded-lg p-4 mb-6 bg-${color}-50 border-${color}-200`}>
                  <h3 className={`font-semibold text-${color}-800 mb-1`}>あなた向けの判定</h3>
                  <p className={`text-${color}-700 font-medium`}>{verdict.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{verdict.reason}</p>
                </div>
              );
            })()}

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
              <button
                onClick={async () => {
                  try {
                    const base = import.meta.env.VITE_SUPABASE_URL;
                    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
                    const store = window.prompt('店舗名でフィルタ（例: びっくりドンキー）※空で全件', 'びっくりドンキー') || '';
                    const params = new URLSearchParams();
                    params.set('select', 'products(name,brand,category),menu_name,egg,milk,wheat,buckwheat,peanut,shrimp,crab,walnut,almond,abalone,squid,salmon_roe,orange,cashew,kiwi,beef,gelatin,sesame,salmon,mackerel,soybean,chicken,banana,pork,matsutake,peach,yam,apple');
                    params.set('products!inner()', '');
                    if (store.trim()) {
                      params.set('products.name', `ilike.*${store.trim()}*`);
                    }
                    params.set('order', 'id.desc');

                    const url = `${base}/rest/v1/product_allergies_matrix?${params.toString()}`.replace('products!inner()=', 'products!inner()');
                    const res = await fetch(url, {
                      headers: {
                        apikey: key,
                        Authorization: `Bearer ${key}`,
                        Accept: 'application/json'
                      }
                    });
                    if (!res.ok) throw new Error(`CSVエクスポート失敗 ${res.status}`);
                    const data = await res.json();

                    // 日本語ヘッダー（店舗名入り、びっくりドンキー想定の固定スキーマ）
                    const headers = ['店舗名','系列','カテゴリ','メニュー名','小麦','そば','卵','乳','落花生','えび','かに','くるみ','アーモンド','あわび','いか','いくら','オレンジ','カシューナッツ','キウイ','牛肉','ゼラチン','ごま','さけ','さば','大豆','鶏肉','バナナ','豚肉','まつたけ','もも','やまいも','りんご'];
                    const mapRow = (r) => ([
                      r.products?.name || '',
                      r.products?.brand || '',
                      r.products?.category || '',
                      r.menu_name || '',
                      r.wheat, r.buckwheat, r.egg, r.milk, r.peanut, r.shrimp, r.crab, r.walnut, r.almond, r.abalone, r.squid, r.salmon_roe, r.orange, r.cashew, r.kiwi, r.beef, r.gelatin, r.sesame, r.salmon, r.mackerel, r.soybean, r.chicken, r.banana, r.pork, r.matsutake, r.peach, r.yam, r.apple
                    ]);

                    const escapeCSV = (v) => {
                      const s = v == null ? '' : String(v);
                      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
                    };
                    const rows = data.map(mapRow);
                    const csv = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
                    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = (store.trim() ? `${store.trim()}_` : '') + 'アレルギー一覧.csv';
                    a.click();
                    URL.revokeObjectURL(a.href);
                  } catch (e) {
                    alert(e.message);
                  }
                }}
                className="flex-1 py-3 px-6 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors font-semibold"
              >
                CSVをダウンロード
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* CSV移行のためPDFモーダルは廃止 */}
    </div>
  );
};

export default Upload;