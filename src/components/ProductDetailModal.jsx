import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import ProductUpdateModal from './ProductUpdateModal';
import UpdateHistoryPanel from './UpdateHistoryPanel';

const { FiX, FiStar, FiShield, FiEdit3, FiClock, FiExternalLink, FiAlertTriangle, FiCheck, FiImage } = FiIcons;

const ProductDetailModal = ({ product, onClose }) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { allergyOptions } = useRestaurant();

  const getAllergyInfo = () => {
    return allergyOptions.map(allergy => ({
      ...allergy,
      isSafe: product.allergyFree?.includes(allergy.id) || false
    }));
  };

  const safeAllergies = getAllergyInfo().filter(a => a.isSafe);
  const unsafeAllergies = getAllergyInfo().filter(a => !a.isSafe);

  // 最新の変更情報を取得
  const getLatestChanges = () => {
    if (!product.updateHistory || product.updateHistory.length === 0) {
      return null;
    }

    const approvedUpdates = product.updateHistory
      .filter(update => update.status === 'approved')
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return approvedUpdates.length > 0 ? approvedUpdates[0] : null;
  };

  const latestUpdate = getLatestChanges();

  const handleUpdateSubmit = (updateData) => {
    console.log('更新報告:', updateData);
    setShowUpdateModal(false);
  };

  return (
    <>
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
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-xl"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-xl"></div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full p-2 hover:bg-opacity-100 transition-all"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-lg font-semibold">{product.price}</span>
                <span>{product.brand}</span>
              </div>
            </div>
          </div>

          {/* Latest Update Alert */}
          {latestUpdate && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiClock} className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">最新の更新情報</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {new Date(latestUpdate.submittedAt).toLocaleDateString('ja-JP')}に
                {latestUpdate.submittedBy}さんによって情報が更新されました
              </p>
              {latestUpdate.changes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {latestUpdate.changes.map((change, index) => (
                    <span
                      key={index}
                      className={`text-xs px-2 py-1 rounded ${
                        change.type === 'addition' 
                          ? 'bg-green-100 text-green-800'
                          : change.type === 'removal'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {change.field}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex space-x-3 mb-6">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                <span>情報を更新</span>
              </button>
              
              {product.availability?.online?.length > 0 && (
                <button
                  onClick={() => window.open(product.availability.online[0], '_blank')}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
                  <span>購入する</span>
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: '概要' },
                  { id: 'allergy', label: 'アレルギー情報' },
                  { id: 'history', label: '更新履歴' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-3">商品詳細</h3>
                  
                  {/* 画像アップロード機能で登録された商品の場合、画像ボタンを表示 */}
                  {(product.source_url || product.source_url2) && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">商品画像:</span>
                        <div className="flex space-x-2">
                          {product.source_url && (
                            <button
                              onClick={() => window.open(product.source_url, '_blank')}
                              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
                            >
                              <SafeIcon icon={FiImage} className="w-3 h-3" />
                              <span>画像1</span>
                            </button>
                          )}
                          {product.source_url2 && (
                            <button
                              onClick={() => window.open(product.source_url2, '_blank')}
                              className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
                            >
                              <SafeIcon icon={FiImage} className="w-3 h-3" />
                              <span>画像2</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ブランド:</span>
                        <span className="font-medium">{product.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">カテゴリ:</span>
                        <span className="font-medium">{product.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">価格:</span>
                        <span className="font-medium">{product.price}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">評価:</span>
                        <span className="font-medium">{product.rating} / 5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">レビュー数:</span>
                        <span className="font-medium">{product.reviewCount}件</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">商品説明</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>

                {product.ingredients && product.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">原材料</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.ingredients.map((ingredient, index) => (
                          <div key={index} className="text-sm text-gray-700">
                            • {ingredient}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3">購入可能店舗</h3>
                  <div className="space-y-3">
                    {product.availability?.supermarkets?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">実店舗</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.availability.supermarkets.map((store, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {store}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {product.availability?.online?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">オンライン</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.availability.online.map((store, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {store}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'allergy' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {safeAllergies.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-800">対応済みアレルギー</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {safeAllergies.map(allergy => (
                        <div key={allergy.id} className="flex items-center space-x-2 text-green-700">
                          <span className="text-lg">{allergy.icon}</span>
                          <span className="text-sm font-medium">{allergy.name}フリー</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {unsafeAllergies.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <SafeIcon icon={FiAlertTriangle} className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-800">含まれる可能性のあるアレルギー成分</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {unsafeAllergies.map(allergy => (
                        <div key={allergy.id} className="flex items-center space-x-2 text-red-700">
                          <span className="text-lg">{allergy.icon}</span>
                          <span className="text-sm font-medium">{allergy.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafeIcon icon={FiShield} className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">ご注意</h3>
                  </div>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• アレルギー情報は参考情報です。購入前に必ずパッケージをご確認ください。</li>
                    <li>• 製造工程での混入の可能性もございます。</li>
                    <li>• 情報に変更があった場合は、更新報告をお願いします。</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <UpdateHistoryPanel 
                  product={product} 
                  updates={product.updateHistory || []} 
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Update Modal */}
      {showUpdateModal && (
        <ProductUpdateModal
          product={product}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleUpdateSubmit}
        />
      )}
    </>
  );
};

export default ProductDetailModal;