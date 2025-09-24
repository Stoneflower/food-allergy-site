import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import ReviewModal from './ReviewModal';
import ProductUpdateModal from './ProductUpdateModal';
import UpdateHistoryPanel from './UpdateHistoryPanel';
import SourceBadge from './SourceBadge';

const { FiStar, FiShoppingCart, FiMapPin, FiExternalLink, FiShield, FiHeart, FiMessageCircle, FiInfo, FiEdit3, FiClock, FiAlertTriangle } = FiIcons;

const ProductCard = ({ product }) => {
  const { allergyOptions, toggleFavorite, isFavorite, addToHistory } = useRestaurant();
  
  // デバッグログ
  console.log('ProductCard - product:', product);
  console.log('ProductCard - product.availability:', product.availability);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [showUpdateHistory, setShowUpdateHistory] = useState(false);

  // 商品の更新状況を判定
  const hasRecentUpdates = product.lastUpdateReport && 
    new Date() - new Date(product.lastUpdateReport) < 30 * 24 * 60 * 60 * 1000; // 30日以内

  const hasPendingUpdates = product.pendingUpdates && product.pendingUpdates > 0;

  const getAllergyFreeItems = () => {
    if (!product.allergyFree || !Array.isArray(product.allergyFree)) {
      return [];
    }
    return product.allergyFree.map(allergyId => {
      const allergy = allergyOptions.find(a => a.id === allergyId);
      return allergy;
    }).filter(Boolean);
  };

  const handlePurchase = (store) => {
    console.log(`${store}で${product.name}を購入`);
    addToHistory(product);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(product.id, product.category);
  };

  const handleReviewClick = (e) => {
    e.stopPropagation();
    setShowReviewModal(true);
  };

  const handleUpdateClick = (e) => {
    e.stopPropagation();
    setShowUpdateModal(true);
  };

  const handleSourceClick = (e) => {
    e.stopPropagation();
    setShowSourceDetails(!showSourceDetails);
  };

  const handleUpdateHistoryClick = (e) => {
    e.stopPropagation();
    setShowUpdateHistory(!showUpdateHistory);
  };

  const handleReviewSubmit = (reviewData) => {
    console.log('レビュー投稿:', reviewData);
  };

  const handleUpdateSubmit = (updateData) => {
    console.log('更新報告:', updateData);
    // 実際にはここでAPIに送信し、商品情報を更新
  };

  const favoriteStatus = isFavorite(product.id, product.category);

  // サムネイル画像が表示されているかどうかを判定
  const hasThumbnailImage = product.image && 
    product.image !== 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=70&auto=format';

  return (
    <>
      <motion.div
        whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative"
      >
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=70&auto=format';
            }}
          />
          
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold">{product.rating}</span>
          </div>

          {/* 情報源バッジ */}
          <div className="absolute top-3 left-3">
            <SourceBadge source={product.source} />
          </div>

          {/* 更新状況バッジ */}
          {(hasRecentUpdates || hasPendingUpdates) && (
            <div className="absolute top-12 left-3 space-y-1">
              {hasRecentUpdates && (
                <div className="bg-blue-500 text-white rounded-full px-2 py-1 flex items-center space-x-1">
                  <SafeIcon icon={FiClock} className="w-3 h-3" />
                  <span className="text-xs font-semibold">最近更新</span>
                </div>
              )}
              {hasPendingUpdates && (
                <div className="bg-yellow-500 text-white rounded-full px-2 py-1 flex items-center space-x-1">
                  <SafeIcon icon={FiAlertTriangle} className="w-3 h-3" />
                  <span className="text-xs font-semibold">審査中</span>
                </div>
              )}
            </div>
          )}

          {product.allergyFree && product.allergyFree.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-green-500 text-white rounded-full px-2 py-1 flex items-center space-x-1">
              <SafeIcon icon={FiShield} className="w-4 h-4" />
              <span className="text-xs font-semibold">アレルギー対応</span>
            </div>
          )}
        </div>

        <div className="p-4 pb-16">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div className="flex items-center space-x-2 ml-2">
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">{product.price}</div>
              </div>
              {/* サムネイル画像が表示されていない場合のみ情報源ボタンを表示 */}
              {!hasThumbnailImage && (
                <button
                  onClick={handleSourceClick}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300"
                  title="情報源詳細"
                >
                  <SafeIcon icon={FiInfo} className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium">ブランド:</span>
              <span>{product.brand}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">カテゴリ:</span>
              <span>{product.type}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* 情報源詳細 */}
          {showSourceDetails && product.source && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="text-xs text-gray-600 space-y-1">
                {product.source.contributor && (
                  <div>投稿者: {product.source.contributor}</div>
                )}
                {product.source.lastUpdated && (
                  <div>更新: {new Date(product.source.lastUpdated).toLocaleDateString('ja-JP')}</div>
                )}
                {product.source.confidence && (
                  <div className="flex items-center space-x-2">
                    <span>信頼度:</span>
                    <div className={`px-2 py-1 rounded text-xs ${
                      product.source.confidence >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : product.source.confidence >= 60 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.source.confidence}%
                    </div>
                  </div>
                )}
                {product.source.reviewCount && (
                  <div>{product.source.reviewCount}人が確認済み</div>
                )}
                {product.source.uploadDate && (
                  <div>撮影日: {new Date(product.source.uploadDate).toLocaleDateString('ja-JP')}</div>
                )}
              </div>
            </div>
          )}

          {/* アレルギーフリー表示 */}
          {getAllergyFreeItems().length > 0 && (
            <div className="mb-4 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {getAllergyFreeItems().slice(0, 3).map(allergy => (
                  <span
                    key={allergy.id}
                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center space-x-1"
                  >
                    <span>{allergy.icon}</span>
                    <span>{allergy.name}フリー</span>
                  </span>
                ))}
                {getAllergyFreeItems().length > 3 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    +{getAllergyFreeItems().length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 購入先情報（簡略化） */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">購入先:</h4>
            <div className="flex flex-wrap gap-1">
              {(product.availability?.online || []).slice(0, 2).map((store, index) => (
                <button
                  key={index}
                  onClick={() => handlePurchase(store)}
                  className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs hover:bg-orange-200 transition-colors flex items-center space-x-1"
                >
                  <span>{store}</span>
                  <SafeIcon icon={FiExternalLink} className="w-3 h-3" />
                </button>
              ))}
              {(!product.availability?.online || product.availability.online.length === 0) && (
                <span className="text-gray-500 text-xs">購入先情報なし</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleUpdateClick}
            className="p-2 rounded-full bg-blue-500 text-white shadow-md transition-colors hover:bg-blue-600"
            title="情報を更新"
          >
            <SafeIcon icon={FiEdit3} className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full shadow-md transition-colors ${
              favoriteStatus 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-400 hover:text-red-500'
            }`}
          >
            <SafeIcon icon={FiHeart} className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReviewClick}
            className="p-2 rounded-full bg-white text-gray-400 hover:text-orange-500 shadow-md transition-colors"
          >
            <SafeIcon icon={FiMessageCircle} className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 更新履歴パネル */}
      {showUpdateHistory && (
        <div className="mt-4">
          <UpdateHistoryPanel 
            product={product} 
            updates={product.updateHistory || []} 
          />
        </div>
      )}

      {/* Modals */}
      {showReviewModal && (
        <ReviewModal
          item={product}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

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

export default ProductCard;