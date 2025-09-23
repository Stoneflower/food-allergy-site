import React, { useState } from 'react';
// リスト表示では遷移させないため、Linkを使わずdiv化
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useRestaurant } from '../context/RestaurantContext';
import ReviewModal from './ReviewModal';
import SourceBadge from './SourceBadge';

const { FiStar, FiMapPin, FiDollarSign, FiShield, FiHeart, FiMessageCircle, FiInfo } = FiIcons;

const RestaurantCard = ({ restaurant }) => {
  const { allergyOptions, toggleFavorite, isFavorite, addToHistory } = useRestaurant();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  const getAllergyFreeItems = () => {
    if (!restaurant.allergyFree || !Array.isArray(restaurant.allergyFree)) {
      return [];
    }
    return restaurant.allergyFree.map(allergyId => {
      const allergy = allergyOptions.find(a => a.id === allergyId);
      return allergy;
    }).filter(Boolean);
  };

  const handleClick = () => {
    addToHistory(restaurant);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurant.id, restaurant.category || 'restaurants');
  };

  const handleReviewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReviewModal(true);
  };

  const handleSourceClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSourceDetails(!showSourceDetails);
  };

  const handleReviewSubmit = (reviewData) => {
    console.log('レビュー投稿:', reviewData);
    // ここで実際のレビュー投稿処理を行う
  };

  const favoriteStatus = isFavorite(restaurant.id, restaurant.category || 'restaurants');

  return (
    <>
      <motion.div
        whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative"
      >
        <div>
          <div className="relative">
            <img 
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=70&auto=format';
              }}
            />
            <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold">{restaurant.rating}</span>
            </div>
            
            {/* 情報源バッジ */}
            <div className="absolute top-3 left-3">
              <SourceBadge source={restaurant.source} />
            </div>
            
            {restaurant.allergyFree && restaurant.allergyFree.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-green-500 text-white rounded-full px-2 py-1 flex items-center space-x-1">
                <SafeIcon icon={FiShield} className="w-4 h-4" />
                <span className="text-xs font-semibold">アレルギー対応</span>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                {restaurant.name}
              </h3>
              <button
                onClick={handleSourceClick}
                className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <SafeIcon icon={FiInfo} className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiMapPin} className="w-4 h-4" />
                <span>{restaurant.area}</span>
              </div>
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiDollarSign} className="w-4 h-4" />
                <span>{restaurant.price}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {restaurant.description}
            </p>
            
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-500">{restaurant.cuisine}</span>
              <span className="text-gray-500">{restaurant.reviewCount}件のレビュー</span>
            </div>

            {/* 情報源詳細 */}
            {showSourceDetails && restaurant.source && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-600 space-y-1">
                  {restaurant.source.contributor && (
                    <div>投稿者: {restaurant.source.contributor}</div>
                  )}
                  {restaurant.source.lastUpdated && (
                    <div>更新: {new Date(restaurant.source.lastUpdated).toLocaleDateString('ja-JP')}</div>
                  )}
                  {restaurant.source.confidence && (
                    <div className="flex items-center space-x-2">
                      <span>信頼度:</span>
                      <div className={`px-2 py-1 rounded text-xs ${
                        restaurant.source.confidence >= 80 ? 'bg-green-100 text-green-800' :
                        restaurant.source.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.source.confidence}%
                      </div>
                    </div>
                  )}
                  {restaurant.source.reviewCount && (
                    <div>{restaurant.source.reviewCount}人が確認済み</div>
                  )}
                </div>
              </div>
            )}

            {/* Allergy Free Items */}
            {getAllergyFreeItems().length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {getAllergyFreeItems().slice(0, 4).map(allergy => (
                    <span 
                      key={allergy.id}
                      className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center space-x-1"
                    >
                      <span>{allergy.icon}</span>
                      <span>{allergy.name}フリー</span>
                    </span>
                  ))}
                  {getAllergyFreeItems().length > 4 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      +{getAllergyFreeItems().length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
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

      {showReviewModal && (
        <ReviewModal
          item={restaurant}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
};

export default RestaurantCard;