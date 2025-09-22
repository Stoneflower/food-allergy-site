import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import Tesseract from 'tesseract.js';

const { FiCamera, FiUpload, FiX, FiCheck, FiAlertCircle, FiEdit3, FiSave, FiImage, FiRefreshCw, FiTrendingUp } = FiIcons;

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
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const { allergyOptions } = useRestaurant();

  // カメラで撮影（複数枚対応）
  const handleCameraCapture = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleImageFiles(files);
    }
  };

  // ファイルアップロード（複数枚対応）
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleImageFiles(files);
    }
  };

  // 複数画像ファイル処理（上限3枚）
  const handleImageFiles = (files) => {
    // 上限チェック
    if (files.length > 3) {
      alert('最大3枚まで選択できます。最初の3枚を使用します。');
      files = files.slice(0, 3);
    }

    if (files.length === 1) {
      // 1枚の場合は従来通り
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        processImage(file);
      };
      reader.readAsDataURL(file);
    } else {
      // 複数枚の場合は最初の画像を表示して処理
      const firstFile = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        processImage(firstFile);
      };
      reader.readAsDataURL(firstFile);
      
      // 複数枚選択されたことをユーザーに通知
      if (files.length > 1) {
        alert(`${files.length}枚の写真が選択されました。最初の写真で解析を開始します。`);
      }
    }
  };

  // アレルギー成分の検出
  const detectAllergens = (text) => {
    const allergenKeywords = {
      'wheat': ['小麦', 'グルテン', 'wheat', 'gluten'],
      'soy': ['大豆', 'soy', 'soybean', 'レシチン'],
      'milk': ['乳', '牛乳', 'milk', '乳製品', 'バター', 'チーズ'],
      'egg': ['卵', 'egg', 'たまご'],
      'peanut': ['落花生', 'ピーナッツ', 'peanut'],
      'tree_nut': ['アーモンド', 'くるみ', 'カシューナッツ', 'almond', 'walnut'],
      'fish': ['魚', 'fish', 'さかな'],
      'shellfish': ['甲殻類', 'エビ', 'カニ', 'shrimp', 'crab'],
      'sesame': ['ごま', 'sesame'],
      'sulfite': ['亜硫酸', 'sulfite']
    };

    const detectedAllergens = [];
    const lowerText = text.toLowerCase();

    Object.entries(allergenKeywords).forEach(([allergenId, keywords]) => {
      const found = keywords.some(keyword => 
        lowerText.includes(keyword.toLowerCase()) || text.includes(keyword)
      );
      if (found) {
        detectedAllergens.push(allergenId);
      }
    });

    return detectedAllergens;
  };

  // 商品情報の抽出
  const extractProductInfo = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // 商品名の推定（最初の行または長い行）
    let productName = '';
    let brand = '';
    let ingredients = [];

    // 商品名の検出（最初の数行から推定）
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 3 && line.length < 50 && !line.includes('原材料') && !line.includes('成分')) {
        if (!productName) productName = line;
        else if (!brand && line.length < 30) brand = line;
      }
    }

    // 原材料の検出
    let inIngredientsSection = false;
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('原材料') || trimmedLine.includes('成分') || trimmedLine.includes('材料')) {
        inIngredientsSection = true;
        continue;
      }
      
      if (inIngredientsSection) {
        if (trimmedLine.includes('アレルギー') || trimmedLine.includes('注意') || trimmedLine.includes('製造')) {
          break;
        }
        
        // 原材料らしき行を抽出
        if (trimmedLine.length > 1 && trimmedLine.length < 100) {
          // カンマやスペースで分割
          const parts = trimmedLine.split(/[,、]/);
          parts.forEach(part => {
            const cleanPart = part.trim();
            if (cleanPart && cleanPart.length > 1 && !ingredients.includes(cleanPart)) {
              ingredients.push(cleanPart);
            }
          });
        }
      }
    }

    // デフォルト値の設定
    if (!productName) productName = '商品名を入力してください';
    if (!brand) brand = 'ブランド名を入力してください';
    if (ingredients.length === 0) ingredients = ['原材料を入力してください'];

    return { productName, brand, ingredients };
  };

  // 実際のOCR処理
  const processImage = async (file) => {
    setIsProcessing(true);
    
    try {
      // Tesseract.jsでOCR実行
      const { data: { text, confidence } } = await Tesseract.recognize(
        file,
        'jpn+eng', // 日本語と英語を認識
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR進捗: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log('OCR結果:', text);
      console.log('信頼度:', confidence);

      // 商品情報の抽出
      const { productName, brand, ingredients } = extractProductInfo(text);
      
      // アレルギー成分の検出
      const detectedAllergens = detectAllergens(text);

      const extractedInfo = {
        productName,
        brand,
        ingredients,
        allergens: detectedAllergens,
        confidence: Math.round(confidence * 100),
        lastUpdated: new Date(),
        rawText: text // デバッグ用
      };

      setExtractedInfo(extractedInfo);
      setSimilarProducts([]); // 実際のOCRでは類似商品検索は行わない
      setShowSimilarProducts(false);
      
      setEditedInfo({
        productName: extractedInfo.productName,
        brand: extractedInfo.brand,
        ingredients: extractedInfo.ingredients,
        allergens: extractedInfo.allergens,
        notes: `OCR信頼度: ${extractedInfo.confidence}%\n\n認識されたテキスト:\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`,
        lastUpdated: extractedInfo.lastUpdated,
        confidence: extractedInfo.confidence
      });
      
    } catch (error) {
      console.error('OCR処理エラー:', error);
      alert('画像の解析中にエラーが発生しました。手動で情報を入力してください。');
      
      // エラー時は空の情報を設定
      const errorInfo = {
        productName: '',
        brand: '',
        ingredients: [],
        allergens: [],
        confidence: 0,
        lastUpdated: new Date()
      };
      
      setExtractedInfo(errorInfo);
      setEditedInfo({
        ...errorInfo,
        notes: 'OCR処理でエラーが発生しました。手動で情報を入力してください。'
      });
    } finally {
      setIsProcessing(false);
      setStep(2);
    }
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

  // 投稿完了
  const handleSubmit = async () => {
    setIsProcessing(true);
    
    // 実際にはサーバーに送信
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 1000);
  };

  // リセット
  const resetForm = () => {
    setStep(1);
    setCapturedImage(null);
    setExtractedInfo(null);
    setSimilarProducts([]);
    setShowSimilarProducts(false);
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
                商品パッケージを撮影してアレルギー情報を取得できます
              </p>
            </div>

            {!capturedImage && !isProcessing && (
              <div className="space-y-4">
                {/* カメラ撮影ボタン */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors shadow-md"
                >
                  <SafeIcon icon={FiCamera} className="w-6 h-6" />
                  <span className="text-lg font-semibold">カメラで撮影する（最大3枚）</span>
                </button>

                {/* ファイルアップロードボタン */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                >
                  <SafeIcon icon={FiUpload} className="w-6 h-6" />
                  <span className="text-lg font-semibold">写真をアップロード（最大3枚）</span>
                </button>

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

                {/* 撮影のコツ */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                    <SafeIcon icon={FiAlertCircle} className="w-5 h-5" />
                    <span>きれいに撮影するコツ</span>
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 原材料名の部分を中心に撮影してください</li>
                    <li>• 明るい場所で撮影し、影が入らないようにしてください</li>
                    <li>• 文字がぼけないよう、ピントを合わせてください</li>
                    <li>• パッケージ全体ではなく、成分表示部分を大きく撮影してください</li>
                    <li>• 最大3枚まで選択できます（複数枚選択時は最初の写真で解析）</li>
                  </ul>
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
                  画像を解析しています...
                </h3>
                <p className="text-gray-600">
                  OCRで文字を読み取っています。しばらくお待ちください。
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
            </div>

            {/* 撮影画像 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <SafeIcon icon={FiImage} className="w-5 h-5" />
                <span>撮影した画像</span>
              </h3>
              <img
                src={capturedImage}
                alt="撮影した商品画像"
                className="w-full max-h-48 object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* 商品情報編集 */}
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
                    原材料名
                  </label>
                  <textarea
                    value={editedInfo.ingredients.join('\n')}
                    onChange={(e) => updateIngredients(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="原材料を1行に1つずつ入力"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    原材料を1行に1つずつ入力してください
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
                placeholder="商品についての補足情報があれば入力してください"
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
                disabled={!editedInfo.productName || !editedInfo.brand}
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
    </div>
  );
};

export default Upload;