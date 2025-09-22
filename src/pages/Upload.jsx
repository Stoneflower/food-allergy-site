import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../lib/supabase';
import { PREFECTURES } from '../constants/prefectures';

const { FiCamera, FiUpload, FiX, FiCheck, FiAlertCircle, FiEdit3, FiSave, FiImage, FiRefreshCw, FiTrendingUp } = FiIcons;

const Upload = () => {
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
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showSimilarProducts, setShowSimilarProducts] = useState(false);
  const [channels, setChannels] = useState({
    restaurant: false,
    takeout: false,
    supermarket: false,
    onlineShop: false
  });
  const [selectedPrefecture, setSelectedPrefecture] = useState('すべて');
  
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

    Promise.all(imagePromises).then(images => {
      setCapturedImages(images);
      // 手動入力用の初期データを設定
      initializeManualInput();
      // 画像を表示して手動入力フォームに進む
      setStep(2);
    });
    
    // 複数枚選択されたことをユーザーに通知
    if (files.length > 1) {
      alert(`${files.length}枚の写真が選択されました。`);
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

      // products へ登録（name はブランド・メーカー入力、他はNULL）
      const insertPayload = {
        name: (editedInfo.brand || '').trim() || null,
        brand: null,
        category: categoryValue,
        description: null,
        image_url: null,
        image_id: null,
        barcode: null
      };

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([insertPayload])
        .select()
        .single();
      if (productError) throw productError;

      const productId = productData?.id;

      // 都道府県は「すべて」を含め常に store_locations.address として保存
      if (productId && selectedPrefecture) {
        const { error: locError } = await supabase
          .from('store_locations')
          .insert([{ product_id: productId, address: selectedPrefecture, branch_name: null, phone: null, hours: null, source_url: null, store_list_url: null, closed: null, notes: null }]);
        if (locError) throw locError;
      }

      // 香料に含まれるアレルギー成分を product_allergies へ presence_type='trace' で保存（複数可）
      if (productId && Array.isArray(fragranceAllergens) && fragranceAllergens.length > 0) {
        const rows = fragranceAllergens.map(allergyId => ({
          product_id: productId,
          allergy_item_id: allergyId,
          presence_type: 'trace',
          amount_level: 'unknown',
          notes: null
        }));
        const { error: paError } = await supabase
          .from('product_allergies')
          .insert(rows);
        if (paError) throw paError;
      }

      setStep(3);
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました。時間をおいて再度お試しください。');
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

            {capturedImages.length === 0 && !isProcessing && (
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
                    <li>• 文字がはっきり見えるよう、ピントを合わせてください</li>
                    <li>• パッケージ全体ではなく、成分表示部分を大きく撮影してください</li>
                    <li>• 最大3枚まで選択できます（参考用として表示されます）</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 撮影した画像の表示 */}
            {capturedImages.length > 0 && !isProcessing && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    選択された画像 ({capturedImages.length}枚)
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
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    画像を変更する
                  </button>
                </div>
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


            {/* 撮影画像 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
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
                    </div>
                  ))}
                </div>
              )}
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
                {/* 原材料名は仕様により非表示 */}
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

            {/* 香料に含まれるアレルギー成分 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">香料に含まれるアレルギー成分</h3>
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
              {fragranceAllergens.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">選択: {fragranceAllergens.map(id => allergyOptions.find(a => a.id === id)?.name).filter(Boolean).join('、')}</p>
              )}
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
    </div>
  );
};

export default Upload;