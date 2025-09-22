import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

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