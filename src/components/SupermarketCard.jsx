import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import SourceBadge from './SourceBadge';

const { FiStar, FiMapPin, FiPhone, FiClock, FiShield, FiPackage, FiInfo } = FiIcons;

const SupermarketCard = ({ supermarket }) => {
  const [showSourceDetails, setShowSourceDetails] = useState(false);

  const handleSourceClick = (e) => {
    e.stopPropagation();
    setShowSourceDetails(!showSourceDetails);
  };

  // サムネイル画像が表示されているかどうかを判定
  const hasThumbnailImage = supermarket.image && 
    supermarket.image !== 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=70&auto=format';

  return (
    <motion.div
      whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative">
        <img 
          src={supermarket.image} 
          alt={supermarket.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
          <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-semibold">{supermarket.rating}</span>
        </div>
        
        {/* 情報源バッジ */}
        <div className="absolute top-3 left-3">
          <SourceBadge source={supermarket.source} />
        </div>
        
        <div className="absolute bottom-3 left-3 bg-blue-500 text-white rounded-full px-2 py-1 flex items-center space-x-1">
          <SafeIcon icon={FiPackage} className="w-4 h-4" />
          <span className="text-xs font-semibold">{supermarket.allergyFreeProducts}商品</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
            {supermarket.name}
          </h3>
          {/* サムネイル画像が表示されていない場合のみ情報源ボタンを表示 */}
          {(showSourceDetails || typeof window === 'undefined') && (
            <button
              onClick={handleSourceClick}
              className={`ml-2 p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 hidden md:inline-flex ${showSourceDetails ? '!inline-flex' : ''}`}
              title="情報源詳細"
            >
              <SafeIcon icon={FiInfo} className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* サムネイル画像が表示されていない場合のみエリア情報を表示 */}
        {(showSourceDetails || typeof window === 'undefined') && (
          <div className={`flex items-center space-x-4 text-sm text-gray-600 mb-3 hidden md:flex ${showSourceDetails ? '!flex' : ''}`}>
            <div className="flex items-center space-x-1">
              <SafeIcon icon={FiMapPin} className="w-4 h-4" />
              <span>{supermarket.area}</span>
            </div>
            <div className="flex items-center space-x-1">
              <SafeIcon icon={FiClock} className="w-4 h-4" />
              <span>{supermarket.hours}</span>
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {supermarket.description}
        </p>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center space-x-1">
            <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{supermarket.rating}</span>
            <span className="text-gray-500">({supermarket.reviewCount}件)</span>
          </div>
          <div className="flex items-center space-x-1 text-blue-600">
            <SafeIcon icon={FiShield} className="w-4 h-4" />
            <span className="text-sm font-medium">{supermarket.allergyFreeProducts}商品対応</span>
          </div>
        </div>

        {/* 情報源詳細 */}
        {showSourceDetails && supermarket.source && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs text-gray-600 space-y-1">
              {supermarket.source.contributor && (
                <div>投稿者: {supermarket.source.contributor}</div>
              )}
              {supermarket.source.lastUpdated && (
                <div>更新: {new Date(supermarket.source.lastUpdated).toLocaleDateString('ja-JP')}</div>
              )}
              {supermarket.source.confidence && (
                <div className="flex items-center space-x-2">
                  <span>信頼度:</span>
                  <div className={`px-2 py-1 rounded text-xs ${
                    supermarket.source.confidence >= 80 ? 'bg-green-100 text-green-800' :
                    supermarket.source.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {supermarket.source.confidence}%
                  </div>
                </div>
              )}
              {supermarket.source.reviewCount && (
                <div>{supermarket.source.reviewCount}人が確認済み</div>
              )}
            </div>
          </div>
        )}

        {/* 特徴 */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">特徴:</h4>
          <div className="flex flex-wrap gap-1">
            {supermarket.specialFeatures.map((feature, index) => (
              <span 
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* 連絡先情報 */}
        <div className="pt-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <SafeIcon icon={FiMapPin} className="w-3 h-3" />
            <span>{supermarket.address}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <SafeIcon icon={FiPhone} className="w-3 h-3" />
            <span>{supermarket.phone}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SupermarketCard;