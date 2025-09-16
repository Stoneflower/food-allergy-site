import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import AllergyStatusIcon from './AllergyStatusIcon';
import { useRestaurant } from '../context/RestaurantContext';

const { FiHeart, FiInfo, FiStar, FiClock, FiMapPin, FiShoppingCart, FiX } = FiIcons;

const FoodCard = ({ food, userSettings = {} }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { toggleFavorite, isFavorite } = useRestaurant();

  // 全体的な安全レベルを計算
  const getOverallSafetyLevel = () => {
    if (!food.allergens || food.allergens.length === 0) {
      return 'safe'; // アレルギー情報なしは安全
    }

    let dangerCount = 0;
    let warningCount = 0;
    let cautionCount = 0;

    food.allergens.forEach(allergen => {
      if (allergen.amount_category === '含有') {
        dangerCount++;
      } else if (allergen.amount_category === '少量') {
        warningCount++;
      } else if (allergen.amount_category === '微量') {
        // 微量でもユーザー設定次第
        if (!userSettings.allowTrace) {
          cautionCount++;
        }
      }
    });

    if (dangerCount > 0) return 'danger';
    if (warningCount > 0) return 'warning';
    if (cautionCount > 0) return 'caution';
    return 'safe';
  };

  const overallSafety = getOverallSafetyLevel();

  // 安全レベルに応じたカードスタイル
  const getCardStyle = () => {
    const styles = {
      safe: 'border-green-200 bg-green-50',
      caution: 'border-yellow-200 bg-yellow-50',
      warning: 'border-orange-200 bg-orange-50',
      danger: 'border-red-200 bg-red-50'
    };
    return styles[overallSafety] || 'border-gray-200 bg-white';
  };

  // 安全レベルのアイコンと色
  const getSafetyBadge = () => {
    const badges = {
      safe: { emoji: '✅', text: 'OK', color: 'text-green-700 bg-green-100' },
      caution: { emoji: '⚠️', text: '注意', color: 'text-yellow-700 bg-yellow-100' },
      warning: { emoji: '❌', text: 'NG', color: 'text-orange-700 bg-orange-100' },
      danger: { emoji: '🚫', text: '危険', color: 'text-red-700 bg-red-100' }
    };
    return badges[overallSafety] || badges.caution;
  };

  const safetyBadge = getSafetyBadge();
  const favoriteStatus = isFavorite(food.id, 'foods');

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(food.id, 'foods');
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.2 }}
        className={`
          bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 
          border-2 ${getCardStyle()} cursor-pointer relative
        `}
        onClick={() => setShowDetails(true)}
      >
        {/* 商品画像 */}
        <div className="relative">
          <img
            src={food.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'}
            alt={food.name}
            className="w-full h-48 object-cover"
          />
          
          {/* 安全レベルバッジ */}
          <div className={`
            absolute top-3 left-3 px-3 py-1 rounded-full border-2 border-white
            ${safetyBadge.color} font-bold text-sm flex items-center space-x-1
          `}>
            <span>{safetyBadge.emoji}</span>
            <span>{safetyBadge.text}</span>
          </div>

          {/* お気に入りボタン */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={`
              absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors
              ${favoriteStatus ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}
            `}
          >
            <SafeIcon icon={FiHeart} className="w-5 h-5" />
          </motion.button>

          {/* 評価 */}
          {food.rating && (
            <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
              <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold">{food.rating}</span>
            </div>
          )}
        </div>

        {/* カード内容 */}
        <div className="p-4">
          {/* 商品名 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {food.name}
          </h3>

          {/* ブランド・店舗 */}
          <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
            <SafeIcon icon={FiMapPin} className="w-4 h-4" />
            <span>{food.brand || food.store}</span>
          </div>

          {/* 価格 */}
          {food.price && (
            <div className="text-xl font-bold text-orange-600 mb-3">
              {food.price}
            </div>
          )}

          {/* アレルギー情報アイコン表示 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">アレルギー情報</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
              >
                <SafeIcon icon={FiInfo} className="w-3 h-3" />
                <span>詳細</span>
              </button>
            </div>
            
            {food.allergens && food.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {food.allergens.slice(0, 6).map((allergen, index) => (
                  <div key={index} className="flex flex-col items-center space-y-1">
                    <AllergyStatusIcon 
                      allergen={allergen}
                      userSettings={userSettings}
                      size="sm"
                      showTooltip={false}
                    />
                    <span className="text-xs text-gray-600 text-center">
                      {allergen.allergen_name}
                    </span>
                  </div>
                ))}
                {food.allergens.length > 6 && (
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    <span className="text-xs text-gray-600">+{food.allergens.length - 6}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <SafeIcon icon={FiHeart} className="w-4 h-4" />
                <span className="text-sm">アレルギー成分なし</span>
              </div>
            )}
          </div>

          {/* メタ情報 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <SafeIcon icon={FiClock} className="w-3 h-3" />
              <span>{food.lastUpdated || '情報更新日不明'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <SafeIcon icon={FiShoppingCart} className="w-3 h-3" />
              <span>{food.category || '食品'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 詳細モーダル */}
      {showDetails && (
        <FoodDetailModal 
          food={food}
          userSettings={userSettings}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

// 詳細モーダルコンポーネント
const FoodDetailModal = ({ food, userSettings, onClose }) => {
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
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{food.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiX} className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">{food.brand || food.store}</p>
        </div>

        {/* 商品画像 */}
        <div className="p-6">
          <img
            src={food.image || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600'}
            alt={food.name}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>

        {/* アレルギー情報詳細 */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 詳細なアレルギー情報</h3>
          
          {food.allergens && food.allergens.length > 0 ? (
            <div className="space-y-4">
              {food.allergens.map((allergen, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <AllergyStatusIcon 
                      allergen={allergen}
                      userSettings={userSettings}
                      size="lg"
                      showTooltip={true}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">{allergen.allergen_name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">含有量:</span>
                          <span className="ml-2 font-medium">{allergen.amount_category}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">由来:</span>
                          <span className="ml-2 font-medium">{allergen.source}</span>
                        </div>
                        {allergen.heat_sensitive && (
                          <div className="col-span-2">
                            <span className="text-orange-600 font-medium">🔥 加熱で変化する可能性があります</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-lg font-semibold text-green-700 mb-2">
                アレルギー成分は含まれていません
              </h4>
              <p className="text-gray-600">
                この食品は安心してお召し上がりいただけます
              </p>
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="p-6 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start space-x-3">
            <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">ご注意ください</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 製造工程での混入の可能性があります</li>
                <li>• アレルギーの症状には個人差があります</li>
                <li>• 必ず医師にご相談の上でお召し上がりください</li>
                <li>• 情報は投稿時点のものです。最新情報をご確認ください</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FoodCard;