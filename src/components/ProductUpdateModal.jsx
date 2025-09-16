import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';

const { FiX, FiAlertTriangle, FiCheck, FiEdit3, FiClock, FiUser, FiTrendingUp } = FiIcons;

const ProductUpdateModal = ({ product, onClose, onUpdate }) => {
  const [updateType, setUpdateType] = useState('info_change'); // 'info_change', 'discontinued', 'new_version'
  const [updatedInfo, setUpdatedInfo] = useState({
    productName: product.name,
    brand: product.brand,
    ingredients: product.ingredients || [],
    allergens: product.allergyFree || [],
    price: product.price || '',
    availability: product.availability || { supermarkets: [], online: [] },
    notes: ''
  });
  const [changeReason, setChangeReason] = useState('');
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { allergyOptions } = useRestaurant();

  const updateTypes = [
    {
      id: 'info_change',
      name: 'アレルギー情報の変更',
      description: '成分表示やアレルギー情報が変更された',
      icon: FiEdit3,
      color: 'text-blue-600'
    },
    {
      id: 'discontinued',
      name: '販売中止・廃盤',
      description: '商品が販売中止になった',
      icon: FiX,
      color: 'text-red-600'
    },
    {
      id: 'new_version',
      name: '新バージョン・リニューアル',
      description: '商品がリニューアルされて新しくなった',
      icon: FiTrendingUp,
      color: 'text-green-600'
    }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEvidenceImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAllergen = (allergenId) => {
    setUpdatedInfo(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter(id => id !== allergenId)
        : [...prev.allergens, allergenId]
    }));
  };

  const updateIngredients = (newIngredients) => {
    setUpdatedInfo(prev => ({
      ...prev,
      ingredients: newIngredients.split('\n').filter(item => item.trim())
    }));
  };

  const getChanges = () => {
    const changes = [];
    
    if (updatedInfo.productName !== product.name) {
      changes.push({
        field: '商品名',
        old: product.name,
        new: updatedInfo.productName
      });
    }

    if (updatedInfo.brand !== product.brand) {
      changes.push({
        field: 'ブランド',
        old: product.brand,
        new: updatedInfo.brand
      });
    }

    if (updatedInfo.price !== product.price) {
      changes.push({
        field: '価格',
        old: product.price || '未設定',
        new: updatedInfo.price || '未設定'
      });
    }

    // アレルギー成分の変更
    const oldAllergens = new Set(product.allergyFree || []);
    const newAllergens = new Set(updatedInfo.allergens);
    
    const addedAllergens = [...newAllergens].filter(a => !oldAllergens.has(a));
    const removedAllergens = [...oldAllergens].filter(a => !newAllergens.has(a));

    if (addedAllergens.length > 0) {
      changes.push({
        field: 'アレルギー成分（追加）',
        old: '',
        new: addedAllergens.map(id => {
          const allergy = allergyOptions.find(a => a.id === id);
          return allergy ? `${allergy.icon} ${allergy.name}` : id;
        }).join(', '),
        type: 'addition'
      });
    }

    if (removedAllergens.length > 0) {
      changes.push({
        field: 'アレルギー成分（削除）',
        old: removedAllergens.map(id => {
          const allergy = allergyOptions.find(a => a.id === id);
          return allergy ? `${allergy.icon} ${allergy.name}` : id;
        }).join(', '),
        new: '',
        type: 'removal'
      });
    }

    return changes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData = {
      productId: product.id,
      updateType,
      changes: getChanges(),
      updatedInfo,
      changeReason,
      evidenceImage,
      submittedBy: 'current_user', // 実際のユーザーIDに置き換え
      submittedAt: new Date(),
      status: 'pending_review'
    };

    try {
      // ここで実際のAPI呼び出しを行う
      await new Promise(resolve => setTimeout(resolve, 1500)); // モック遅延

      if (onUpdate) {
        onUpdate(updateData);
      }
      
      onClose();
    } catch (error) {
      console.error('更新報告の送信に失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUpdateType = updateTypes.find(type => type.id === updateType);
  const changes = getChanges();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiEdit3} className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-900">商品情報の更新報告</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">現在の商品情報</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">商品名:</span>
                <span className="ml-2 font-medium">{product.name}</span>
              </div>
              <div>
                <span className="text-gray-600">ブランド:</span>
                <span className="ml-2 font-medium">{product.brand}</span>
              </div>
              <div>
                <span className="text-gray-600">価格:</span>
                <span className="ml-2 font-medium">{product.price}</span>
              </div>
              <div>
                <span className="text-gray-600">最終更新:</span>
                <span className="ml-2 font-medium">
                  {product.source?.lastUpdated ? 
                    new Date(product.source.lastUpdated).toLocaleDateString('ja-JP') : 
                    '不明'
                  }
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Update Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                更新の種類
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {updateTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUpdateType(type.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      updateType === type.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <SafeIcon icon={type.icon} className={`w-5 h-5 ${type.color}`} />
                      <span className="font-semibold">{type.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Update Form based on type */}
            {updateType === 'info_change' && (
              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名
                  </label>
                  <input
                    type="text"
                    value={updatedInfo.productName}
                    onChange={(e) => setUpdatedInfo(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ブランド・メーカー
                  </label>
                  <input
                    type="text"
                    value={updatedInfo.brand}
                    onChange={(e) => setUpdatedInfo(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    価格
                  </label>
                  <input
                    type="text"
                    value={updatedInfo.price}
                    onChange={(e) => setUpdatedInfo(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="¥480"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    原材料名
                  </label>
                  <textarea
                    value={updatedInfo.ingredients.join('\n')}
                    onChange={(e) => updateIngredients(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="原材料を1行に1つずつ入力"
                  />
                </div>

                {/* Allergens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    含まれるアレルギー成分
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allergyOptions.map(allergy => (
                      <button
                        key={allergy.id}
                        type="button"
                        onClick={() => toggleAllergen(allergy.id)}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          updatedInfo.allergens.includes(allergy.id)
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
              </div>
            )}

            {updateType === 'discontinued' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">販売中止の報告</h4>
                </div>
                <p className="text-red-700 text-sm mb-4">
                  この商品が販売中止になったことを報告します。
                  他のユーザーが検索した際に「販売中止」として表示されます。
                </p>
              </div>
            )}

            {updateType === 'new_version' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <SafeIcon icon={FiTrendingUp} className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">リニューアル情報</h4>
                </div>
                <p className="text-green-700 text-sm mb-4">
                  この商品がリニューアルされた場合、新しい商品情報として登録することをお勧めします。
                </p>
              </div>
            )}

            {/* Change Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                変更理由・詳細
              </label>
              <textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="どこで気づいたか、いつ頃からの変更かなど詳細を教えてください"
                required
              />
            </div>

            {/* Evidence Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                証拠画像（任意）
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {evidenceImage && (
                <div className="mt-2">
                  <img
                    src={evidenceImage}
                    alt="証拠画像"
                    className="max-w-xs max-h-48 object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Changes Preview */}
            {changes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">変更点の確認</h4>
                <div className="space-y-2">
                  {changes.map((change, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-blue-900">{change.field}:</span>
                      <div className="ml-4 flex items-center space-x-2">
                        {change.old && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            旧: {change.old}
                          </span>
                        )}
                        {change.new && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            新: {change.new}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!changeReason.trim() || isSubmitting}
                className="flex-1 py-3 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiCheck} className="w-5 h-5" />
                    <span>更新を報告</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductUpdateModal;